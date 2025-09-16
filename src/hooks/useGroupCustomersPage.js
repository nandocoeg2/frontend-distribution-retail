import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { groupCustomerService } from '../services/groupCustomerService';

const useGroupCustomersPage = () => {
  const [groupCustomers, setGroupCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
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

  const fetchGroupCustomers = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const result = await groupCustomerService.getAllGroupCustomers(page, limit);
      setGroupCustomers(result.data);
      setPagination(result.meta || {
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
      });
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error('Failed to load group customers');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchGroupCustomers = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchGroupCustomers(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      const result = await groupCustomerService.searchGroupCustomers(query, page, limit);
      setGroupCustomers(result.data);
      setPagination(result.meta || {
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10
      });
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Failed to search group customers');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchGroupCustomers, handleAuthError]);

  const deleteGroupCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this group customer?'))
      return;

    try {
      await groupCustomerService.deleteGroupCustomer(id);
      setGroupCustomers(groupCustomers.filter((gc) => gc.id !== id));
      toastService.success('Group customer deleted successfully');
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Failed to delete group customer');
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchGroupCustomers(query, 1, pagination.limit);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchGroupCustomers(searchQuery, newPage, pagination.limit);
    } else {
      fetchGroupCustomers(newPage, pagination.limit);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      limit: newLimit
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchGroupCustomers(searchQuery, 1, newLimit);
    } else {
      fetchGroupCustomers(1, newLimit);
    }
  };

  useEffect(() => {
    fetchGroupCustomers(1, pagination.limit);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchGroupCustomers]);

  return {
    groupCustomers,
    setGroupCustomers,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteGroupCustomer,
    fetchGroupCustomers,
    handleAuthError
  };
};

export default useGroupCustomersPage;

