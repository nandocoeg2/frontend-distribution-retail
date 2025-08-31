import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '@/services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
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

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch suppliers');

      const data = await response.json();
      setSuppliers(data);
    } catch (err) {
      setError(err.message);
      toastService.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchSuppliers = useCallback(async (query) => {
    if (!query.trim()) {
      fetchSuppliers();
      return;
    }

    try {
      setSearchLoading(true);
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers/search/${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to search suppliers');

      const data = await response.json();
      setSuppliers(data);
    } catch (err) {
      toastService.error('Failed to search suppliers');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchSuppliers, handleAuthError]);

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

    const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchSuppliers(query);
    }, 500);

    setDebounceTimeout(timeout);
  };

  useEffect(() => {
    fetchSuppliers();

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchSuppliers, debounceTimeout]);

  return {
    suppliers,
    setSuppliers,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    deleteSupplier,
    fetchSuppliers,
    handleAuthError
  };
};

export default useSuppliers;

