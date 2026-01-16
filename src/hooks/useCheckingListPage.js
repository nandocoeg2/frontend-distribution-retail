import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import checkingListService from '../services/checkingListService';
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
  statusId: '',
  no_surat_jalan: '',
  deliver_to: '',
  PIC: '',
  checker: '',
  driver: '',
  mobil: '',
  kota: '',
  tanggal_from: '',
  tanggal_to: '',
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

const parseChecklistsResponse = (response = {}) => {
  if (response?.success === false) {
    throw new Error(
      response?.error?.message || 'Failed to fetch checklist surat jalan'
    );
  }

  const rawData =
    response?.data?.checklistSuratJalans ??
    response?.data?.data ??
    response?.data ??
    [];

  const paginationData =
    response?.data?.pagination ?? response?.pagination ?? {};

  const currentPage =
    paginationData.currentPage ?? paginationData.page ?? INITIAL_PAGINATION.page;
  const itemsPerPage =
    paginationData.itemsPerPage ??
    paginationData.limit ??
    INITIAL_PAGINATION.itemsPerPage;
  const totalItems =
    paginationData.totalItems ??
    paginationData.total ??
    (Array.isArray(rawData) ? rawData.length : INITIAL_PAGINATION.totalItems);
  const totalPages =
    paginationData.totalPages ??
    Math.max(Math.ceil((totalItems || 1) / (itemsPerPage || 1)), 1);

  const results = Array.isArray(rawData)
    ? rawData
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

const resolveChecklistsError = (error) => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    'Failed to load checklist surat jalan'
  );
};

const useCheckingListPage = () => {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState([]);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchLoading, setSearchLoading] = useState(false);
  const filtersRef = useRef(DEFAULT_FILTERS);
  const activeFiltersRef = useRef({});
  const paginationRef = useRef(INITIAL_PAGINATION);
  const [activeFiltersVersion, setActiveFiltersVersion] = useState(0);

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const resolveLimit = useCallback((pageState) => {
    const state =
      pageState ||
      paginationRef.current ||
      INITIAL_PAGINATION;

    return (
      state.itemsPerPage ||
      state.limit ||
      INITIAL_PAGINATION.itemsPerPage ||
      10
    );
  }, []);

  const performFetch = useCallback(
    async ({
      page = 1,
      limit = resolveLimit(),
      filters: overrideFilters,
    } = {}) => {
      const sanitizedFilters = sanitizeFilters(
        overrideFilters ?? activeFiltersRef.current
      );
      const hasFilters = Object.keys(sanitizedFilters).length > 0;

      setLoading(true);
      setError(null);

      try {
        const response = hasFilters
          ? await checkingListService.searchChecklists(
            sanitizedFilters,
            page,
            limit
          )
          : await checkingListService.getAllChecklists(page, limit);

        const { results, pagination: nextPagination } =
          parseChecklistsResponse(response);

        const mergedPagination = {
          ...INITIAL_PAGINATION,
          ...nextPagination,
          currentPage: nextPagination.currentPage ?? page,
          page: nextPagination.page ?? page,
          itemsPerPage: nextPagination.itemsPerPage ?? limit,
          limit: nextPagination.limit ?? limit,
        };

        setChecklists(results || []);
        setPagination(mergedPagination);
        paginationRef.current = mergedPagination;

        if (hasFilters) {
          activeFiltersRef.current = sanitizedFilters;
        }

        return response;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthRedirect();
          return null;
        }

        const message = resolveChecklistsError(err);
        setError(message);
        if (message) {
          toastService.error(message);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleAuthRedirect, resolveLimit]
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

    try {
      await performFetch({
        page: 1,
        filters: sanitized,
      });
    } finally {
      setSearchLoading(false);
    }
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
    const currentPagination =
      paginationRef.current || pagination || INITIAL_PAGINATION;

    const currentPage =
      currentPagination.currentPage ||
      currentPagination.page ||
      INITIAL_PAGINATION.currentPage;

    const limit = resolveLimit(currentPagination);

    await performFetch({
      page: currentPage,
      limit,
      filters: activeFiltersRef.current,
    });
  }, [pagination, performFetch, resolveLimit]);

  const authHandler = useCallback(() => {
    handleAuthRedirect();
  }, [handleAuthRedirect]);

  const createChecklist = useCallback(
    async (payload) => {
      try {
        const result = await checkingListService.createChecklist(payload);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to create checklist surat jalan'
          );
        }
        toastService.success('Checklist surat jalan berhasil dibuat');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return undefined;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to create checklist surat jalan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation]
  );

  const updateChecklist = useCallback(
    async (id, payload) => {
      try {
        const result = await checkingListService.updateChecklist(id, payload);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to update checklist surat jalan'
          );
        }
        toastService.success('Checklist surat jalan berhasil diperbarui');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return undefined;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to update checklist surat jalan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation]
  );

  const bulkDeleteChecklists = useCallback(
    async (ids = []) => {
      const payloadIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

      if (!payloadIds.length) {
        toastService.warning('Pilih minimal satu checklist surat jalan untuk dihapus.');
        return null;
      }

      try {
        const result = await checkingListService.bulkDeleteChecklists(payloadIds);

        if (result?.success === false) {
          throw new Error(
            result?.message ||
            result?.error?.message ||
            'Failed to delete checklist surat jalan'
          );
        }

        const responseData = result?.data || result || {};
        const successItems = Array.isArray(responseData?.success) ? responseData.success : [];
        const failedItems = Array.isArray(responseData?.failed) ? responseData.failed : [];

        if (successItems.length > 0) {
          const baseMessage = `Berhasil menghapus ${successItems.length} checklist surat jalan.`;
          if (failedItems.length > 0) {
            toastService.success(`${baseMessage} ${failedItems.length} checklist gagal dihapus.`);
          } else {
            toastService.success(baseMessage);
          }
        }

        if (!successItems.length && failedItems.length > 0) {
          toastService.warning(`${failedItems.length} checklist gagal dihapus.`);
        }

        await refreshAfterMutation();
        return { success: successItems, failed: failedItems };
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return null;
        }

        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to delete checklist surat jalan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation]
  );

  const bulkDeleteConfirmation = useDeleteConfirmation(
    bulkDeleteChecklists,
    'Apakah Anda yakin ingin menghapus checklist surat jalan yang dipilih?',
    'Hapus Checklist Surat Jalan'
  );

  const fetchChecklistById = useCallback(
    async (id) => {
      if (!id) {
        return null;
      }
      try {
        const result = await checkingListService.getChecklistById(id);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to fetch checklist surat jalan'
          );
        }
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return null;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to fetch checklist surat jalan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler]
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
      active.no_surat_jalan ||
      active.deliver_to ||
      active.PIC ||
      active.checker ||
      active.driver ||
      active.mobil ||
      active.kota ||
      active.statusId ||
      'filter aktif'
    );
  }, [hasActiveFilters, activeFiltersVersion]);

  const handleRetryFetch = useCallback(() => {
    performFetch({
      page:
        paginationRef.current?.currentPage ||
        paginationRef.current?.page ||
        INITIAL_PAGINATION.currentPage,
      limit: resolveLimit(),
      filters: activeFiltersRef.current,
    });
  }, [performFetch, resolveLimit]);

  return {
    checklists,
    setChecklists,
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
    createChecklist,
    updateChecklist,
    bulkDeleteChecklists,
    bulkDeleteConfirmation,
    fetchChecklists: performFetch,
    fetchChecklistById,
    handleAuthError: authHandler,
    handleRetryFetch,
  };
};

export default useCheckingListPage;
