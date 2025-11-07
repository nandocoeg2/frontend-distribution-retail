import { useCallback } from 'react';
import usePaginatedSearch from './usePaginatedSearch';
import { searchItems } from '../services/itemService';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10
};

const parseItemResponse = (response) => {
  if (!response?.success) {
    throw new Error(response?.error?.message || 'Failed to search items');
  }

  return {
    results: response.data?.data || [],
    pagination: response.data?.pagination || INITIAL_PAGINATION
  };
};

const resolveItemError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to search items';
};

const useItemSearch = () => {
  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults,
    setSearchResults,
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
    searchFn: (query, page, limit) => searchItems(query, page, limit),
    parseResponse: parseItemResponse,
    resolveErrorMessage: resolveItemError,
    requireInput: true
  });

  const handleSearchChange = useCallback((event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit(pagination));
  }, [debouncedSearch, pagination, resolveLimit, setSearchQuery]);

  const clearSearchState = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  return {
    searchResults,
    setSearchResults,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    performSearch,
    clearSearch: clearSearchState,
    handleAuthError
  };
};

export default useItemSearch;
