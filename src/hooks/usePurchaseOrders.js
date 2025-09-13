import { useState, useEffect, useCallback } from 'react';
import toastService from '../services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

const usePurchaseOrders = () => {
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
      const response = await fetch(`${API_URL}/purchase-orders/?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      const result = await response.json();
      setPurchaseOrders(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      toastService.error('Failed to load purchase orders');
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
      const url = new URL(`${API_URL}/purchase-orders/search`);
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
      if (!response.ok) throw new Error('Failed to search purchase orders');
      const result = await response.json();
      setPurchaseOrders(result.data);
      setPagination(result.pagination);
    } catch (err) {
      toastService.error('Failed to search purchase orders');
    } finally {
      setSearchLoading(false);
    }
  }, [getAccessToken, handleAuthError, fetchPurchaseOrders]);

  const deletePurchaseOrder = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${API_URL}/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      if (!response.ok) throw new Error('Failed to delete purchase order');
      setPurchaseOrders(prev => prev.filter((order) => order.id !== id));
      toastService.success('Purchase order deleted successfully');
    } catch (err) {
      toastService.error('Failed to delete purchase order');
    }
  }, [getAccessToken, handleAuthError]);

  const createPurchaseOrder = useCallback(async (formData, file) => {
    try {
      const accessToken = getAccessToken();
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });
      if (file) {
        data.append('file', file);
      }

      const response = await fetch(`${API_URL}/purchase-orders/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: data,
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return null;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create purchase order');
      }
      const newOrder = await response.json();
      toastService.success('Purchase order created successfully');
      return newOrder;
    } catch (err) {
      console.error('Create purchase order error:', err);
      toastService.error(err.message || 'Failed to create purchase order');
      return null;
    }
  }, [getAccessToken, handleAuthError]);

  const updatePurchaseOrder = useCallback(async (id, formData) => {
    try {
      const accessToken = getAccessToken();
      
      const response = await fetch(`${API_URL}/purchase-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return null;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update purchase order');
      }
      const updatedOrder = await response.json();
      toastService.success('Purchase order updated successfully');
      return updatedOrder;
    } catch (err) {
      console.error('Update purchase order error:', err);
      toastService.error(err.message || 'Failed to update purchase order');
      return null;
    }
  }, [getAccessToken, handleAuthError]);

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
    deletePurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrder,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSearchFieldChange,
  };
};

export default usePurchaseOrders;
