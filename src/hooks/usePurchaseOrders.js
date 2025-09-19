import { useState, useEffect, useCallback } from 'react';
import toastService from '../services/toastService';
import purchaseOrderService from '../services/purchaseOrderService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

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

  const fetchPurchaseOrders = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const result = await purchaseOrderService.getAllPurchaseOrders(page, limit);
      
      if (result.success) {
        setPurchaseOrders(result.data.data || []);
        setPagination(result.data.pagination || pagination);
        setError(null);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch purchase orders');
      }
    } catch (err) {
      setError(err.message);
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error('Failed to load purchase orders');
      }
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

  const deletePurchaseOrderFunction = useCallback(async (id) => {
    try {
      await purchaseOrderService.deletePurchaseOrder(id);
      setPurchaseOrders(prev => prev.filter((order) => order.id !== id));
      toastService.success('Purchase order berhasil dihapus');
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error('Gagal menghapus purchase order');
      }
    }
  }, [handleAuthError]);

  const deletePurchaseOrderConfirmation = useDeleteConfirmation(
    deletePurchaseOrderFunction,
    'Apakah Anda yakin ingin menghapus purchase order ini?',
    'Hapus Purchase Order'
  );

  const deletePurchaseOrder = deletePurchaseOrderConfirmation.showDeleteConfirmation;

  const createPurchaseOrder = useCallback(async (formData, files = []) => {
    try {
      const result = await purchaseOrderService.createPurchaseOrder(formData, files);
      
      if (result.success) {
        toastService.success('Purchase order berhasil dibuat');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create purchase order');
      }
    } catch (err) {
      console.error('Create purchase order error:', err);
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error(err.message || 'Gagal membuat purchase order');
      }
      return null;
    }
  }, [handleAuthError]);

  const updatePurchaseOrder = useCallback(async (id, updateData) => {
    try {
      const result = await purchaseOrderService.updatePurchaseOrder(id, updateData);
      
      if (result.success) {
        toastService.success('Purchase order berhasil diperbarui');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update purchase order');
      }
    } catch (err) {
      console.error('Update purchase order error:', err);
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error(err.message || 'Gagal memperbarui purchase order');
      }
      return null;
    }
  }, [handleAuthError]);

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
        toastService.error('Gagal memuat detail purchase order');
      }
      return null;
    }
  }, [handleAuthError]);

  const processPurchaseOrder = useCallback(async (id, statusCode = 'PROCESSED') => {
    try {
      const result = await purchaseOrderService.processPurchaseOrder(id, statusCode);
      
      if (result.success) {
        toastService.success('Purchase order berhasil diproses');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to process purchase order');
      }
    } catch (err) {
      console.error('Process purchase order error:', err);
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error(err.message || 'Gagal memproses purchase order');
      }
      return null;
    }
  }, [handleAuthError]);

  const bulkCreatePurchaseOrder = useCallback(async (files) => {
    try {
      const result = await purchaseOrderService.bulkCreatePurchaseOrder(files);
      
      if (result.success) {
        toastService.success('Bulk upload purchase order berhasil dimulai');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to bulk create purchase orders');
      }
    } catch (err) {
      console.error('Bulk create purchase order error:', err);
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error(err.message || 'Gagal memulai bulk upload purchase order');
      }
      return null;
    }
  }, [handleAuthError]);

  const getBulkUploadStatus = useCallback(async (fileId) => {
    try {
      const result = await purchaseOrderService.getBulkUploadStatus(fileId);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to get bulk upload status');
      }
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error('Gagal mendapatkan status bulk upload');
      }
      return null;
    }
  }, [handleAuthError]);

  const getAllBulkUploads = useCallback(async (status = null) => {
    try {
      const result = await purchaseOrderService.getAllBulkUploads(status);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to get bulk uploads');
      }
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        handleAuthError();
      } else {
        toastService.error('Gagal mendapatkan daftar bulk upload');
      }
      return null;
    }
  }, [handleAuthError]);

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
    deletePurchaseOrderConfirmation,
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrder,
    processPurchaseOrder,
    bulkCreatePurchaseOrder,
    getBulkUploadStatus,
    getAllBulkUploads,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSearchFieldChange,
  };
};

export default usePurchaseOrders;
