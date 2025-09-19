import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '@/services/toastService';
import supplierService from '@/services/supplierService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const API_URL = 'http://localhost:5050/api/v1';

const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchSuppliers = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const result = await supplierService.getAllSuppliers(page, limit);
      if (result.success) {
        setSuppliers(result.data?.data || []);
        setPagination({
          currentPage: result.data?.pagination?.currentPage || 1,
          totalPages: result.data?.pagination?.totalPages || 1,
          totalItems: result.data?.pagination?.totalItems || 0,
          itemsPerPage: result.data?.pagination?.itemsPerPage || 10
        });
      } else {
        throw new Error(result.message || 'Failed to load suppliers');
      }
    } catch (err) {
      setError(err.message);
      toastService.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchSuppliers = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchSuppliers(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      const result = await supplierService.searchSuppliers(query, page, limit);
      if (result.success) {
        setSuppliers(result.data?.data || []);
        setPagination({
          currentPage: result.data?.pagination?.currentPage || 1,
          totalPages: result.data?.pagination?.totalPages || 1,
          totalItems: result.data?.pagination?.totalItems || 0,
          itemsPerPage: result.data?.pagination?.itemsPerPage || 10
        });
      } else {
        throw new Error(result.message || 'Failed to search suppliers');
      }
    } catch (err) {
      toastService.error('Failed to search suppliers');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchSuppliers]);

  const deleteSupplierFunction = async (id) => {
    try {
      const result = await supplierService.deleteSupplier(id);
      setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
      toastService.success('Supplier deleted successfully');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to delete supplier');
    }
  };

  const deleteSupplierConfirmation = useDeleteConfirmation(
    deleteSupplierFunction,
    'Are you sure you want to delete this supplier?',
    'Delete Supplier'
  );

  const deleteSupplier = deleteSupplierConfirmation.showDeleteConfirmation;

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchSuppliers(searchQuery, newPage, pagination.itemsPerPage);
    } else {
      fetchSuppliers(newPage, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      itemsPerPage: newLimit
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchSuppliers(searchQuery, 1, newLimit); // Reset to first page when changing limit
    } else {
      fetchSuppliers(1, newLimit); // Reset to first page when changing limit
    }
  };

    const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchSuppliers(query, 1, pagination.itemsPerPage); // Reset to first page when searching
    }, 500);

    setDebounceTimeout(timeout);
  };

  const createSupplier = async (supplierData) => {
    try {
      const result = await supplierService.createSupplier(supplierData);
      if (result.success) {
        setSuppliers([result.data, ...suppliers]);
        toastService.success('Supplier created successfully');
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to create supplier');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to create supplier');
      throw err;
    }
  };

  const updateSupplier = async (id, supplierData) => {
    try {
      const result = await supplierService.updateSupplier(id, supplierData);
      if (result.success) {
        setSuppliers(suppliers.map(supplier => 
          supplier.id === id ? result.data : supplier
        ));
        toastService.success('Supplier updated successfully');
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to update supplier');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to update supplier');
      throw err;
    }
  };

  const getSupplierById = async (id) => {
    try {
      const result = await supplierService.getSupplierById(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to get supplier');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to get supplier');
      throw err;
    }
  };

  useEffect(() => {
    fetchSuppliers(1, pagination.itemsPerPage);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchSuppliers]);

  return {
    suppliers,
    setSuppliers,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteSupplier,
    deleteSupplierConfirmation,
    createSupplier,
    updateSupplier,
    getSupplierById,
    fetchSuppliers,
    handleAuthError
  };
};

export default useSuppliers;
