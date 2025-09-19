import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supplierService from '@/services/supplierService';
import toastService from '@/services/toastService';

const useSupplierSearch = () => {
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
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const debounceTimeoutRef = useRef(null);

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const searchSuppliers = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      setSearchResults([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit
      });
      return;
    }

    setLoading(true);
    setError(null);
    setIsSearching(true);

    try {
      const result = await supplierService.searchSuppliers(query, page, limit);
      if (result.success) {
        setSearchResults(result.data?.data || []);
        setPagination({
          currentPage: result.data?.pagination?.currentPage || 1,
          totalPages: result.data?.pagination?.totalPages || 1,
          totalItems: result.data?.pagination?.totalItems || 0,
          itemsPerPage: result.data?.pagination?.itemsPerPage || 10
        });
      } else {
        throw new Error(result.message || 'Gagal mencari supplier');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal mencari supplier';
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      
      toastService.error(errorMessage);
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const debouncedSearch = useCallback((query, page = 1, limit = 10) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchSuppliers(query, page, limit);
    }, 500); // 500ms delay
  }, [searchSuppliers]);

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query, 1, pagination.itemsPerPage);
  }, [debouncedSearch, pagination.itemsPerPage]);

  const handlePageChange = useCallback((newPage) => {
    if (searchQuery.trim()) {
      searchSuppliers(searchQuery, newPage, pagination.itemsPerPage);
    }
  }, [searchQuery, searchSuppliers, pagination.itemsPerPage]);

  const handleLimitChange = useCallback((newLimit) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: newLimit
    }));
    
    if (searchQuery.trim()) {
      searchSuppliers(searchQuery, 1, newLimit);
    }
  }, [searchQuery, searchSuppliers]);

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
    setIsSearching(false);
    
    // Clear any pending debounced search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  const getSearchSuggestions = useCallback(async (query, limit = 5) => {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const result = await supplierService.searchSuppliers(query, 1, limit);
      if (result.success) {
        return (result.data?.data || []).map(supplier => ({
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
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
    isSearching,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    searchSuppliers,
    getSearchSuggestions
  };
};

export default useSupplierSearch;
