import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const useUsers = () => {
  const [users, setUsers] = useState([]);
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

  const fetchUsers = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.getAllUsers(page, limit);
      setUsers(result.data || []);
      setPagination(result.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message);
        toastService.error(`Gagal memuat data users: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchUsers = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchUsers(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      const result = await userService.searchUsers(query, page, limit);
      setUsers(result.data || []);
      setPagination(result.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message);
        toastService.error(`Gagal mencari users: ${err.message}`);
      }
    } finally {
      setSearchLoading(false);
    }
  }, [fetchUsers, handleAuthError]);

  const deleteUserFunction = async (id) => {
    try {
      await userService.deleteUser(id);
      setUsers(users.filter((user) => user.id !== id));
      toastService.success('User berhasil dihapus');
      // Refetch to ensure data consistency, especially with pagination
      fetchUsers(pagination.currentPage, pagination.itemsPerPage);
    } catch (err) {
      if (!handleAuthError(err)) {
        toastService.error(`Gagal menghapus user: ${err.message}`);
      }
    }
  };

  const deleteUserConfirmation = useDeleteConfirmation(
    deleteUserFunction,
    'Apakah Anda yakin ingin menghapus user ini?',
    'Hapus User'
  );

  const deleteUser = deleteUserConfirmation.showDeleteConfirmation;

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchUsers(query, 1, pagination.itemsPerPage); // Reset to first page when searching
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery, newPage, pagination.itemsPerPage);
    } else {
      fetchUsers(newPage, pagination.itemsPerPage);
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
      searchUsers(searchQuery, 1, newLimit);
    } else {
      fetchUsers(1, newLimit);
    }
  };

  useEffect(() => {
    fetchUsers(1, pagination.itemsPerPage); // Start on first page

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchUsers]);

  return {
    users,
    setUsers,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteUser,
    deleteUserConfirmation,
    fetchUsers,
    handleAuthError
  };
};

export default useUsers;
