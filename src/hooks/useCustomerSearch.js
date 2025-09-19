import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import customerService from '../services/customerService';
import toastService from '../services/toastService';

const useCustomerSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback((err) => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      localStorage.clear();
      navigate('/login');
      toastService.error('Session expired. Please login again.');
      return true;
    }
    return false;
  }, [navigate]);

  const searchCustomers = useCallback(async (query, page = 1, limit = 10) => {
    if (!query?.trim()) {
      setSearchResults([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await customerService.searchCustomers(query, page, limit);
      setSearchResults(result.data || []);
      setPagination(result.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message);
        toastService.error(`Gagal mencari customers: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchCustomers(query, 1, pagination.itemsPerPage);
    }, 500);

    setDebounceTimeout(timeout);
  }, [debounceTimeout, searchCustomers, pagination.itemsPerPage]);

  const handlePageChange = useCallback((newPage) => {
    if (searchQuery.trim()) {
      searchCustomers(searchQuery, newPage, pagination.itemsPerPage);
    }
  }, [searchQuery, searchCustomers, pagination.itemsPerPage]);

  const handleLimitChange = useCallback((newLimit) => {
    const newPagination = {
      ...pagination,
      itemsPerPage: newLimit,
      currentPage: 1
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchCustomers(searchQuery, 1, newLimit);
    }
  }, [pagination, searchQuery, searchCustomers]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    });
    setError(null);
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      setDebounceTimeout(null);
    }
  }, [debounceTimeout]);

  const performSearch = useCallback((query, page = 1, limit = 10) => {
    setSearchQuery(query);
    searchCustomers(query, page, limit);
  }, [searchCustomers]);

  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    pagination,
    loading,
    error,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    performSearch,
    searchCustomers
  };
};

export default useCustomerSearch;
