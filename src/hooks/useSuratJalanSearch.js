import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import suratJalanService from '../services/suratJalanService';

const useSuratJalanSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({
    no_surat_jalan: '',
    deliver_to: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const searchSuratJalan = useCallback(async (params, page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);
      
      const result = await suratJalanService.searchSuratJalan(params, page, limit);
      
      if (result.success) {
        setSearchResults(result.data.suratJalan);
        setPagination(result.data.pagination);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to search surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      const errorMessage = err.message || 'Gagal mencari surat jalan';
      setError(errorMessage);
      toastService.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const debouncedSearch = useCallback((params, page = 1, limit = 10) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchSuratJalan(params, page, limit);
    }, 500);
  }, [searchSuratJalan]);

  const handleSearch = useCallback((field, value) => {
    const newParams = {
      ...searchParams,
      [field]: value
    };
    
    setSearchParams(newParams);
    
    // Clear other fields when searching
    if (value.trim()) {
      const clearedParams = { no_surat_jalan: '', deliver_to: '' };
      clearedParams[field] = value;
      debouncedSearch(clearedParams, 1, pagination.limit);
    } else {
      // If search is cleared, show all results
      setSearchResults([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
      });
    }
  }, [searchParams, pagination.limit, debouncedSearch]);

  const handlePageChange = useCallback((newPage) => {
    const hasSearchQuery = Object.values(searchParams).some(value => value.trim());
    
    if (hasSearchQuery) {
      searchSuratJalan(searchParams, newPage, pagination.limit);
    }
  }, [searchParams, pagination.limit, searchSuratJalan]);

  const handleLimitChange = useCallback((newLimit) => {
    const newPagination = {
      ...pagination,
      limit: newLimit
    };
    setPagination(newPagination);

    const hasSearchQuery = Object.values(searchParams).some(value => value.trim());
    
    if (hasSearchQuery) {
      searchSuratJalan(searchParams, 1, newLimit);
    }
  }, [searchParams, pagination, searchSuratJalan]);

  const clearSearch = useCallback(() => {
    setSearchParams({
      no_surat_jalan: '',
      deliver_to: ''
    });
    setSearchResults([]);
    setPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1
    });
    setError(null);
    setIsSearching(false);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  const getSearchSummary = useCallback(() => {
    const activeFilters = Object.entries(searchParams)
      .filter(([key, value]) => value.trim())
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
  }, [searchParams, isSearching, searchResults.length, pagination]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  return {
    searchResults,
    setSearchResults,
    pagination,
    setPagination,
    loading,
    error,
    searchParams,
    setSearchParams,
    isSearching,
    searchSuratJalan,
    handleSearch,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    getSearchSummary,
    clearError,
    cleanup
  };
};

export default useSuratJalanSearch;
