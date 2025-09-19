import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { searchInventories } from '../services/inventoryService';

const useInventorySearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const performSearch = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
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
      const response = await searchInventories(query, page, limit);
      
      if (response.success) {
        setSearchResults(response.data.data);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.error?.message || 'Failed to search inventories');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to search inventories');
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      performSearch(query, 1, pagination.itemsPerPage);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    performSearch(searchQuery, newPage, pagination.itemsPerPage);
  };

  const handleLimitChange = (newLimit) => {
    performSearch(searchQuery, 1, newLimit);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    });
    setError(null);
  };

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
    setError,
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    performSearch,
    clearSearch
  };
};

export default useInventorySearch;
