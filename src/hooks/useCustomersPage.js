import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

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

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchCustomers = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/customers?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch customers');

      const result = await response.json();
      setCustomers(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
      toastService.error('Failed to load customers');
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
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/customers/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to search customers');

      const result = await response.json();
      setCustomers(result.data);
      setPagination(result.pagination);
    } catch (err) {
      toastService.error('Failed to search customers');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchCustomers, handleAuthError]);

  const deleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?'))
      return;

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to delete customer');

      setCustomers(customers.filter((customer) => customer.id !== id));
      toastService.success('Customer deleted successfully');
    } catch (err) {
      toastService.error('Failed to delete customer');
    }
  };

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
      itemsPerPage: newLimit
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchCustomers(searchQuery, 1, newLimit); // Reset to first page when changing limit
    } else {
      fetchCustomers(1, newLimit); // Reset to first page when changing limit
    }
  };

  useEffect(() => {
    fetchCustomers(1, pagination.itemsPerPage); // Start on first page

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchCustomers, debounceTimeout]);

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
    fetchCustomers,
    handleAuthError
  };
};

export default useCustomers;
