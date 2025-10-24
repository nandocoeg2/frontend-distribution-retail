import { useCallback, useEffect } from 'react';
import usePaginatedSearch from './usePaginatedSearch';
import supplierService from '@/services/supplierService';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10
};

const parseSupplierResponse = (response) => {
  if (!response?.success) {
    throw new Error(response?.message || 'Gagal mencari supplier');
  }

  const data = response.data || {};

  return {
    results: data.data || [],
    pagination: data.pagination || INITIAL_PAGINATION
  };
};

const resolveSupplierError = (error) => {
  return error?.response?.data?.message || error?.message || 'Gagal mencari supplier';
};

const useSupplierSearch = () => {
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
    isSearching,
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
    searchFn: (query, page, limit) => supplierService.searchSuppliers(query, page, limit),
    parseResponse: parseSupplierResponse,
    resolveErrorMessage: resolveSupplierError,
    requireInput: true
  });

  useEffect(() => {
    if (Array.isArray(searchResults) && searchResults.length > 0) {
      return undefined;
    }

    let isMounted = true;

    const preloadSuppliers = async () => {
      try {
        const limit = resolveLimit();
        const response = await supplierService.getAllSuppliers(1, limit);
        const { results, pagination: initialPagination } = parseSupplierResponse(response) || {};

        if (!isMounted) {
          return;
        }

        setSearchResults((prev) => {
          if (Array.isArray(prev) && prev.length > 0) {
            return prev;
          }
          return results || [];
        });

        setPagination((prev) => {
          if (prev && (prev.totalItems || prev.total || 0) > 0) {
            return prev;
          }
          return initialPagination || INITIAL_PAGINATION;
        });

        setError(null);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message = resolveSupplierError(err);
        setError((prev) => prev || message);
        console.error('Failed to preload suppliers:', err);
      }
    };

    preloadSuppliers();

    return () => {
      isMounted = false;
    };
  }, [resolveLimit, searchResults, setError, setPagination, setSearchResults]);

  const handleSearchChange = useCallback((event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit(pagination));
  }, [debouncedSearch, pagination, resolveLimit, setSearchQuery]);

  const clearSearchState = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  const getSearchSuggestions = useCallback(async (query, limit = 5) => {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const response = await supplierService.searchSuppliers(query, 1, limit);
      if (response.success) {
        return (response.data?.data || []).map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          code: supplier.code,
          address: supplier.address
        }));
      }
    } catch (err) {
      console.error('Error getting search suggestions:', err);
    }

    return [];
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    pagination,
    loading,
    error,
    setError,
    isSearching,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    clearSearch: clearSearchState,
    searchSuppliers: performSearch,
    getSearchSuggestions,
    setSearchResults,
    setPagination,
    handleAuthError
  };
};

export default useSupplierSearch;
