import { useState, useEffect, useCallback } from 'react';
import purchaseOrderService from '../services/purchaseOrderService';
import toastService from '../services/toastService';

const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(false);
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

  const fetchPurchaseOrders = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseOrderService.getAllPurchaseOrders(page, limit);
      console.log('Purchase Orders API Response:', response); // Debug log
      
      if (response && response.success && response.data) {
        // Handle API response structure: { success: true, data: { data: [...], pagination: {...} } }
        const purchaseOrdersData = Array.isArray(response.data.data) ? response.data.data : [];
        setPurchaseOrders(purchaseOrdersData);
        setPagination(response.data.pagination || pagination);
      } else if (response && Array.isArray(response.data)) {
        // Handle direct array response
        setPurchaseOrders(response.data);
      } else {
        setPurchaseOrders([]);
      }
    } catch (err) {
      const errorMessage = err.message || 'Gagal mengambil data purchase orders';
      setError(errorMessage);
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error(errorMessage);
      }
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchPurchaseOrders = useCallback(async (query, field, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchPurchaseOrders(page, limit);
      return;
    }
    try {
      setSearchLoading(true);
      const searchParams = {};
      searchParams[field || 'customer_name'] = query;
      
      const result = await purchaseOrderService.searchPurchaseOrders(searchParams, page, limit);
      
      if (result.success) {
        setPurchaseOrders(result.data.data || []);
        setPagination(result.data.pagination || pagination);
      } else {
        throw new Error(result.error?.message || 'Failed to search purchase orders');
      }
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error('Failed to search purchase orders');
      }
    } finally {
      setSearchLoading(false);
    }
  }, [handleAuthError, fetchPurchaseOrders]);

  const getPurchaseOrder = useCallback(async (id) => {
    try {
      const result = await purchaseOrderService.getPurchaseOrderById(id);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to fetch purchase order details');
      }
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error('Failed to load purchase order details');
      }
      return null;
    }
  }, [handleAuthError]);

  const createPurchaseOrder = useCallback(async (formData, files = []) => {
    try {
      const result = await purchaseOrderService.createPurchaseOrder(formData, files);
      
      if (result.success) {
        toastService.success('Purchase order created successfully');
        fetchPurchaseOrders(pagination.currentPage, pagination.itemsPerPage);
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create purchase order');
      }
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error(err.message || 'Failed to create purchase order');
      }
      return null;
    }
  }, [handleAuthError, fetchPurchaseOrders, pagination]);

  const updatePurchaseOrder = useCallback(async (id, updateData) => {
    try {
      const result = await purchaseOrderService.updatePurchaseOrder(id, updateData);
      
      if (result.success) {
        toastService.success('Purchase order updated successfully');
        fetchPurchaseOrders(pagination.currentPage, pagination.itemsPerPage);
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update purchase order');
      }
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error(err.message || 'Failed to update purchase order');
      }
      return null;
    }
  }, [handleAuthError, fetchPurchaseOrders, pagination]);

  const deletePurchaseOrder = useCallback(async (id) => {
    try {
      const result = await purchaseOrderService.deletePurchaseOrder(id);
      
      if (result.success) {
        toastService.success('Purchase order deleted successfully');
        fetchPurchaseOrders(pagination.currentPage, pagination.itemsPerPage);
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to delete purchase order');
      }
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error(err.message || 'Failed to delete purchase order');
      }
      return false;
    }
  }, [handleAuthError, fetchPurchaseOrders, pagination]);

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
      searchPurchaseOrders(searchQuery, searchField, 1, newLimit);
    } else {
      fetchPurchaseOrders(1, newLimit);
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
        fetchPurchaseOrders(1, pagination.itemsPerPage);
      } else {
        searchPurchaseOrders(query, searchField, 1, pagination.itemsPerPage);
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
    refetch: fetchPurchaseOrders
  };
};

export default usePurchaseOrders;