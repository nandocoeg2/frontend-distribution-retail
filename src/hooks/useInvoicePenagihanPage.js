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

const booleanFields = new Set(['kw', 'fp']);

const parseInvoicePenagihanResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Failed to fetch invoice penagihan');
  }

  const rawData = response?.data?.data || response?.data || [];
  const paginationData = response?.data?.pagination || {};
  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;

  return {
    results: Array.isArray(rawData) ? rawData : Array.isArray(rawData?.data) ? rawData.data : [],
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
  return error?.response?.data?.error?.message || error?.message || 'Failed to load invoice penagihan';
};

const normalizeSearchValue = (field, value) => {
  if (booleanFields.has(field)) {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
  }
  return value;
};

const useInvoicePenagihan = () => {
  const navigate = useNavigate();
  const [searchField, setSearchField] = useState('no_invoice_penagihan');
  const searchFieldRef = useRef('no_invoice_penagihan');

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: invoicePenagihan,
    setSearchResults: setInvoicePenagihan,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    performSearch,
    debouncedSearch,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    handleAuthError: authHandler,
    resolveLimit,
  } = usePaginatedSearch({
    initialPagination: INITIAL_PAGINATION,
    searchFn: (query, page, limit) => {
      const trimmedQuery = typeof query === 'string' ? query.trim() : query;
      const field = searchFieldRef.current || 'no_invoice_penagihan';

      if (trimmedQuery === '' || trimmedQuery === undefined || trimmedQuery === null) {
        return invoicePenagihanService.getAllInvoicePenagihan(page, limit);
      }

      const normalizedValue = normalizeSearchValue(field, trimmedQuery);
      const searchParams = normalizedValue === undefined ? {} : { [field]: normalizedValue };
      return invoicePenagihanService.searchInvoicePenagihan(searchParams, page, limit);
    },
    parseResponse: parseInvoicePenagihanResponse,
    resolveErrorMessage: resolveInvoicePenagihanError,
    onAuthError: handleAuthRedirect,
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchInvoicePenagihan = useCallback(
    (page = 1, limit = resolveLimit()) => {
      return performSearch('', page, limit);
    },
    [performSearch, resolveLimit],
  );

  const searchInvoicePenagihan = useCallback(
    (query, field = searchFieldRef.current, page = 1, limit = resolveLimit()) => {
      if (field && field !== searchFieldRef.current) {
        searchFieldRef.current = field;
        setSearchField(field);
      }
      setSearchQuery(query);
      return performSearch(query, page, limit);
    },
    [performSearch, resolveLimit, setSearchQuery],
  );

  const handleSearchChange = useCallback(
    (event) => {
      const query = event?.target ? event.target.value : event;
      setSearchQuery(query);
      debouncedSearch(query, 1, resolveLimit());
    },
    [debouncedSearch, resolveLimit, setSearchQuery],
  );

  const handleSearchFieldChange = useCallback(
    (field) => {
      searchFieldRef.current = field;
      setSearchField(field);
      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : searchQuery;
      if (trimmedQuery) {
        performSearch(trimmedQuery, 1, resolveLimit());
      } else {
        performSearch('', 1, resolveLimit());
      }
    },
    [performSearch, resolveLimit, searchQuery],
  );

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : searchQuery;
    await performSearch(trimmedQuery || '', currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit, searchQuery]);

  const createInvoicePenagihan = useCallback(
    async (invoiceData) => {
      try {
        const result = await invoicePenagihanService.createInvoicePenagihan(invoiceData);
        if (result?.success === false) {
          throw new Error(result?.error?.message || 'Failed to create invoice penagihan');
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
          err?.response?.data?.error?.message || err?.message || 'Failed to create invoice penagihan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation],
  );

  const updateInvoicePenagihan = useCallback(
    async (id, updateData) => {
      try {
        const result = await invoicePenagihanService.updateInvoicePenagihan(id, updateData);
        if (result?.success === false) {
          throw new Error(result?.error?.message || 'Failed to update invoice penagihan');
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
          err?.response?.data?.error?.message || err?.message || 'Failed to update invoice penagihan';
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
          throw new Error(result?.error?.message || 'Failed to delete invoice penagihan');
        }
        toastService.success('Invoice penagihan berhasil dihapus');

        const itemsPerPage = resolveLimit();
        const currentPage = pagination.currentPage || pagination.page || 1;
        const totalItems = pagination.totalItems || pagination.total || invoicePenagihan.length;
        const newTotalItems = Math.max(totalItems - 1, 0);
        const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
        const nextPage = Math.min(currentPage, newTotalPages);
        const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : searchQuery;

        await performSearch(trimmedQuery || '', nextPage, itemsPerPage);
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return;
        }
        const message =
          err?.response?.data?.error?.message || err?.message || 'Failed to delete invoice penagihan';
        setError(message);
        toastService.error(message);
      }
    },
    [authHandler, invoicePenagihan.length, pagination, performSearch, resolveLimit, searchQuery, setError],
  );

  const deleteInvoicePenagihanConfirmation = useDeleteConfirmation(
    deleteInvoicePenagihanFn,
    'Apakah Anda yakin ingin menghapus invoice penagihan ini?',
    'Hapus Invoice Penagihan',
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
    searchQuery,
    searchField,
    searchLoading,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    createInvoice: createInvoicePenagihan,
    updateInvoice: updateInvoicePenagihan,
    deleteInvoiceConfirmation: deleteInvoicePenagihanConfirmation,
    fetchInvoicePenagihan,
    handleAuthError: authHandler,
    searchInvoicePenagihan,
  };
};

export default useInvoicePenagihan;
