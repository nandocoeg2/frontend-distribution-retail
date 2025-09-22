import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toastService from '../services/toastService';
import purchaseOrderService from '../services/purchaseOrderService';
import usePaginatedSearch from './usePaginatedSearch';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0
};

const parsePurchaseOrderHistoryResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Failed to fetch purchase order history');
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

const resolvePurchaseOrderHistoryError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to load purchase order history';
};

const usePurchaseOrderHistory = () => {
  const [searchField, setSearchField] = useState('customer_name');
  const searchFieldRef = useRef('customer_name');

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    window.location.href = '/login';
    toastService.error('Session expired. Please login again.');
  }, []);

  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: purchaseOrders,
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
      const field = searchFieldRef.current || 'customer_name';
      if (!trimmedQuery) {
        return purchaseOrderService.getPurchaseOrderHistory(page, limit);
      }
      const searchParams = { [field]: trimmedQuery };
      return purchaseOrderService.searchPurchaseOrders(searchParams, page, limit);
    },
    parseResponse: parsePurchaseOrderHistoryResponse,
    resolveErrorMessage: resolvePurchaseOrderHistoryError,
    onAuthError: handleAuthRedirect
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchPurchaseOrders = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const searchPurchaseOrders = useCallback((query, field = searchFieldRef.current, page = 1, limit = resolveLimit()) => {
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
    }
  }, [performSearch, resolveLimit, searchQuery]);

  const handleSearchQueryChange = useCallback((query, field) => {
    searchFieldRef.current = field;
    setSearchField(field);
    setSearchQuery(query);
    if (typeof query === 'string' && query.trim()) {
      performSearch(query, 1, resolveLimit());
    } else {
      performSearch('', 1, resolveLimit());
    }
  }, [performSearch, resolveLimit, setSearchQuery]);

  const getPurchaseOrder = useCallback(async (id) => {
    try {
      const result = await purchaseOrderService.getPurchaseOrderById(id);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to fetch purchase order details');
      }
      return result?.data;
    } catch (err) {
      if (err?.message?.includes('token') || err?.message?.includes('unauthorized')) {
        authHandler();
      } else {
        const message = err?.response?.data?.error?.message || err?.message || 'Failed to load purchase order details';
        toastService.error(message);
      }
      return null;
    }
  }, [authHandler]);

  useEffect(() => {
    fetchPurchaseOrders(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    pagination,
    loading,
    error,
    searchLoading,
    searchQuery,
    searchField,
    fetchPurchaseOrders,
    searchPurchaseOrders,
    getPurchaseOrder,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    handleSearchChange,
    handleSearchFieldChange,
    handleSearchQueryChange,
  };
};

export default usePurchaseOrderHistory;

