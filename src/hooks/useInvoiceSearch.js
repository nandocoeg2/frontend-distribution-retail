import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import invoiceService from '../services/invoiceService';

const useInvoiceSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({
    no_invoice: '',
    deliver_to: '',
    type: '',
    statusPembayaranId: '',
    purchaseOrderId: '',
    tanggal_start: '',
    tanggal_end: ''
  });
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const performSearch = useCallback(async (params = searchParams, page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      // Filter out empty values
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value && value.toString().trim() !== '')
      );
      
      const result = await invoiceService.searchInvoices(filteredParams, page, limit);
      
      if (result.success) {
        setSearchResults(result.data.data);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.error?.message || 'Gagal melakukan pencarian');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      
      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal melakukan pencarian';
      setError(errorMessage);
      toastService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [searchParams, handleAuthError]);

  const handleSearchParamChange = useCallback((field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSearch = useCallback((params = searchParams, page = 1) => {
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(params, page, pagination.itemsPerPage);
    }, 500);
    
    setDebounceTimeout(timeout);
  }, [searchParams, pagination.itemsPerPage, debounceTimeout, performSearch]);

  const handleQuickSearch = useCallback((query, field = 'no_invoice') => {
    const newParams = {
      ...searchParams,
      [field]: query
    };
    
    setSearchParams(newParams);
    handleSearch(newParams, 1);
  }, [searchParams, handleSearch]);

  const handleAdvancedSearch = useCallback((params) => {
    setSearchParams(params);
    handleSearch(params, 1);
  }, [handleSearch]);

  const clearSearch = useCallback(() => {
    const emptyParams = {
      no_invoice: '',
      deliver_to: '',
      type: '',
      statusPembayaranId: '',
      purchaseOrderId: '',
      tanggal_start: '',
      tanggal_end: ''
    };
    
    setSearchParams(emptyParams);
    setSearchResults([]);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    });
    setError(null);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    handleSearch(searchParams, newPage);
  }, [searchParams, handleSearch]);

  const handleLimitChange = useCallback((newLimit) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: newLimit
    }));
    handleSearch(searchParams, 1);
  }, [searchParams, handleSearch]);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return {
    searchResults,
    setSearchResults,
    pagination,
    setPagination,
    loading,
    error,
    searchParams,
    setSearchParams,
    performSearch,
    handleSearchParamChange,
    handleSearch,
    handleQuickSearch,
    handleAdvancedSearch,
    clearSearch,
    handlePageChange,
    handleLimitChange,
    getSearchSummary,
    hasActiveFilters,
    handleAuthError
  };
};

export default useInvoiceSearch;
