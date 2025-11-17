import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { getMasterParameters, searchMasterParameters, deleteMasterParameter } from '../services/masterParameterService';
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

const parseMasterParametersResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Failed to load master parameters');
  }

  let rawData = response?.data?.data || response?.data || [];
  if (!Array.isArray(rawData)) {
    rawData = Array.isArray(rawData?.data) ? rawData.data : [];
  }

  const metaData = response?.data?.meta || {};
  const currentPage = metaData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = metaData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = metaData.total || INITIAL_PAGINATION.totalItems;

  return {
    results: rawData,
    pagination: {
      currentPage,
      page: currentPage,
      totalPages: metaData.totalPages || INITIAL_PAGINATION.totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage
    }
  };
};

const resolveMasterParameterError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to load master parameters';
};

const useMasterParametersPage = () => {
  const navigate = useNavigate();

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: masterParameters,
    setSearchResults: setMasterParameters,
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
        return getMasterParameters(page, limit);
      }
      return searchMasterParameters(trimmedQuery, page, limit);
    },
    parseResponse: parseMasterParametersResponse,
    resolveErrorMessage: resolveMasterParameterError,
    onAuthError: handleAuthRedirect
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchMasterParameters = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchQuery]);

  const handleDeleteMasterParameter = useCallback(async (id) => {
    try {
      await deleteMasterParameter(id);
      toastService.success('Master parameter deleted successfully');

      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || masterParameters.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return;
      }
      const message = resolveMasterParameterError(err) || 'Failed to delete master parameter';
      setError(message);
      toastService.error(message);
    }
  }, [authHandler, masterParameters.length, pagination, performSearch, resolveLimit, searchQuery, setError]);

  useEffect(() => {
    fetchMasterParameters(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchMasterParameters]);

  return {
    masterParameters,
    setMasterParameters,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    deleteMasterParameter: handleDeleteMasterParameter,
    fetchMasterParameters,
    handleAuthError: authHandler
  };
};

export default useMasterParametersPage;
