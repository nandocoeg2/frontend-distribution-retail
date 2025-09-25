import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { getInventories, searchInventories, deleteInventory } from '../services/inventoryService';
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

const parseInventoriesResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Failed to load inventories');
  }

  const rawData = response?.data?.data || response?.data || [];
  const paginationData = response?.data?.pagination || {};
  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;

  const normalizeInventory = (item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const dimension = item.dimensiKardus || {};

    return {
      ...item,
      berat: item.berat ?? dimension.berat ?? 0,
      panjang: item.panjang ?? dimension.panjang ?? 0,
      lebar: item.lebar ?? dimension.lebar ?? 0,
      tinggi: item.tinggi ?? dimension.tinggi ?? 0
    };
  };

  const list = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.data) ? rawData.data : [];

  return {
    results: list.map(normalizeInventory),
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

const resolveInventoryError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to load inventories';
};

const useInventoriesPage = () => {
  const navigate = useNavigate();

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: inventories,
    setSearchResults: setInventories,
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
        return getInventories(page, limit);
      }
      return searchInventories(trimmedQuery, page, limit);
    },
    parseResponse: parseInventoriesResponse,
    resolveErrorMessage: resolveInventoryError,
    onAuthError: handleAuthRedirect
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchInventories = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchQuery]);

  const handleDeleteInventory = useCallback(async (id) => {
    try {
      await deleteInventory(id);
      toastService.success('Inventory item deleted successfully');

      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || inventories.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return;
      }
      const message = resolveInventoryError(err) || 'Failed to delete inventory item';
      setError(message);
      toastService.error(message);
    }
  }, [authHandler, inventories.length, pagination, performSearch, resolveLimit, searchQuery, setError]);

  useEffect(() => {
    fetchInventories(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchInventories]);

  return {
    inventories,
    setInventories,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    deleteInventory: handleDeleteInventory,
    fetchInventories,
    handleAuthError: authHandler
  };
};

export default useInventoriesPage;
