import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import invoicePengirimanService from '../services/invoicePengirimanService';
import usePaginatedSearch from './usePaginatedSearch';
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
  no_invoice: '',
  deliver_to: '',
  type: '',
  status_code: '',
  purchaseOrderId: '',
  tanggal_start: '',
  tanggal_end: '',
  is_printed: '',
};

const createEmptyFilters = () => ({ ...DEFAULT_FILTERS });

const sanitizeFilters = (filters = {}) => {
  const sanitized = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        return;
      }

      if (key === 'is_printed') {
        const lowered = trimmed.toLowerCase();
        if (lowered === 'true') {
          sanitized[key] = true;
          return;
        }
        if (lowered === 'false') {
          sanitized[key] = false;
          return;
        }
        return;
      }

      if (key === 'type') {
        sanitized[key] = trimmed.toUpperCase();
        return;
      }

      sanitized[key] = trimmed;
      return;
    }

    if (key === 'is_printed') {
      sanitized[key] = Boolean(value);
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
};

const areFiltersEqual = (a = {}, b = {}) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every((key) => a[key] === b[key]);
};

const parseInvoicePengirimanResponse = (response = {}) => {
  if (response?.success === false) {
    throw new Error(
      response?.error?.message || 'Failed to fetch invoice pengiriman'
    );
  }

  const rawData = response?.data?.data ?? response?.data ?? [];
  const paginationData = response?.data?.pagination ?? {};
  const currentPage =
    paginationData.currentPage ??
    paginationData.page ??
    INITIAL_PAGINATION.currentPage;
  const itemsPerPage =
    paginationData.itemsPerPage ??
    paginationData.limit ??
    INITIAL_PAGINATION.itemsPerPage;
  const totalItems =
    paginationData.totalItems ??
    paginationData.total ??
    INITIAL_PAGINATION.totalItems;

  return {
    results: Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
        ? rawData.data
        : [],
    pagination: {
      currentPage,
      page: currentPage,
      totalPages:
        paginationData.totalPages ?? INITIAL_PAGINATION.totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage,
    },
  };
};

const resolveInvoicePengirimanError = (error) => {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    'Failed to load invoice pengiriman'
  );
};

const useInvoicePengiriman = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(() => createEmptyFilters());
  const filtersRef = useRef(createEmptyFilters());
  const activeFiltersRef = useRef({});
  const [activeFiltersVersion, setActiveFiltersVersion] = useState(0);
  const [searchLoadingState, setSearchLoadingState] = useState(false);

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    searchResults: invoicePengiriman,
    setSearchResults: setInvoicePengiriman,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    performSearch,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    handleAuthError: authHandler,
    resolveLimit,
  } = usePaginatedSearch({
    initialInput: createEmptyFilters(),
    initialPagination: INITIAL_PAGINATION,
    searchFn: (rawFilters = {}, page, limit) => {
      const sanitized = sanitizeFilters(rawFilters);
      if (Object.keys(sanitized).length === 0) {
        return invoicePengirimanService.getAllInvoicePengiriman(page, limit);
      }
      return invoicePengirimanService.searchInvoicePengiriman(
        sanitized,
        page,
        limit
      );
    },
    parseResponse: parseInvoicePengirimanResponse,
    resolveErrorMessage: resolveInvoicePengirimanError,
    onAuthError: handleAuthRedirect,
  });

  const updateActiveFilters = useCallback((nextFilters) => {
    const previous = activeFiltersRef.current || {};
    const isSame = areFiltersEqual(previous, nextFilters);
    activeFiltersRef.current = nextFilters;
    if (!isSame) {
      setActiveFiltersVersion((version) => version + 1);
    }
  }, []);

  const runSearch = useCallback(
    async (rawFilters = {}, page = 1, limit, options = {}) => {
      const { trackLoading = true } = options;
      const effectiveLimit =
        typeof limit === 'number' ? limit : resolveLimit();
      const sanitized = sanitizeFilters(rawFilters);

      updateActiveFilters(sanitized);

      if (trackLoading) {
        setSearchLoadingState(true);
      }

      try {
        await performSearch(sanitized, page, effectiveLimit);
      } finally {
        if (trackLoading) {
          setSearchLoadingState(false);
        }
      }
    },
    [performSearch, resolveLimit, updateActiveFilters]
  );

  const fetchInvoicePengiriman = useCallback(
    (page = 1, limit = resolveLimit()) =>
      runSearch({}, page, limit, { trackLoading: false }),
    [resolveLimit, runSearch]
  );

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
    await runSearch(filtersRef.current, 1, resolveLimit(), {
      trackLoading: true,
    });
  }, [resolveLimit, runSearch]);

  const handleResetFilters = useCallback(async () => {
    const reset = createEmptyFilters();
    filtersRef.current = reset;
    setFilters(reset);
    await runSearch({}, 1, resolveLimit(), { trackLoading: true });
  }, [resolveLimit, runSearch]);

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    await runSearch(activeFiltersRef.current, currentPage, itemsPerPage, {
      trackLoading: false,
    });
  }, [pagination, resolveLimit, runSearch]);

  const createInvoicePengiriman = useCallback(
    async (invoiceData) => {
      try {
        const result =
          await invoicePengirimanService.createInvoicePengiriman(
            invoiceData
          );
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to create invoice pengiriman'
          );
        }
        toastService.success('Invoice pengiriman created successfully');
        await refreshAfterMutation();
        return result?.data;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return undefined;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to create invoice pengiriman';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation]
  );

  const createInvoicePenagihan = useCallback(
    async (id, payload = {}) => {
      try {
        const result =
          await invoicePengirimanService.createInvoicePenagihan(
            id,
            payload
          );
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to create invoice penagihan'
          );
        }
        toastService.success('Invoice penagihan berhasil dibuat');
        await refreshAfterMutation();
        return result?.data;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return undefined;
        }
        const apiMessage =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message;
        const message =
          apiMessage ||
          err?.message ||
          'Failed to create invoice penagihan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation]
  );

  const updateInvoicePengiriman = useCallback(
    async (id, updateData) => {
      try {
        const result =
          await invoicePengirimanService.updateInvoicePengiriman(
            id,
            updateData
          );
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to update invoice pengiriman'
          );
        }
        toastService.success('Invoice pengiriman updated successfully');
        await refreshAfterMutation();
        return result?.data;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return undefined;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to update invoice pengiriman';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation]
  );

  const deleteInvoicePengirimanFn = useCallback(
    async (id) => {
      try {
        const result =
          await invoicePengirimanService.deleteInvoicePengiriman(id);
        if (
          !(
            result?.success ||
            result === '' ||
            result === undefined
          )
        ) {
          throw new Error(
            result?.error?.message ||
              'Failed to delete invoice pengiriman'
          );
        }
        toastService.success('Invoice pengiriman berhasil dihapus');

        const itemsPerPage = resolveLimit();
        const currentPage = pagination.currentPage || pagination.page || 1;
        const totalItems =
          pagination.totalItems ||
          pagination.total ||
          invoicePengiriman.length;
        const newTotalItems = Math.max(totalItems - 1, 0);
        const newTotalPages = Math.max(
          Math.ceil(newTotalItems / itemsPerPage),
          1
        );
        const nextPage = Math.min(currentPage, newTotalPages);

        await runSearch(
          activeFiltersRef.current,
          nextPage,
          itemsPerPage,
          { trackLoading: false }
        );
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to delete invoice pengiriman';
        setError(message);
        toastService.error(message);
      }
    },
    [
      authHandler,
      invoicePengiriman.length,
      pagination,
      resolveLimit,
      runSearch,
      setError,
    ]
  );

  const deleteInvoicePengirimanConfirmation = useDeleteConfirmation(
    deleteInvoicePengirimanFn,
    'Apakah Anda yakin ingin menghapus invoice pengiriman ini?',
    'Hapus Invoice Pengiriman'
  );

  useEffect(() => {
    fetchInvoicePengiriman(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchInvoicePengiriman]);

  const hasActiveFilters = useMemo(() => {
    const active = activeFiltersRef.current || {};
    return Object.keys(active).length > 0;
  }, [activeFiltersVersion]);

  const searchQuery = useMemo(() => {
    if (!hasActiveFilters) {
      return '';
    }

    const active = activeFiltersRef.current || {};

    if (active.no_invoice) {
      return active.no_invoice;
    }
    if (active.deliver_to) {
      return active.deliver_to;
    }
    if (active.purchaseOrderId) {
      return active.purchaseOrderId;
    }
    if (active.status_code) {
      return active.status_code;
    }
    if (active.type) {
      return active.type;
    }
    if (typeof active.is_printed === 'boolean') {
      return active.is_printed ? 'sudah dicetak' : 'belum dicetak';
    }
    if (active.tanggal_start && active.tanggal_end) {
      return `${active.tanggal_start} - ${active.tanggal_end}`;
    }
    if (active.tanggal_start) {
      return active.tanggal_start;
    }
    if (active.tanggal_end) {
      return active.tanggal_end;
    }

    return 'filter aktif';
  }, [hasActiveFilters, activeFiltersVersion]);

  const searchLoading = searchLoadingState;

  return {
    invoicePengiriman,
    setInvoicePengiriman,
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
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    createInvoice: createInvoicePengiriman,
    createInvoicePengiriman,
    createInvoicePenagihan,
    updateInvoice: updateInvoicePengiriman,
    updateInvoicePengiriman,
    deleteInvoiceConfirmation: deleteInvoicePengirimanConfirmation,
    fetchInvoicePengiriman,
    handleAuthError: authHandler,
  };
};

export default useInvoicePengiriman;
