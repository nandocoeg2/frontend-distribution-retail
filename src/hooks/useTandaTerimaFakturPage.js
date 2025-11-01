import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import tandaTerimaFakturService from '../services/tandaTerimaFakturService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const DEFAULT_FILTERS = {
  groupCustomerId: '',
  companyId: '',
  code_supplier: '',
  statusId: '',
  termOfPaymentId: '',
  tanggal_start: '',
  tanggal_end: '',
};

const sanitizeFilters = (filters = {}) => {
  const sanitized = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        sanitized[key] = trimmed;
      }
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
};

const parseTandaTerimaFakturResponse = (response = {}) => {
  if (response?.success === false) {
    throw new Error(
      response?.error?.message || 'Failed to fetch tanda terima faktur data'
    );
  }

  const payload = response?.data ?? response;

  const dataCandidates = [
    payload?.items,
    payload?.data?.items,
    payload?.tandaTerimaFakturs,
    payload?.data?.tandaTerimaFakturs,
    payload?.results,
    payload?.data,
    Array.isArray(payload) ? payload : null,
  ];

  const results = dataCandidates.find((candidate) => Array.isArray(candidate)) || [];

  const paginationSource =
    payload?.pagination ??
    payload?.data?.pagination ??
    payload?.meta ??
    response?.pagination ??
    {};

  const currentPage =
    Number(paginationSource.currentPage ?? paginationSource.page) ||
    INITIAL_PAGINATION.currentPage;
  const itemsPerPage =
    Number(paginationSource.itemsPerPage ?? paginationSource.limit) ||
    INITIAL_PAGINATION.itemsPerPage;
  const totalItems =
    Number(paginationSource.totalItems ?? paginationSource.total) ||
    results.length ||
    0;
  const totalPages =
    Number(paginationSource.totalPages) ||
    Math.max(Math.ceil((totalItems || 1) / (itemsPerPage || 1)), 1);

  return {
    results,
    pagination: {
      currentPage,
      page: currentPage,
      totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage,
    },
  };
};

const resolveTandaTerimaFakturError = (error, fallbackMessage) => {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    fallbackMessage ||
    'Terjadi kesalahan pada tanda terima faktur'
  );
};

const useTandaTerimaFakturPage = () => {
  const navigate = useNavigate();
  const [tandaTerimaFakturs, setTandaTerimaFakturs] = useState([]);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchLoading, setSearchLoading] = useState(false);
  const filtersRef = useRef(DEFAULT_FILTERS);
  const activeFiltersRef = useRef({});
  const paginationRef = useRef(INITIAL_PAGINATION);
  const [activeFiltersVersion, setActiveFiltersVersion] = useState(0);

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const resolveLimit = useCallback((limit) => {
    if (typeof limit === 'number' && !Number.isNaN(limit) && limit > 0) {
      return limit;
    }

    const source = paginationRef.current || INITIAL_PAGINATION;

    return (
      source.itemsPerPage ||
      source.limit ||
      INITIAL_PAGINATION.itemsPerPage ||
      INITIAL_PAGINATION.limit ||
      10
    );
  }, []);

  const setDataFromResponse = useCallback((response) => {
    const { results, pagination: nextPagination } =
      parseTandaTerimaFakturResponse(response);
    setTandaTerimaFakturs(results);
    setPagination(nextPagination);
    paginationRef.current = nextPagination;
  }, []);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  const handleError = useCallback(
    (err, fallbackMessage) => {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }

      const message = resolveTandaTerimaFakturError(err, fallbackMessage);
      setError(message);
      if (message) {
        toastService.error(message);
      }
    },
    [handleAuthError]
  );

  const performFetch = useCallback(
    async ({
      page = 1,
      limit = resolveLimit(),
      filters: overrideFilters,
    } = {}) => {
      const activeFilters = overrideFilters ?? activeFiltersRef.current;
      const hasFilters =
        activeFilters && Object.keys(activeFilters).length > 0;

      setLoading(true);
      setError(null);
      setSearchLoading(hasFilters);

      try {
        const params = {
          page,
          limit,
          ...activeFilters,
        };

        const response = await tandaTerimaFakturService.getAll(params);

        setDataFromResponse(response);
      } catch (err) {
        handleError(err, 'Gagal memuat data tanda terima faktur');
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    },
    [handleError, resolveLimit, setDataFromResponse]
  );

  useEffect(() => {
    performFetch({ page: 1, limit: INITIAL_PAGINATION.itemsPerPage });
  }, [performFetch]);

  const handleFiltersChange = useCallback((field, value) => {
    filtersRef.current = {
      ...filtersRef.current,
      [field]: value,
    };
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const sanitized = sanitizeFilters(filtersRef.current);
    activeFiltersRef.current = sanitized;
    setActiveFiltersVersion((prev) => prev + 1);
    performFetch({
      page: 1,
      filters: sanitized,
    });
  }, [performFetch]);

  const handleResetFilters = useCallback(() => {
    filtersRef.current = DEFAULT_FILTERS;
    activeFiltersRef.current = {};
    setFilters(DEFAULT_FILTERS);
    setActiveFiltersVersion((prev) => prev + 1);
    performFetch({
      page: 1,
      filters: {},
    });
  }, [performFetch]);

  const handlePageChange = useCallback(
    (page) => {
      performFetch({
        page,
      });
    },
    [performFetch]
  );

  const handleLimitChange = useCallback(
    (limit) => {
      const resolvedLimit = resolveLimit(limit);
      performFetch({
        page: 1,
        limit: resolvedLimit,
      });
    },
    [performFetch, resolveLimit]
  );

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPagination = paginationRef.current || pagination;
    const currentPage =
      currentPagination.currentPage || currentPagination.page || 1;
    await performFetch({
      page: currentPage,
      limit: itemsPerPage,
    });
  }, [performFetch, resolveLimit, pagination]);

  const createTandaTerimaFaktur = useCallback(
    async (payload) => {
      try {
        const result = await tandaTerimaFakturService.create(payload);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to create tanda terima faktur'
          );
        }
        toastService.success('Tanda terima faktur berhasil dibuat');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return undefined;
        }

        const message = resolveTandaTerimaFakturError(
          err,
          'Gagal membuat tanda terima faktur'
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation]
  );

  const updateTandaTerimaFaktur = useCallback(
    async (id, payload) => {
      try {
        const result = await tandaTerimaFakturService.update(id, payload);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to update tanda terima faktur'
          );
        }
        toastService.success('Tanda terima faktur berhasil diperbarui');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return undefined;
        }

        const message = resolveTandaTerimaFakturError(
          err,
          'Gagal memperbarui tanda terima faktur'
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation]
  );

  const assignDocumentsToTandaTerimaFaktur = useCallback(
    async (id, payload = {}) => {
      if (!id) {
        return null;
      }

      const fakturPajakIds = Array.isArray(payload?.fakturPajakIds)
        ? payload.fakturPajakIds
        : [];
      const laporanIds = Array.isArray(payload?.laporanIds)
        ? payload.laporanIds
        : [];

      if (fakturPajakIds.length === 0 && laporanIds.length === 0) {
        toastService.error('Minimal satu dokumen harus dipilih.');
        return null;
      }

      try {
        const result = await tandaTerimaFakturService.assignDocuments(id, {
          fakturPajakIds,
          laporanIds,
        });

        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to assign documents to tanda terima faktur'
          );
        }

        toastService.success('Dokumen berhasil di-assign ke tanda terima faktur');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return null;
        }

        const message = resolveTandaTerimaFakturError(
          err,
          'Gagal meng-assign dokumen ke tanda terima faktur'
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation]
  );

  const unassignDocumentsFromTandaTerimaFaktur = useCallback(
    async (id, payload = {}) => {
      if (!id) {
        return null;
      }

      const fakturPajakIds = Array.isArray(payload?.fakturPajakIds)
        ? payload.fakturPajakIds
        : [];
      const laporanIds = Array.isArray(payload?.laporanIds)
        ? payload.laporanIds
        : [];

      if (fakturPajakIds.length === 0 && laporanIds.length === 0) {
        toastService.error('Minimal satu dokumen harus dipilih.');
        return null;
      }

      try {
        const result = await tandaTerimaFakturService.unassignDocuments(id, {
          fakturPajakIds,
          laporanIds,
        });

        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to unassign documents from tanda terima faktur'
          );
        }

        toastService.success('Dokumen berhasil di-unassign dari tanda terima faktur');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return null;
        }

        const message = resolveTandaTerimaFakturError(
          err,
          'Gagal meng-unassign dokumen dari tanda terima faktur'
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation]
  );

  const deleteTandaTerimaFakturRequest = useCallback(
    async (id) => {
      try {
        const result = await tandaTerimaFakturService.delete(id);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to delete tanda terima faktur'
          );
        }
        toastService.success('Tanda terima faktur berhasil dihapus');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return undefined;
        }

        const message = resolveTandaTerimaFakturError(
          err,
          'Gagal menghapus tanda terima faktur'
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation]
  );

  const deleteTandaTerimaFakturConfirmation = useDeleteConfirmation(
    deleteTandaTerimaFakturRequest,
    'Apakah Anda yakin ingin menghapus tanda terima faktur ini?',
    'Hapus Tanda Terima Faktur'
  );

  const fetchTandaTerimaFakturById = useCallback(
    async (id) => {
      if (!id) {
        return null;
      }

      try {
        const result = await tandaTerimaFakturService.getById(id);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to fetch tanda terima faktur detail'
          );
        }
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return null;
        }

        const message = resolveTandaTerimaFakturError(
          err,
          'Gagal memuat detail tanda terima faktur'
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError]
  );

  const hasActiveFilters = useMemo(() => {
    const active = activeFiltersRef.current || {};
    return Object.keys(active).length > 0;
  }, [activeFiltersVersion]);

  const searchQuery = useMemo(() => {
    if (!hasActiveFilters) {
      return '';
    }
    const active = activeFiltersRef.current || {};
    return (
      active.code_supplier ||
      active.groupCustomerId ||
      active.companyId ||
      'filter aktif'
    );
  }, [hasActiveFilters, activeFiltersVersion]);

  return {
    tandaTerimaFakturs,
    setTandaTerimaFakturs,
    pagination,
    setPagination,
    loading,
    error,
    filters,
    searchLoading,
    hasActiveFilters,
    searchQuery,
    handleFiltersChange,
    handleSearchSubmit,
    handleResetFilters,
    handlePageChange,
    handleLimitChange,
    createTandaTerimaFaktur,
    updateTandaTerimaFaktur,
    deleteTandaTerimaFaktur:
      deleteTandaTerimaFakturConfirmation.showDeleteConfirmation,
    deleteTandaTerimaFakturConfirmation,
    fetchTandaTerimaFaktur: performFetch,
    fetchTandaTerimaFakturById,
    assignDocuments: assignDocumentsToTandaTerimaFaktur,
    unassignDocuments: unassignDocumentsFromTandaTerimaFaktur,
    handleAuthError,
  };
};

export default useTandaTerimaFakturPage;
