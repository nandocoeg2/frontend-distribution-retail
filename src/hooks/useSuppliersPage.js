import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '@/services/toastService';
import supplierService from '@/services/supplierService';
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

const parseSuppliersResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.message || 'Failed to load suppliers');
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

const resolveSupplierError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to load suppliers';
};

const useSuppliers = () => {
  const navigate = useNavigate();

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: suppliers,
    setSearchResults: setSuppliers,
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
      if (!trimmedQuery) {
        return supplierService.getAllSuppliers(page, limit);
      }
      return supplierService.searchSuppliers(trimmedQuery, page, limit);
    },
    parseResponse: parseSuppliersResponse,
    resolveErrorMessage: resolveSupplierError,
    onAuthError: handleAuthRedirect
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchSuppliers = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchQuery]);

  const refreshAfterMutation = useCallback(async () => {
    const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    await performSearch(trimmedQuery, currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit, searchQuery]);

  const deleteSupplierFunction = useCallback(async (id) => {
    try {
      const result = await supplierService.deleteSupplier(id);
      if (result?.success === false) {
        throw new Error(result?.message || 'Failed to delete supplier');
      }
      toastService.success('Supplier deleted successfully');

      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || suppliers.length;
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
      const message = resolveSupplierError(err) || 'Failed to delete supplier';
      setError(message);
      toastService.error(message);
    }
  }, [authHandler, pagination, performSearch, resolveLimit, searchQuery, setError, suppliers.length]);

  const deleteSupplierConfirmation = useDeleteConfirmation(
    deleteSupplierFunction,
    'Are you sure you want to delete this supplier?',
    'Delete Supplier'
  );

  const createSupplier = useCallback(async (supplierData) => {
    try {
      const result = await supplierService.createSupplier(supplierData);
      if (result?.success === false) {
        throw new Error(result?.message || 'Failed to create supplier');
      }
      toastService.success('Supplier created successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to create supplier';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const updateSupplier = useCallback(async (id, supplierData) => {
    try {
      const result = await supplierService.updateSupplier(id, supplierData);
      if (result?.success === false) {
        throw new Error(result?.message || 'Failed to update supplier');
      }
      toastService.success('Supplier updated successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to update supplier';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const getSupplierById = useCallback(async (id) => {
    try {
      const result = await supplierService.getSupplierById(id);
      if (result?.success === false) {
        throw new Error(result?.message || 'Failed to get supplier');
      }
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to get supplier';
      toastService.error(message);
      throw err;
    }
  }, [authHandler]);

  useEffect(() => {
    fetchSuppliers(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchSuppliers]);

  return {
    suppliers,
    setSuppliers,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    deleteSupplier: deleteSupplierConfirmation.showDeleteConfirmation,
    deleteSupplierConfirmation,
    createSupplier,
    updateSupplier,
    getSupplierById,
    fetchSuppliers,
    handleAuthError: authHandler
  };
};

export default useSuppliers;
