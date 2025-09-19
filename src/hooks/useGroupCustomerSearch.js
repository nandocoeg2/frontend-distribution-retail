import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { groupCustomerService } from '../services/groupCustomerService';

const useGroupCustomerSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Sesi telah berakhir. Silakan login kembali.');
  }, [navigate]);

  const searchGroupCustomers = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      setSearchResults([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await groupCustomerService.searchGroupCustomers(query, page, limit);
      
      if (result.success) {
        // API mengembalikan data dalam format: {success: true, data: {data: [...], pagination: {...}}}
        setSearchResults(result.data.data || []);
        setPagination(result.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1
        });
      } else {
        throw new Error(result.error?.message || 'Failed to search group customers');
      }
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message.includes('401')) {
        handleAuthError();
        return;
      }
      
      let errorMessage = 'Gagal mencari group customers';
      if (err.message.includes('404')) {
        errorMessage = 'Tidak ada hasil pencarian yang ditemukan';
      } else if (err.message.includes('500')) {
        errorMessage = 'Terjadi kesalahan server saat mencari. Silakan coba lagi.';
      } else if (err.message.includes('Network')) {
        errorMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toastService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchGroupCustomers(query, 1, pagination.limit);
    }, 500);

    setDebounceTimeout(timeout);
  }, [debounceTimeout, searchGroupCustomers, pagination.limit]);

  const handlePageChange = useCallback((newPage) => {
    if (searchQuery.trim()) {
      searchGroupCustomers(searchQuery, newPage, pagination.limit);
    }
  }, [searchQuery, searchGroupCustomers, pagination.limit]);

  const handleLimitChange = useCallback((newLimit) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit
    }));
    
    if (searchQuery.trim()) {
      searchGroupCustomers(searchQuery, 1, newLimit);
    }
  }, [searchQuery, searchGroupCustomers]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1
    });
    setError(null);
  }, []);

  const refreshSearch = useCallback(() => {
    if (searchQuery.trim()) {
      searchGroupCustomers(searchQuery, pagination.page, pagination.limit);
    }
  }, [searchQuery, searchGroupCustomers, pagination.page, pagination.limit]);

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
    searchQuery,
    setSearchQuery,
    searchGroupCustomers,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    refreshSearch
  };
};

export default useGroupCustomerSearch;
