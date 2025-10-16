import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import kwitansiService from '../services/kwitansiService';
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
  no_kwitansi: '',
  kepada: '',
  statusId: '',
  termOfPaymentId: '',
  invoicePenagihanId: '',
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

const parseKwitansiResponse = (response = {}) => {
  if (response?.success === false) {
    throw new Error(
      response?.error?.message || 'Failed to fetch kwitansi data'
    );
  }

  const responseData = response?.data || response;
  const rawData =
    responseData?.kwitansis ??
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
    : Array.isArray(rawData?.kwitansis)
      ? rawData.kwitansis
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

const resolveKwitansiError = (error, fallbackMessage) => {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    fallbackMessage ||
    'Terjadi kesalahan pada kwitansi'
  );
};

const useKwitansiPage = () => {
  const navigate = useNavigate();
  const [kwitansis, setKwitansis] = useState([]);
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
    [pagination]
  );

  const setDataFromResponse = useCallback((response) => {
    const { results, pagination: nextPagination } =
      parseKwitansiResponse(response);
    setKwitansis(results);
    setPagination(nextPagination);
  }, []);

  const handleError = useCallback(
    (err, fallbackMessage) => {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }

      const message = resolveKwitansiError(err, fallbackMessage);
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

      setLoading(true);
      setError(null);

      try {
        let response;

        if (activeFilters && Object.keys(activeFilters).length > 0) {
          response = await kwitansiService.searchKwitansi(
            activeFilters,
            page,
            limit
          );
        } else {
          response = await kwitansiService.getAllKwitansi(page, limit);
        }

        setDataFromResponse(response);
      } catch (err) {
        handleError(err, 'Gagal memuat data kwitansi');
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    },
    [handleError, resolveLimit, setDataFromResponse]
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
    [performFetch]
  );

  const handleLimitChange = useCallback(
    (limit) => {
      performFetch({ page: 1, limit });
    },
    [performFetch]
  );

  const refreshAfterMutation = useCallback(async () => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    await performFetch({ page: currentPage });
  }, [pagination, performFetch]);

  const createKwitansi = useCallback(
    async (payload) => {
      try {
        const result = await kwitansiService.createKwitansi(payload);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to create kwitansi'
          );
        }
        toastService.success('Kwitansi berhasil dibuat');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return undefined;
        }

        const message = resolveKwitansiError(err, 'Gagal membuat kwitansi');
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation]
  );

  const updateKwitansi = useCallback(
    async (id, payload) => {
      try {
        const result = await kwitansiService.updateKwitansi(id, payload);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to update kwitansi'
          );
        }
        toastService.success('Kwitansi berhasil diperbarui');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return undefined;
        }

        const message = resolveKwitansiError(err, 'Gagal memperbarui kwitansi');
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation]
  );

  const deleteKwitansiRequest = useCallback(
    async (id) => {
      try {
        const result = await kwitansiService.deleteKwitansi(id);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to delete kwitansi'
          );
        }
        toastService.success('Kwitansi berhasil dihapus');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return undefined;
        }

        const message = resolveKwitansiError(err, 'Gagal menghapus kwitansi');
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthError, refreshAfterMutation]
  );

  const deleteKwitansiConfirmation = useDeleteConfirmation(
    deleteKwitansiRequest,
    'Apakah Anda yakin ingin menghapus kwitansi ini?',
    'Hapus Kwitansi'
  );

  const fetchKwitansiById = useCallback(
    async (id) => {
      if (!id) {
        return null;
      }

      try {
        const result = await kwitansiService.getKwitansiById(id);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to fetch kwitansi detail'
          );
        }
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return null;
        }

        const message = resolveKwitansiError(
          err,
          'Gagal memuat detail kwitansi'
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
      active.no_kwitansi ||
      active.kepada ||
      active.invoicePenagihanId ||
      'filter aktif'
    );
  }, [hasActiveFilters, activeFiltersVersion]);

  return {
    kwitansis,
    setKwitansis,
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
    createKwitansi,
    updateKwitansi,
    deleteKwitansi: deleteKwitansiConfirmation.showDeleteConfirmation,
    deleteKwitansiConfirmation,
    fetchKwitansi: performFetch,
    fetchKwitansiById,
    handleAuthError,
  };
};

export default useKwitansiPage;
