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
  total: 0
};

const parseInvoicePengirimanResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Failed to fetch invoice pengiriman');
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
      limit: itemsPerPage
    }
  };
};

const resolveInvoicePengirimanError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to load invoice pengiriman';
};

const useInvoicePengiriman = () => {
  const navigate = useNavigate();
  const [searchField, setSearchField] = useState('no_invoice');
  const searchFieldRef = useRef('no_invoice');

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: invoicePengiriman,
    setSearchResults: setInvoicePengiriman,
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
    resolveLimit
  } = usePaginatedSearch({
    initialPagination: INITIAL_PAGINATION,
    searchFn: (query, page, limit) => {
      const trimmedQuery = typeof query === 'string' ? query.trim() : '';
      const field = searchFieldRef.current || 'no_invoice';
      if (!trimmedQuery) {
        return invoicePengirimanService.getAllInvoicePengiriman(page, limit);
      }
      const searchParams = { [field]: trimmedQuery };
      return invoicePengirimanService.searchInvoicePengiriman(searchParams, page, limit);
    },
    parseResponse: parseInvoicePengirimanResponse,
    resolveErrorMessage: resolveInvoicePengirimanError,
    onAuthError: handleAuthRedirect
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchInvoicePengiriman = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const searchInvoicePengiriman = useCallback((query, field = searchFieldRef.current, page = 1, limit = resolveLimit()) => {
    if (field && field !== searchFieldRef.current) {
      searchFieldRef.current = field;
      setSearchField(field);
    }
    setSearchQuery(query);
    return performSearch(query, page, limit);
  }, [performSearch, resolveLimit, setSearchQuery]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchQuery]);

  const handleSearchFieldChange = useCallback((field) => {
    searchFieldRef.current = field;
    setSearchField(field);
    if (typeof searchQuery === 'string' && searchQuery.trim()) {
      performSearch(searchQuery, 1, resolveLimit());
    } else {
      performSearch('', 1, resolveLimit());
    }
  }, [performSearch, resolveLimit, searchQuery]);

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
    await performSearch(trimmedQuery, currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit, searchQuery]);

  const createInvoicePengiriman = useCallback(async (invoiceData) => {
    try {
      const result = await invoicePengirimanService.createInvoicePengiriman(invoiceData);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to create invoice pengiriman');
      }
      toastService.success('Invoice pengiriman created successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to create invoice pengiriman';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const updateInvoicePengiriman = useCallback(async (id, updateData) => {
    try {
      const result = await invoicePengirimanService.updateInvoicePengiriman(id, updateData);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to update invoice pengiriman');
      }
      toastService.success('Invoice pengiriman updated successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to update invoice pengiriman';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const deleteInvoicePengirimanFn = useCallback(async (id) => {
    try {
      const result = await invoicePengirimanService.deleteInvoicePengiriman(id);
      if (!(result?.success || result === '' || result === undefined)) {
        throw new Error(result?.error?.message || 'Failed to delete invoice pengiriman');
      }
      toastService.success('Invoice pengiriman berhasil dihapus');

      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || invoicePengiriman.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);
      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to delete invoice pengiriman';
      setError(message);
      toastService.error(message);
    }
  }, [authHandler, invoicePengiriman.length, pagination, performSearch, resolveLimit, searchQuery, setError]);

  const deleteInvoicePengirimanConfirmation = useDeleteConfirmation(
    deleteInvoicePengirimanFn,
    'Apakah Anda yakin ingin menghapus invoice pengiriman ini?',
    'Hapus Invoice Pengiriman'
  );

  useEffect(() => {
    fetchInvoicePengiriman(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchInvoicePengiriman]);

  return {
    invoicePengiriman,
    setInvoicePengiriman,
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
    createInvoice: createInvoicePengiriman,
    updateInvoice: updateInvoicePengiriman,
    deleteInvoiceConfirmation: deleteInvoicePengirimanConfirmation,
    fetchInvoicePengiriman,
    handleAuthError: authHandler
  };
};

export default useInvoicePengiriman;
