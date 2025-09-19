import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';

const useSearch = (searchFunction, options = {}) => {
  const {
    initialQuery = '',
    initialResults = [],
    itemsPerPage = 10,
    transformResponse = (res) => ({
      data: res.data?.data || res.data || [],
      pagination: res.data?.pagination || res.pagination,
    }),
  } = options;

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState(initialResults);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: itemsPerPage,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimeout = useRef(null);
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

  const performSearch = useCallback(async (query, page = 1, limit = pagination.itemsPerPage) => {
    if (!query?.trim()) {
      setSearchResults([]);
      setPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      }));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await searchFunction(query, page, limit);
      const { data, pagination: responsePagination } = transformResponse(result);

      setSearchResults(data);
      setPagination({
        currentPage: responsePagination?.currentPage || responsePagination?.page || 1,
        totalPages: responsePagination?.totalPages || 1,
        totalItems: responsePagination?.totalItems || responsePagination?.total || 0,
        itemsPerPage: responsePagination?.itemsPerPage || responsePagination?.limit || limit,
      });

    } catch (err) {
      if (!handleAuthError(err)) {
        const errorMessage = err.response?.data?.error || err.message || 'An unknown error occurred';
        setError(errorMessage);
        toastService.error(`Search failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [searchFunction, handleAuthError, pagination.itemsPerPage, transformResponse]);

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      performSearch(query, 1);
    }, 500);
  }, [performSearch]);

  const handlePageChange = useCallback((newPage) => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, newPage, pagination.itemsPerPage);
    }
  }, [searchQuery, performSearch, pagination.itemsPerPage]);

  const handleLimitChange = useCallback((newLimit) => {
    setPagination(prev => ({ ...prev, itemsPerPage: newLimit, currentPage: 1 }));
    if (searchQuery.trim()) {
      performSearch(searchQuery, 1, newLimit);
    }
  }, [searchQuery, performSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
    }));
    setError(null);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

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
  };
};

export default useSearch;
