import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { termOfPaymentService } from '../services/termOfPaymentService';

const useTermOfPayments = () => {
  const [termOfPayments, setTermOfPayments] = useState([]);
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

  const fetchTermOfPayments = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const result = await termOfPaymentService.getAllTermOfPayments(page, limit);
      setTermOfPayments(result.data);
      setPagination(result.meta);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error('Failed to load term of payments');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchTermOfPayments = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchTermOfPayments(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      const result = await termOfPaymentService.searchTermOfPayments(query, page, limit);
      setTermOfPayments(result.data);
      setPagination(result.meta);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Failed to search term of payments');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchTermOfPayments, handleAuthError]);

  const deleteTermOfPayment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this term of payment?'))
      return;

    try {
      await termOfPaymentService.deleteTermOfPayment(id);
      setTermOfPayments(termOfPayments.filter((top) => top.id !== id));
      toastService.success('Term of payment deleted successfully');
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Failed to delete term of payment');
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchTermOfPayments(query, 1, pagination.itemsPerPage);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchTermOfPayments(searchQuery, newPage, pagination.itemsPerPage);
    } else {
      fetchTermOfPayments(newPage, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      itemsPerPage: newLimit
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchTermOfPayments(searchQuery, 1, newLimit);
    } else {
      fetchTermOfPayments(1, newLimit);
    }
  };

  useEffect(() => {
    fetchTermOfPayments(1, pagination.itemsPerPage);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchTermOfPayments]);

  return {
    termOfPayments,
    setTermOfPayments,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteTermOfPayment,
    fetchTermOfPayments,
    handleAuthError
  };
};

export default useTermOfPayments;
