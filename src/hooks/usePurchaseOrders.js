import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import purchaseOrderService from '../services/purchaseOrderService';
import toastService from '../services/toastService';
import usePaginatedSearch from './usePaginatedSearch';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 9999,
  page: 1,
  limit: 9999,
  total: 0
};

const createDefaultFilters = () => ({
  po_number: '',
  customer_name: '',
  customerId: '',
  companyId: '', // Changed from supplierId
  status_code: '',
  tanggal_masuk_po: ''
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
  const [filters, setFilters] = useState(() => createDefaultFilters());
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeFiltersVersion, setActiveFiltersVersion] = useState(0);
  const filtersRef = useRef(createDefaultFilters());
  const activeFiltersRef = useRef({});

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    window.location.href = '/login';
    toastService.error('Session expired. Please login again.');
  }, []);

  const {
    searchResults: purchaseOrders,
    pagination,
    loading,
    error,
    setError,
    performSearch,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    handleAuthError: authHandler,
    resolveLimit
  } = usePaginatedSearch({
    initialInput: createDefaultFilters(),
    initialPagination: INITIAL_PAGINATION,
    searchFn: (queryFilters = {}, page, limit) => {
      const sanitizedFilters = sanitizeFilters(queryFilters);
      if (Object.keys(sanitizedFilters).length === 0) {
        return purchaseOrderService.getAllPurchaseOrders(page, limit);
      }
      return purchaseOrderService.searchPurchaseOrders(sanitizedFilters, page, limit);
    },
    parseResponse: parsePurchaseOrdersResponse,
    resolveErrorMessage: resolvePurchaseOrdersError,
    onAuthError: handleAuthRedirect
  });

  const fetchPurchaseOrders = useCallback(
    async (page = 1, limit = resolveLimit()) => {
      const activeFilters = activeFiltersRef.current || {};
      const hasFilters = Object.keys(activeFilters).length > 0;

      if (hasFilters) {
        setSearchLoading(true);
        try {
          return await performSearch(activeFilters, page, limit);
        } finally {
          setSearchLoading(false);
        }
      }

      const defaultFilters = createDefaultFilters();
      activeFiltersRef.current = {};
      setActiveFiltersVersion((version) => version + 1);
      setSearchLoading(false);
      return performSearch(defaultFilters, page, limit);
    },
    [performSearch, resolveLimit]
  );

  const handleFiltersChange = useCallback((field, value) => {
    setFilters((prev) => {
      const nextFilters = {
        ...prev,
        [field]: value
      };
      filtersRef.current = nextFilters;
      return nextFilters;
    });
  }, []);

  const handleSearchSubmit = useCallback(async (page = 1, limit = resolveLimit()) => {
    const currentFilters = filtersRef.current || createDefaultFilters();
    const sanitizedFilters = sanitizeFilters(currentFilters);
    activeFiltersRef.current = sanitizedFilters;
    setActiveFiltersVersion((version) => version + 1);

    setSearchLoading(true);
    try {
      return await performSearch(currentFilters, page, limit);
    } finally {
      setSearchLoading(false);
    }
  }, [performSearch, resolveLimit]);

  const handleResetFilters = useCallback(async () => {
    const defaultFilters = createDefaultFilters();
    filtersRef.current = defaultFilters;
    activeFiltersRef.current = {};
    setFilters(defaultFilters);
    setActiveFiltersVersion((version) => version + 1);

    setSearchLoading(true);
    try {
      return await performSearch(defaultFilters, 1, resolveLimit());
    } finally {
      setSearchLoading(false);
    }
  }, [performSearch, resolveLimit]);

  const searchPurchaseOrders = useCallback(async (nextFilters = {}, page = 1, limit = resolveLimit()) => {
    const mergedFilters = {
      ...filtersRef.current,
      ...nextFilters
    };
    filtersRef.current = mergedFilters;
    setFilters(mergedFilters);
    return handleSearchSubmit(page, limit);
  }, [handleSearchSubmit, resolveLimit]);

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
    await performSearch(filtersRef.current, currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit]);

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

  useEffect(() => {
    fetchPurchaseOrders(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchPurchaseOrders]);

  const hasActiveFilters = useMemo(() => {
    const active = activeFiltersRef.current || {};
    return Object.keys(active).length > 0;
  }, [activeFiltersVersion]);

  const searchQuery = useMemo(() => {
    const active = activeFiltersRef.current || {};
    if (Object.keys(active).length === 0) {
      return '';
    }

    return (
      active.po_number ||
      active.customer_name ||
      active.customerId ||
      active.companyId || // Changed from supplierId
      active.status_code ||
      active.tanggal_masuk_po ||
      'filter aktif'
    );
  }, [activeFiltersVersion]);

  return {
    purchaseOrders,
    pagination,
    loading,
    error,
    filters,
    searchLoading,
    hasActiveFilters,
    searchQuery,
    fetchPurchaseOrders,
    searchPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrder,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    handleFiltersChange,
    handleSearchSubmit,
    handleResetFilters,
    refetch: fetchPurchaseOrders
  };
};

export default usePurchaseOrders;
