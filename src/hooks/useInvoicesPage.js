import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import invoiceService from '../services/invoiceService';
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

const parseInvoicesResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Failed to fetch invoices');
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

const resolveInvoiceError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to load invoices';
};

const useInvoices = () => {
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
    searchResults: invoices,
    setSearchResults: setInvoices,
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
        return invoiceService.getAllInvoices(page, limit);
      }
      const searchParams = { [field]: trimmedQuery };
      return invoiceService.searchInvoices(searchParams, page, limit);
    },
    parseResponse: parseInvoicesResponse,
    resolveErrorMessage: resolveInvoiceError,
    onAuthError: handleAuthRedirect
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchInvoices = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const searchInvoices = useCallback((query, field = searchFieldRef.current, page = 1, limit = resolveLimit()) => {
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

  const createInvoice = useCallback(async (invoiceData) => {
    try {
      const result = await invoiceService.createInvoice(invoiceData);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to create invoice');
      }
      toastService.success('Invoice created successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to create invoice';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const updateInvoice = useCallback(async (id, updateData) => {
    try {
      const result = await invoiceService.updateInvoice(id, updateData);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to update invoice');
      }
      toastService.success('Invoice updated successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to update invoice';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const deleteInvoiceFunction = useCallback(async (id) => {
    try {
      const result = await invoiceService.deleteInvoice(id);
      if (!(result?.success || result === '')) {
        throw new Error(result?.error?.message || 'Failed to delete invoice');
      }
      toastService.success('Invoice deleted successfully');

      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || invoices.length;
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
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to delete invoice';
      setError(message);
      toastService.error(message);
    }
  }, [authHandler, invoices.length, pagination, performSearch, resolveLimit, searchQuery, setError]);

  const deleteInvoiceConfirmation = useDeleteConfirmation(
    deleteInvoiceFunction,
    'Are you sure you want to delete this invoice?',
    'Delete Invoice'
  );

  useEffect(() => {
    fetchInvoices(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchInvoices]);

  return {
    invoices,
    setInvoices,
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
    createInvoice,
    updateInvoice,
    deleteInvoice: deleteInvoiceConfirmation.showDeleteConfirmation,
    deleteInvoiceConfirmation,
    fetchInvoices,
    handleAuthError: authHandler
  };
};

export default useInvoices;
