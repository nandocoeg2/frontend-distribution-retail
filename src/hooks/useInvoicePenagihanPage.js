import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import invoicePenagihanService from '../services/invoicePenagihanService';
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

const createInitialFilters = () => ({
  no_invoice_penagihan: '',
  kepada: '',
  statusId: '',
  purchaseOrderId: '',
  termOfPaymentId: '',
  kwitansiId: '',
  fakturPajakId: '',
  tanggal_start: '',
  tanggal_end: '',
});

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

const parseInvoicePenagihanResponse = (response) => {
  if (response?.success === false) {
    throw new Error(
      response?.error?.message || 'Failed to fetch invoice penagihan',
    );
  }

  const rawData = response?.data?.data || response?.data || [];
  const paginationData = response?.data?.pagination || {};
  const currentPage =
    paginationData.currentPage ||
    paginationData.page ||
    INITIAL_PAGINATION.currentPage;
  const itemsPerPage =
    paginationData.itemsPerPage ||
    paginationData.limit ||
    INITIAL_PAGINATION.itemsPerPage;
  const totalItems =
    paginationData.totalItems ||
    paginationData.total ||
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
      totalPages: paginationData.totalPages || INITIAL_PAGINATION.totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage,
    },
  };
};

const resolveInvoicePenagihanError = (error) => {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    'Failed to load invoice penagihan'
  );
};

const useInvoicePenagihan = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(() => createInitialFilters());
  const [searchLoading, setSearchLoading] = useState(false);
  const filtersRef = useRef(filters);
  const activeFiltersRef = useRef({});
  const [activeFiltersVersion, setActiveFiltersVersion] = useState(0);

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    searchResults: invoicePenagihan,
    setSearchResults: setInvoicePenagihan,
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
    initialInput: createInitialFilters(),
    initialPagination: INITIAL_PAGINATION,
    searchFn: (rawFilters = {}, page, limit) => {
      const sanitized = sanitizeFilters(rawFilters);
      if (Object.keys(sanitized).length === 0) {
        return invoicePenagihanService.getAllInvoicePenagihan(page, limit);
      }
      return invoicePenagihanService.searchInvoicePenagihan(
        sanitized,
        page,
        limit,
      );
    },
    parseResponse: parseInvoicePenagihanResponse,
    resolveErrorMessage: resolveInvoicePenagihanError,
    onAuthError: handleAuthRedirect,
  });

  const updateActiveFilters = useCallback((nextActive) => {
    activeFiltersRef.current = nextActive;
    setActiveFiltersVersion((version) => version + 1);
  }, []);

  const handleFiltersChange = useCallback((field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      filtersRef.current = next;
      return next;
    });
  }, []);

  const handleSearchSubmit = useCallback(async () => {
    const sanitized = sanitizeFilters(filtersRef.current);
    updateActiveFilters(sanitized);
    setSearchLoading(true);
    try {
      const limit = resolveLimit();
      await performSearch(sanitized, 1, limit);
    } finally {
      setSearchLoading(false);
    }
  }, [performSearch, resolveLimit, updateActiveFilters]);

  const handleResetFilters = useCallback(async () => {
    const resetFilters = createInitialFilters();
    filtersRef.current = resetFilters;
    setFilters(resetFilters);
    updateActiveFilters({});
    setSearchLoading(true);
    try {
      const limit = resolveLimit();
      await performSearch({}, 1, limit);
    } finally {
      setSearchLoading(false);
    }
  }, [performSearch, resolveLimit, updateActiveFilters]);

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
      active.no_invoice_penagihan ||
      active.kepada ||
      active.purchaseOrderId ||
      active.statusId ||
      active.termOfPaymentId ||
      active.kwitansiId ||
      active.fakturPajakId ||
      active.tanggal_start ||
      active.tanggal_end ||
      'filter aktif'
    );
  }, [hasActiveFilters, activeFiltersVersion]);

  const fetchInvoicePenagihan = useCallback(
    (page = 1, limit = resolveLimit()) => {
      return performSearch(activeFiltersRef.current, page, limit);
    },
    [performSearch, resolveLimit],
  );

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    await performSearch(activeFiltersRef.current, currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit]);

  const createInvoicePenagihan = useCallback(
    async (invoiceData) => {
      try {
        const result =
          await invoicePenagihanService.createInvoicePenagihan(invoiceData);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to create invoice penagihan',
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
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to create invoice penagihan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation],
  );

  const updateInvoicePenagihan = useCallback(
    async (id, updateData) => {
      try {
        const result = await invoicePenagihanService.updateInvoicePenagihan(
          id,
          updateData,
        );
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to update invoice penagihan',
          );
        }
        toastService.success('Invoice penagihan berhasil diperbarui');
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
          'Failed to update invoice penagihan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation],
  );

  const deleteInvoicePenagihanFn = useCallback(
    async (id) => {
      try {
        const result = await invoicePenagihanService.deleteInvoicePenagihan(id);
        if (!(result?.success || result === '' || result === undefined)) {
          throw new Error(
            result?.error?.message || 'Failed to delete invoice penagihan',
          );
        }
        toastService.success('Invoice penagihan berhasil dihapus');

        const itemsPerPage = resolveLimit();
        const currentPage = pagination.currentPage || pagination.page || 1;
        const totalItems =
          pagination.totalItems || pagination.total || invoicePenagihan.length;
        const newTotalItems = Math.max(totalItems - 1, 0);
        const newTotalPages = Math.max(
          Math.ceil(newTotalItems / itemsPerPage),
          1,
        );
        const nextPage = Math.min(currentPage, newTotalPages);

        await performSearch(activeFiltersRef.current, nextPage, itemsPerPage);
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to delete invoice penagihan';
        setError(message);
        toastService.error(message);
      }
    },
    [
      authHandler,
      invoicePenagihan.length,
      pagination,
      performSearch,
      resolveLimit,
      setError,
    ],
  );

  const deleteInvoicePenagihanConfirmation = useDeleteConfirmation(
    deleteInvoicePenagihanFn,
    'Apakah Anda yakin ingin menghapus invoice penagihan ini?',
    'Hapus Invoice Penagihan',
  );

  const cancelInvoicePenagihanFn = useCallback(
    async (id) => {
      try {
        const result = await invoicePenagihanService.cancelInvoicePenagihan(id);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to cancel invoice penagihan',
          );
        }
        toastService.success('Invoice penagihan berhasil dibatalkan. Kwitansi dan referensi faktur pajak telah dihapus.');

        const itemsPerPage = resolveLimit();
        const currentPage = pagination.currentPage || pagination.page || 1;
        await performSearch(activeFiltersRef.current, currentPage, itemsPerPage);
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to cancel invoice penagihan';
        setError(message);
        toastService.error(message);
      }
    },
    [authHandler, pagination, performSearch, resolveLimit, setError],
  );

  const cancelInvoicePenagihanConfirmation = useDeleteConfirmation(
    cancelInvoicePenagihanFn,
    'Apakah Anda yakin ingin membatalkan invoice penagihan ini?\n\nTindakan ini akan:\n• Mengubah status menjadi CANCELLED\n• Menghapus Kwitansi terkait\n• Menghapus referensi Faktur Pajak',
    'Batalkan Invoice Penagihan',
  );

  useEffect(() => {
    fetchInvoicePenagihan(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchInvoicePenagihan]);

  return {
    invoicePenagihan,
    setInvoicePenagihan,
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
    createInvoice: createInvoicePenagihan,
    updateInvoice: updateInvoicePenagihan,
    deleteInvoiceConfirmation: deleteInvoicePenagihanConfirmation,
    cancelInvoiceConfirmation: cancelInvoicePenagihanConfirmation,
    fetchInvoicePenagihan,
    handleAuthError: authHandler,
  };
};

export default useInvoicePenagihan;

