import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import purchaseOrderService from '../services/purchaseOrderService';
import toastService from '../services/toastService';
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

const parsePurchaseOrdersResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Failed to load purchase orders');
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

const resolvePurchaseOrdersError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Gagal mengambil data purchase orders';
};

const usePurchaseOrders = () => {
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
    initialInput: '',
    initialPagination: INITIAL_PAGINATION,
    searchFn: (query, page, limit) => {
      const trimmedQuery = typeof query === 'string' ? query.trim() : '';
      const field = searchFieldRef.current || 'customer_name';
      if (!trimmedQuery) {
        return purchaseOrderService.getAllPurchaseOrders(page, limit);
      }
      const searchParams = { [field]: trimmedQuery };
      return purchaseOrderService.searchPurchaseOrders(searchParams, page, limit);
    },
    parseResponse: parsePurchaseOrdersResponse,
    resolveErrorMessage: resolvePurchaseOrdersError,
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

  const computeNextPageAfterDelete = useCallback(() => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    const totalItems = pagination.totalItems || pagination.total || purchaseOrders.length;
    const newTotalItems = Math.max(totalItems - 1, 0);
    const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
    return {
      nextPage: Math.min(currentPage, newTotalPages),
      itemsPerPage
    };
  }, [pagination, purchaseOrders.length, resolveLimit]);

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

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
    await performSearch(trimmedQuery, currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit, searchQuery]);

  const createPurchaseOrder = useCallback(async (formData, files = []) => {
    try {
      const result = await purchaseOrderService.createPurchaseOrder(formData, files);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to create purchase order');
      }
      toastService.success('Purchase order created successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.message?.includes('token') || err?.message?.includes('unauthorized')) {
        authHandler();
        return null;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to create purchase order';
      toastService.error(message);
      return null;
    }
  }, [authHandler, refreshAfterMutation]);

  const updatePurchaseOrder = useCallback(async (id, updateData) => {
    try {
      const result = await purchaseOrderService.updatePurchaseOrder(id, updateData);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to update purchase order');
      }
      toastService.success('Purchase order updated successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.message?.includes('token') || err?.message?.includes('unauthorized')) {
        authHandler();
        return null;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to update purchase order';
      toastService.error(message);
      return null;
    }
  }, [authHandler, refreshAfterMutation]);

  const deletePurchaseOrder = useCallback(async (id) => {
    try {
      const result = await purchaseOrderService.deletePurchaseOrder(id);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to delete purchase order');
      }
      toastService.success('Purchase order deleted successfully');
      const { nextPage, itemsPerPage } = computeNextPageAfterDelete();
      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      await performSearch(trimmedQuery, nextPage, itemsPerPage);
      return true;
    } catch (err) {
      if (err?.message?.includes('token') || err?.message?.includes('unauthorized')) {
        authHandler();
      } else {
        const message = err?.response?.data?.error?.message || err?.message || 'Failed to delete purchase order';
        setError(message);
        toastService.error(message);
      }
      return false;
    }
  }, [authHandler, computeNextPageAfterDelete, performSearch, searchQuery, setError]);

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
    deletePurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrder,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    handleSearchChange,
    handleSearchFieldChange,
    refetch: fetchPurchaseOrders
  };
};

export default usePurchaseOrders;