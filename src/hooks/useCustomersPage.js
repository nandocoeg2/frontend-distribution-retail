import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import customerService from '../services/customerService';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
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

  const handleAuthError = useCallback((err) => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      localStorage.clear();
      navigate('/login');
      toastService.error('Session expired. Please login again.');
      return true;
    }
    return false;
  }, [navigate]);

  const fetchCustomers = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const result = await customerService.getAllCustomers(page, limit);
      setCustomers(result.data || []);
      setPagination(result.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message);
        toastService.error(`Gagal memuat data customers: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchCustomers = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchCustomers(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      const result = await customerService.searchCustomers(query, page, limit);
      setCustomers(result.data || []);
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
      setSearchLoading(false);
    }
  }, [fetchCustomers, handleAuthError]);

  const deleteCustomerFunction = async (id) => {
    try {
      await customerService.deleteCustomer(id);
      setCustomers(customers.filter((customer) => customer.id !== id));
      toastService.success('Customer berhasil dihapus');
      // Refetch to ensure data consistency, especially with pagination
      fetchCustomers(pagination.currentPage, pagination.itemsPerPage);
    } catch (err) {
      if (!handleAuthError(err)) {
        toastService.error(`Gagal menghapus customer: ${err.message}`);
      }
    }
  };

  const deleteCustomerConfirmation = useDeleteConfirmation(
    deleteCustomerFunction,
    'Apakah Anda yakin ingin menghapus customer ini?',
    'Hapus Customer'
  );

  const deleteCustomer = deleteCustomerConfirmation.showDeleteConfirmation;

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchCustomers(query, 1, pagination.itemsPerPage); // Reset to first page when searching
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchCustomers(searchQuery, newPage, pagination.itemsPerPage);
    } else {
      fetchCustomers(newPage, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      itemsPerPage: newLimit,
      currentPage: 1 // Reset to first page
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchCustomers(searchQuery, 1, newLimit);
    } else {
      fetchCustomers(1, newLimit);
    }
  };

  useEffect(() => {
    fetchCustomers(1, pagination.itemsPerPage); // Start on first page

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchCustomers]);

  return {
    customers,
    setCustomers,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteCustomer,
    deleteCustomerConfirmation,
    fetchCustomers,
    handleAuthError
  };
};

export default useCustomers;

