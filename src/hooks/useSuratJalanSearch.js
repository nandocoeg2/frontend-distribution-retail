import { useCallback } from 'react';
import usePaginatedSearch from './usePaginatedSearch';
import suratJalanService from '../services/suratJalanService';

const INITIAL_SEARCH_PARAMS = {
  no_surat_jalan: '',
  deliver_to: ''
};

const INITIAL_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

const parseSuratJalanResponse = (response) => {
  if (!response?.success) {
    throw new Error(response?.message || 'Failed to search surat jalan');
  }

  const data = response.data || {};
  const apiPagination = data.pagination || {};

  return {
    results: data.data || data.suratJalan || [],
    pagination: {
      page: apiPagination.currentPage || apiPagination.page || INITIAL_PAGINATION.page,
      limit: apiPagination.itemsPerPage || apiPagination.limit || INITIAL_PAGINATION.limit,
      total: apiPagination.totalItems || apiPagination.total || INITIAL_PAGINATION.total,
      totalPages: apiPagination.totalPages || INITIAL_PAGINATION.totalPages
    }
  };
};

const resolveSuratJalanError = (error) => {
  return error?.message || error?.response?.data?.error?.message || 'Gagal mencari surat jalan';
};

const useSuratJalanSearch = () => {
  const {
    input: searchParams,
    setInput: setSearchParams,
    searchResults,
    setSearchResults,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    isSearching,
    performSearch,
    debouncedSearch,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    clearDebounce,
    handleAuthError,
    resolveLimit
  } = usePaginatedSearch({
    initialInput: INITIAL_SEARCH_PARAMS,
    initialPagination: INITIAL_PAGINATION,
    searchFn: (params, page, limit) => suratJalanService.searchSuratJalan(params, page, limit),
    parseResponse: parseSuratJalanResponse,
    resolveErrorMessage: resolveSuratJalanError,
    requireInput: true
  });

  const handleSearch = useCallback((field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));

    const trimmedValue = value.trim();
    const currentLimit = resolveLimit(pagination);

    if (trimmedValue) {
      const requestParams = { ...INITIAL_SEARCH_PARAMS, [field]: trimmedValue };
      debouncedSearch(requestParams, 1, currentLimit);
    } else {
      const hasRemainingFilters = Object.entries({ ...searchParams, [field]: trimmedValue })
        .some(([, filterValue]) => filterValue.trim());

      if (hasRemainingFilters) {
        const requestParams = Object.fromEntries(
          Object.entries({ ...searchParams, [field]: trimmedValue })
            .filter(([, filterValue]) => filterValue.trim())
        );
        if (Object.keys(requestParams).length > 0) {
          debouncedSearch(requestParams, 1, currentLimit);
          return;
        }
      }

      clearSearch();
    }
  }, [clearSearch, debouncedSearch, pagination, resolveLimit, searchParams, setSearchParams]);

  const clearSearchState = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  const getSearchSummary = useCallback(() => {
    const activeFilters = Object.entries(searchParams)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return {
      isSearching,
      hasResults: searchResults.length > 0,
      totalResults: pagination.total,
      activeFilters,
      currentPage: pagination.page,
      totalPages: pagination.totalPages
    };
  }, [isSearching, pagination, searchParams, searchResults.length]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const cleanup = useCallback(() => {
    clearDebounce();
  }, [clearDebounce]);

  return {
    searchResults,
    setSearchResults,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    searchParams,
    setSearchParams,
    isSearching,
    searchSuratJalan: performSearch,
    handleSearch,
    handlePageChange,
    handleLimitChange,
    clearSearch: clearSearchState,
    getSearchSummary,
    clearError,
    cleanup,
    handleAuthError
  };
};

export default useSuratJalanSearch;
