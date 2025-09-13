import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '@/services/toastService';
import supplierService from '@/services/supplierService';

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
      setSuppliers(result.data);
      setPagination(result.pagination);
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
      setSuppliers(result.data);
      setPagination(result.pagination);
    } catch (err) {
      toastService.error('Failed to search suppliers');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchSuppliers]);

  const deleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?'))
      return;

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to delete supplier');

      setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
      toastService.success('Supplier deleted successfully');
    } catch (err) {
      toastService.error('Failed to delete supplier');
    }
  };

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
    fetchSuppliers,
    handleAuthError
  };
};

export default useSuppliers;
