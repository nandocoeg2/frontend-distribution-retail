import { useCallback, useEffect, useMemo } from 'react';
import toastService from '../services/toastService';
import customerService from '../services/customerService';
import usePaginatedSearch from './usePaginatedSearch';

const INITIAL_PAGINATION = {
  currentPage: 1,
  page: 1,
  totalPages: 1,
  totalItems: 0,
  total: 0,
  itemsPerPage: 10,
  limit: 10
};

const parseCustomerResponse = (response) => {
  if (!response?.success) {
    throw new Error(response?.error?.message || 'Failed to load customers');
  }

  const data = response.data || {};
  const paginationData = data.pagination || {};

  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;
  const totalPages = paginationData.totalPages || INITIAL_PAGINATION.totalPages;

  return {
    results: data.data || [],
    pagination: {
      currentPage,
      page: currentPage,
      totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage
    }
  };
};

const resolveCustomerError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to load customers';
};

const useCustomersPage = () => {
  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: customers,
    setSearchResults: setCustomers,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    performSearch,
    debouncedSearch,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    handleAuthError,
    resolveLimit
  } = usePaginatedSearch({
    initialInput: '',
    initialPagination: INITIAL_PAGINATION,
    searchFn: (query, page, limit) => {
      const trimmedQuery = typeof query === 'string' ? query.trim() : '';
      if (!trimmedQuery) {
        return customerService.getAllCustomers(page, limit);
      }
      return customerService.search(trimmedQuery, page, limit);
    },
    parseResponse: parseCustomerResponse,
    resolveErrorMessage: resolveCustomerError,
    requireInput: false
  });

  useEffect(() => {
    performSearch('', 1, INITIAL_PAGINATION.itemsPerPage);
  }, [performSearch]);

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchQuery]);

  const fetchCustomers = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const searchCustomers = useCallback((query, page = 1, limit = resolveLimit()) => {
    return performSearch(query, page, limit);
  }, [performSearch, resolveLimit]);

  const handleDeleteCustomer = useCallback(async (id) => {
    try {
      await customerService.deleteCustomer(id);
      toastService.success('Customer deleted successfully');

      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || customers.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('403') || err.message === 'Unauthorized') {
        handleAuthError();
      } else {
        const message = err.message || 'Failed to delete customer';
        setError(message);
        toastService.error(message);
      }
    }
  }, [customers.length, handleAuthError, pagination, performSearch, resolveLimit, searchQuery, setError]);

  const clearSearchState = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  return {
    customers,
    setCustomers,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteCustomer: handleDeleteCustomer,
    fetchCustomers,
    searchCustomers,
    clearSearch: clearSearchState,
    handleAuthError
  };
};

// The original hook was named useCustomers, so we export that name
// to avoid having to refactor the components that use it.
export default useCustomersPage;
