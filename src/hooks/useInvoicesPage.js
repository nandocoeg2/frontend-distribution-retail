import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import invoiceService from '../services/invoiceService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

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
      const result = await invoiceService.getAllInvoices(page, limit);
      
      if (result.success) {
        setInvoices(result.data.data);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
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
      const searchParams = {};
      searchParams[field] = query;
      const result = await invoiceService.searchInvoices(searchParams, page, limit);
      
      if (result.success) {
        setInvoices(result.data.data);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.error?.message || 'Failed to search invoices');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to search invoices');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchInvoices, handleAuthError]);

  const createInvoice = async (invoiceData) => {
    try {
      const result = await invoiceService.createInvoice(invoiceData);
      
      if (result.success) {
        toastService.success('Invoice created successfully');
        // Refresh the invoices list
        fetchInvoices(pagination.currentPage, pagination.itemsPerPage);
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create invoice');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to create invoice');
      throw err;
    }
  };

  const updateInvoice = async (id, updateData) => {
    try {
      const result = await invoiceService.updateInvoice(id, updateData);
      
      if (result.success) {
        toastService.success('Invoice updated successfully');
        // Refresh the invoices list
        fetchInvoices(pagination.currentPage, pagination.itemsPerPage);
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update invoice');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to update invoice');
      throw err;
    }
  };

  const deleteInvoiceFunction = async (id) => {
    try {
      const result = await invoiceService.deleteInvoice(id);
      
      if (result.success || result === '') {
        setInvoices(invoices.filter((invoice) => invoice.id !== id));
        toastService.success('Invoice deleted successfully');
      } else {
        throw new Error(result.error?.message || 'Failed to delete invoice');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to delete invoice');
    }
  };

  const deleteInvoiceConfirmation = useDeleteConfirmation(
    deleteInvoiceFunction,
    'Are you sure you want to delete this invoice?',
    'Delete Invoice'
  );

  const deleteInvoice = deleteInvoiceConfirmation.showDeleteConfirmation;

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
    createInvoice,
    updateInvoice,
    deleteInvoice,
    deleteInvoiceConfirmation,
    fetchInvoices,
    handleAuthError
  };
};

export default useInvoices;
