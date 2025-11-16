import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import invoicePengirimanService from '../services/invoicePengirimanService';
import usePaginatedSearch from './usePaginatedSearch';

const INITIAL_SEARCH_PARAMS = {
  no_invoice: '',
  deliver_to: '',
  type: '',
  statusId: '',
  purchaseOrderId: '',
  tanggal_start: '',
  tanggal_end: ''
};

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10
};

const parseInvoicePengirimanResponse = (response) => {
  if (!response?.success) {
    throw new Error(response?.error?.message || 'Gagal melakukan pencarian invoice pengiriman');
  }

  return {
    results: response.data?.data || [],
    pagination: response.data?.pagination || INITIAL_PAGINATION
  };
};

const resolveInvoicePengirimanError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Gagal melakukan pencarian invoice pengiriman';
};

const useInvoicePengirimanSearch = () => {
  const navigate = useNavigate();

  const searchFn = useCallback(async (params, page, limit) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, value]) => {
        if (typeof value === 'string') {
          return value.trim() !== '';
        }
        return value !== null && value !== undefined;
      })
    );

    return invoicePengirimanService.searchInvoicePengiriman(filteredParams, page, limit);
  }, []);

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
    performSearch,
    debouncedSearch,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    handleAuthError,
    resolveLimit
  } = usePaginatedSearch({
    initialInput: INITIAL_SEARCH_PARAMS,
    initialPagination: INITIAL_PAGINATION,
    searchFn,
    parseResponse: parseInvoicePengirimanResponse,
    resolveErrorMessage: resolveInvoicePengirimanError,
    requireInput: false,
    onAuthError: () => {
      localStorage.clear();
      navigate('/login');
      toastService.error('Session expired. Please login again.');
    }
  });

  const handleSearchParamChange = useCallback((field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setSearchParams]);

  const handleSearch = useCallback((params = searchParams, page = 1) => {
    debouncedSearch(params, page, resolveLimit(pagination));
  }, [debouncedSearch, pagination, resolveLimit, searchParams]);

  const handleQuickSearch = useCallback((query, field = 'no_invoice') => {
    const newParams = {
      ...searchParams,
      [field]: query
    };

    setSearchParams(newParams);
    debouncedSearch(newParams, 1, resolveLimit(pagination));
  }, [debouncedSearch, pagination, resolveLimit, searchParams, setSearchParams]);

  const handleAdvancedSearch = useCallback((params) => {
    setSearchParams(params);
    performSearch(params, 1, resolveLimit(pagination));
  }, [performSearch, pagination, resolveLimit, setSearchParams]);

  const clearSearchState = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  const getSearchSummary = useCallback(() => {
    const activeFilters = Object.entries(searchParams)
      .filter(([_, value]) => value && value.toString().trim() !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return activeFilters ? `Filter aktif: ${activeFilters}` : 'Tidak ada filter aktif';
  }, [searchParams]);

  const hasActiveFilters = useCallback(() => {
    return Object.values(searchParams).some(value => value && value.toString().trim() !== '');
  }, [searchParams]);

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
    performSearch,
    handleSearchParamChange,
    handleSearch,
    handleQuickSearch,
    handleAdvancedSearch,
    clearSearch: clearSearchState,
    handlePageChange,
    handleLimitChange,
    getSearchSummary,
    hasActiveFilters,
    handleAuthError
  };
};

export default useInvoicePengirimanSearch;
