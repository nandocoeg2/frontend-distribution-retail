import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
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

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/customers`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch customers');

      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err.message);
      toastService.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchCustomers = useCallback(async (query) => {
    if (!query.trim()) {
      fetchCustomers();
      return;
    }

    try {
      setSearchLoading(true);
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/customers/search/${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to search customers');

      const data = await response.json();
      setCustomers(data);
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
      searchCustomers(query);
    }, 500);

    setDebounceTimeout(timeout);
  };

  useEffect(() => {
    fetchCustomers();

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchCustomers, debounceTimeout]);

  return {
    customers,
    setCustomers,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    deleteCustomer,
    fetchCustomers,
    handleAuthError
  };
};

export default useCustomers;

