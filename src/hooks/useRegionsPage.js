import { useCallback, useEffect, useMemo } from 'react';
import toastService from '../services/toastService';
import { regionService } from '../services/regionService';
import usePaginatedSearch from './usePaginatedSearch';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const INITIAL_PAGINATION = {
  currentPage: 1,
  page: 1,
  totalPages: 1,
  totalItems: 0,
  total: 0,
  itemsPerPage: 10,
  limit: 10
};

const parseRegionResponse = (response) => {
  const data = response?.data?.data || response?.data || [];
  const paginationData = response?.data?.pagination || response?.meta || response?.pagination || {};

  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;
  const totalPages = paginationData.totalPages || INITIAL_PAGINATION.totalPages;

  return {
    results: Array.isArray(data) ? data : [],
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

const resolveRegionError = (error) => {
  return error?.message || 'Failed to load regions';
};

const useRegionsPage = () => {
  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: regions,
    setSearchResults: setRegions,
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
        return regionService.getAllRegions(page, limit);
      }
      return regionService.searchRegions(trimmedQuery, page, limit);
    },
    parseResponse: parseRegionResponse,
    resolveErrorMessage: resolveRegionError,
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

  const fetchRegions = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const createRegion = useCallback(async (regionData) => {
    try {
      const newRegion = await regionService.createRegion(regionData);
      setRegions(prev => [newRegion, ...prev]);
      toastService.success('Region created successfully');
      await fetchRegions(pagination.currentPage || pagination.page || 1, resolveLimit());
      return newRegion;
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return undefined;
      }
      const message = err.message || 'Failed to create region';
      toastService.error(message);
      throw err;
    }
  }, [fetchRegions, handleAuthError, pagination, resolveLimit, setRegions]);

  const getRegionById = useCallback(async (id) => {
    try {
      return await regionService.getRegionById(id);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return undefined;
      }
      const message = err.message || 'Failed to fetch region';
      toastService.error(message);
      throw err;
    }
  }, [handleAuthError]);

  const updateRegion = useCallback(async (id, regionData) => {
    try {
      const updatedRegion = await regionService.updateRegion(id, regionData);
      setRegions(prev => prev.map(region => (region.id === id ? updatedRegion : region)));
      toastService.success('Region updated successfully');
      return updatedRegion;
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return undefined;
      }
      const message = err.message || 'Failed to update region';
      toastService.error(message);
      throw err;
    }
  }, [handleAuthError, setRegions]);

  const deleteRegionFunction = useCallback(async (id) => {
    try {
      await regionService.deleteRegion(id);
      toastService.success('Region deleted successfully');

      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || regions.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      const message = err.message || 'Failed to delete region';
      toastService.error(message);
    }
  }, [handleAuthError, pagination, performSearch, regions.length, resolveLimit, searchQuery]);

  const deleteRegionConfirmation = useDeleteConfirmation(
    deleteRegionFunction,
    'Are you sure you want to delete this region?',
    'Delete Region'
  );

  const clearSearchState = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  return {
    regions,
    setRegions,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    createRegion,
    getRegionById,
    updateRegion,
    deleteRegion: deleteRegionConfirmation.showDeleteConfirmation,
    deleteRegionConfirmation,
    fetchRegions,
    clearSearch: clearSearchState,
    handleAuthError
  };
};

export default useRegionsPage;

