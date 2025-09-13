import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('no_invoice');
  const [searchLoading, setSearchLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchInvoices = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/invoices?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch invoices');

      const result = await response.json();
      setInvoices(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
      toastService.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchInvoices = useCallback(async (query, field, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchInvoices(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      const accessToken = localStorage.getItem('token');
      const searchParams = {};
      searchParams[field] = query;
      const params = new URLSearchParams(searchParams);
      params.append('page', page);
      params.append('limit', limit);
      const response = await fetch(`${API_URL}/invoices/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to search invoices');

      const result = await response.json();
      setInvoices(result.data);
      setPagination(result.pagination);
    } catch (err) {
      toastService.error('Failed to search invoices');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchInvoices, handleAuthError]);

  const deleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?'))
      return;

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to delete invoice');

      setInvoices(invoices.filter((invoice) => invoice.id !== id));
      toastService.success('Invoice deleted successfully');    } catch (err) {
      toastService.error('Failed to delete invoice');
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchInvoices(query, searchField, 1, pagination.itemsPerPage); // Reset to first page when searching
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handleSearchFieldChange = (field) => {
    setSearchField(field);
    setSearchQuery('');

    // If there's a current search, perform it with the new field
    if (searchQuery.trim()) {
      searchInvoices(searchQuery, field, 1, pagination.itemsPerPage);
    } else {
      fetchInvoices(1, pagination.itemsPerPage);
    }
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchInvoices(searchQuery, searchField, newPage, pagination.itemsPerPage);
    } else {
      fetchInvoices(newPage, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      itemsPerPage: newLimit
    };
    setPagination(newPagination);

    if (searchQuery.trim()) {
      searchInvoices(searchQuery, searchField, 1, newLimit); // Reset to first page when changing limit
    } else {
      fetchInvoices(1, newLimit); // Reset to first page when changing limit
    }
  };
  useEffect(() => {
    fetchInvoices(1, pagination.itemsPerPage); // Start on first page

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchInvoices]);

  return {
    invoices,
    setInvoices,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange,
    deleteInvoice,
    fetchInvoices,
    handleAuthError
  };
};

export default useInvoices;
