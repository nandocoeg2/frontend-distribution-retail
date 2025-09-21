import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import customerService from '../services/customerService';

const useCustomersPage = () => {
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

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchCustomers = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.getAllCustomers(page, limit);
      
      if (response.success) {
        setCustomers(response.data.data);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.error?.message || 'Failed to load customers');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to load customers');
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
      const response = await customerService.search(query, page, limit);
      
      if (response.success) {
        setCustomers(response.data.data);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.error?.message || 'Failed to search customers');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to search customers');
      }
    } finally {
      setSearchLoading(false);
    }
  }, [fetchCustomers, handleAuthError]);

  const handleDeleteCustomer = async (id) => {
    try {
      await customerService.deleteCustomer(id);
      toastService.success('Customer deleted successfully');
      
      // Determine the page to fetch after deletion
      const newPage = (customers.length === 1 && pagination.currentPage > 1)
        ? pagination.currentPage - 1
        : pagination.currentPage;

      // Refresh the list based on whether a search is active
      if (searchQuery.trim()) {
        searchCustomers(searchQuery, newPage, pagination.itemsPerPage);
      } else {
        fetchCustomers(newPage, pagination.itemsPerPage);
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to delete customer');
      }
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchCustomers(query, 1, pagination.itemsPerPage);
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
    if (searchQuery.trim()) {
      searchCustomers(searchQuery, 1, newLimit);
    } else {
      fetchCustomers(1, newLimit);
    }
  };

  useEffect(() => {
    fetchCustomers(1, pagination.itemsPerPage);

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
    deleteCustomer: handleDeleteCustomer,
    fetchCustomers,
    searchCustomers,
    handleAuthError
  };
};

// The original hook was named useCustomers, so we export that name
// to avoid having to refactor the components that use it.
export default useCustomersPage;
