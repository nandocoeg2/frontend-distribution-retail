import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import fakturPajakService from '../services/fakturPajakService';
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
  no_pajak: '',
  invoicePenagihanId: '',
  laporanPenerimaanBarangId: '',
  customerId: '',
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

const parseFakturPajakResponse = (response = {}) => {
  if (response?.success === false) {
    throw new Error(
      response?.error?.message || 'Failed to fetch faktur pajak data',
    );
  }

  const responseData = response?.data || response;
  const rawData =
    responseData?.fakturPajaks ??
    responseData?.data ??
    responseData?.results ??
    responseData ??
    [];

  const paginationSource =
    responseData?.pagination ??
    responseData?.meta ??
    responseData?.data?.pagination ??
    response?.pagination ??
    {};

  const currentPage =
    paginationSource.currentPage ??
    paginationSource.page ??
    INITIAL_PAGINATION.currentPage;
  const itemsPerPage =
    paginationSource.itemsPerPage ??
    paginationSource.limit ??
    INITIAL_PAGINATION.itemsPerPage;
  const totalItems =
    paginationSource.totalItems ??
    paginationSource.total ??
    (Array.isArray(rawData) ? rawData.length : 0);
  const totalPages =
    paginationSource.totalPages ??
    Math.max(Math.ceil((totalItems || 1) / (itemsPerPage || 1)), 1);

  const results = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.fakturPajaks)
      ? rawData.fakturPajaks
      : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

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

const resolveFakturPajakError = (error, fallbackMessage) => {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    fallbackMessage ||
    'Terjadi kesalahan pada faktur pajak'
  );
};

const useFakturPajakPage = () => {
  const navigate = useNavigate();
  const [fakturPajaks, setFakturPajaks] = useState([]);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchLoading, setSearchLoading] = useState(false);
  const filtersRef = useRef(DEFAULT_FILTERS);
  const activeFiltersRef = useRef({});
  const [activeFiltersVersion, setActiveFiltersVersion] = useState(0);

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const resolveLimit = useCallback(
    (limit) => {
      if (typeof limit === 'number' && !Number.isNaN(limit) && limit > 0) {
        return limit;
      }

      return (
        pagination?.itemsPerPage ||
        pagination?.limit ||
        INITIAL_PAGINATION.itemsPerPage ||
        INITIAL_PAGINATION.limit ||
        10
      );
    },
    [pagination],
  );

  const setDataFromResponse = useCallback((response) => {
    const { results, pagination: nextPagination } =
      parseFakturPajakResponse(response);
    setFakturPajaks(results);
    setPagination(nextPagination);
  }, []);

  const handleError = useCallback(
    (err, fallbackMessage) => {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }

      const message = resolveFakturPajakError(err, fallbackMessage);
      setError(message);
      if (message) {
        toastService.error(message);
      }
    },
    [handleAuthError],
  );

  const performFetch = useCallback(
    async ({
      page = 1,
      limit = resolveLimit(),
      filters: overrideFilters,
    } = {}) => {
      const activeFilters = overrideFilters ?? activeFiltersRef.current;

      setLoading(true);
      setError(null);

      try {
        let response;

        if (activeFilters && Object.keys(activeFilters).length > 0) {
          response = await fakturPajakService.searchFakturPajak(
            activeFilters,
            page,
            limit,
          );
        } else {
          response = await fakturPajakService.getAllFakturPajak(page, limit);
        }

        setDataFromResponse(response);
      } catch (err) {
        handleError(err, 'Gagal memuat data faktur pajak');
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    },
    [handleError, resolveLimit, setDataFromResponse],
  );

  useEffect(() => {
    performFetch({ page: 1 });
  }, [performFetch]);

  const handleFiltersChange = useCallback((field, value) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };
      filtersRef.current = next;
      return next;
    });
  }, []);

  const handleSearchSubmit = useCallback(async () => {
    const sanitized = sanitizeFilters(filtersRef.current);
    activeFiltersRef.current = sanitized;
    setActiveFiltersVersion((version) => version + 1);
    setSearchLoading(true);
    await performFetch({
      page: 1,
      filters: sanitized,
    });
  }, [performFetch]);

  const handleResetFilters = useCallback(async () => {
    filtersRef.current = DEFAULT_FILTERS;
    activeFiltersRef.current = {};
    setFilters(DEFAULT_FILTERS);
    setActiveFiltersVersion((version) => version + 1);
    setSearchLoading(false);
    await performFetch({
      page: 1,
      filters: {},
    });
  }, [performFetch]);

  const handlePageChange = useCallback(
    (page) => {
      performFetch({ page });
    },
    [performFetch],
  );

  const handleLimitChange = useCallback(
    (limit) => {
      performFetch({ page: 1, limit });
    },
    [performFetch],
  );

  const refreshAfterMutation = useCallback(async () => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    await performFetch({ page: currentPage });
  }, [pagination, performFetch]);

  const createFakturPajak = useCallback(
    async (payload) => {
      try {
        const result = await fakturPajakService.createFakturPajak(payload);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to create faktur pajak',
          );
        }
        toastService.success('Faktur pajak berhasil dibuat');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return undefined;
        }

        const message = resolveFakturPajakError(
          err,
          'Gagal membuat faktur pajak',
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation],
  );

  const updateFakturPajak = useCallback(
    async (id, payload) => {
      try {
        const result = await fakturPajakService.updateFakturPajak(
          id,
          payload,
        );
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to update faktur pajak',
          );
        }
        toastService.success('Faktur pajak berhasil diperbarui');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return undefined;
        }

        const message = resolveFakturPajakError(
          err,
          'Gagal memperbarui faktur pajak',
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation],
  );

  const deleteFakturPajakRequest = useCallback(
    async (id) => {
      try {
        const result = await fakturPajakService.deleteFakturPajak(id);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to delete faktur pajak',
          );
        }
        toastService.success('Faktur pajak berhasil dihapus');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return undefined;
        }

        const message = resolveFakturPajakError(
          err,
          'Gagal menghapus faktur pajak',
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation],
  );

  const deleteFakturPajakConfirmation = useDeleteConfirmation(
    deleteFakturPajakRequest,
    'Apakah Anda yakin ingin menghapus faktur pajak ini?',
    'Hapus Faktur Pajak',
  );

  const fetchFakturPajakById = useCallback(
    async (id) => {
      if (!id) {
        return null;
      }

      try {
        const result = await fakturPajakService.getFakturPajakById(id);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to fetch faktur pajak detail',
          );
        }
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return null;
        }

        const message = resolveFakturPajakError(
          err,
          'Gagal memuat detail faktur pajak',
        );
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError],
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
      active.no_pajak ||
      active.customerId ||
      active.invoicePenagihanId ||
      active.laporanPenerimaanBarangId ||
      'filter aktif'
    );
  }, [hasActiveFilters, activeFiltersVersion]);

  return {
    fakturPajaks,
    setFakturPajaks,
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
    createFakturPajak,
    updateFakturPajak,
    deleteFakturPajak: deleteFakturPajakConfirmation.showDeleteConfirmation,
    deleteFakturPajakConfirmation,
    fetchFakturPajak: performFetch,
    fetchFakturPajakById,
    handleAuthError,
  };
};

export default useFakturPajakPage;
