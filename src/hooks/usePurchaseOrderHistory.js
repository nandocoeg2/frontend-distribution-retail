import { useState, useEffect, useCallback } from 'react';
import toastService from '../services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

const usePurchaseOrderHistory = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('customer_name');
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    window.location.href = '/login';
    toastService.error('Session expired. Please login again.');
  }, []);

  const getAccessToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  const fetchPurchaseOrders = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_URL}/purchase-orders/history?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch purchase order history');
      const result = await response.json();
      setPurchaseOrders(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      toastService.error('Failed to load purchase order history');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, handleAuthError]);

  const searchPurchaseOrders = useCallback(async (query, field, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchPurchaseOrders(page, limit);
      return;
    }
    try {
      setSearchLoading(true);
      const accessToken = getAccessToken();
      const url = new URL(`${API_URL}/purchase-orders/history/search`);
      url.searchParams.append(field || 'customer_name', query);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', limit);
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      if (!response.ok) throw new Error('Failed to search purchase order history');
      const result = await response.json();
      setPurchaseOrders(result.data);
      setPagination(result.pagination);
    } catch (err) {
      toastService.error('Failed to search purchase order history');
    } finally {
      setSearchLoading(false);
    }
  }, [getAccessToken, handleAuthError, fetchPurchaseOrders]);

  const getPurchaseOrder = useCallback(async (id) => {
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_URL}/purchase-orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept': 'application/json',
        },
      });
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return null;
      }
      if (!response.ok) throw new Error('Failed to fetch purchase order details');
      const orderData = await response.json();
      return orderData;
    } catch (err) {
      toastService.error('Failed to load purchase order details');
      return null;
    }
  }, [getAccessToken, handleAuthError]);

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchPurchaseOrders(searchQuery, searchField, newPage, pagination.itemsPerPage);
    } else {
      fetchPurchaseOrders(newPage, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      itemsPerPage: newLimit
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchPurchaseOrders(searchQuery, searchField, 1, newLimit); // Reset to first page when changing limit
    } else {
      fetchPurchaseOrders(1, newLimit); // Reset to first page when changing limit
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      if (!query.trim()) {
        fetchPurchaseOrders(1, pagination.itemsPerPage); // Reset to first page when clearing search
      } else {
        searchPurchaseOrders(query, searchField, 1, pagination.itemsPerPage); // Reset to first page when searching
      }
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handleSearchFieldChange = (field) => {
    setSearchField(field);
    if (searchQuery.trim()) {
      searchPurchaseOrders(searchQuery, field, 1, pagination.itemsPerPage);
    }
  };

  const handleSearchQueryChange = (query, field) => {
    setSearchQuery(query);
    setSearchField(field);
    
    if (!query.trim()) {
      fetchPurchaseOrders(1, pagination.itemsPerPage); // Reset to first page when clearing search
    } else {
      searchPurchaseOrders(query, field, 1, pagination.itemsPerPage); // Reset to first page when searching
    }
  };

  useEffect(() => {
    fetchPurchaseOrders(1, pagination.itemsPerPage);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    pagination,
    loading,
    error,
    searchLoading,
    searchQuery,
    searchField,
    fetchPurchaseOrders,
    searchPurchaseOrders,
    getPurchaseOrder,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSearchFieldChange,
    handleSearchQueryChange,
  };
};

export default usePurchaseOrderHistory;

