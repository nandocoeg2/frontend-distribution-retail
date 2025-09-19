import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { groupCustomerService } from '../services/groupCustomerService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const useGroupCustomersPage = () => {
  const [groupCustomers, setGroupCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    // Backward compatibility
    page: 1,
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
    toastService.error('Sesi telah berakhir. Silakan login kembali.');
  }, [navigate]);

  const refreshData = useCallback(() => {
    if (searchQuery.trim()) {
      searchGroupCustomers(searchQuery, pagination.currentPage || pagination.page, pagination.itemsPerPage || pagination.limit);
    } else {
      fetchGroupCustomers(pagination.currentPage || pagination.page, pagination.itemsPerPage || pagination.limit);
    }
  }, [searchQuery, pagination, searchGroupCustomers, fetchGroupCustomers]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    fetchGroupCustomers(1, pagination.itemsPerPage || pagination.limit);
  }, [fetchGroupCustomers, pagination]);

  const fetchGroupCustomers = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const result = await groupCustomerService.getAllGroupCustomers(page, limit);
      
      if (result.success) {
        // API mengembalikan data dalam format: {success: true, data: {data: [...], pagination: {...}}}
        setGroupCustomers(result.data.data || []);
        const paginationData = result.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1
        };
        setPagination({
          currentPage: paginationData.page,
          totalPages: paginationData.totalPages,
          totalItems: paginationData.total,
          itemsPerPage: paginationData.limit,
          // Backward compatibility
          page: paginationData.page,
          total: paginationData.total,
          limit: paginationData.limit
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch group customers');
      }
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message.includes('401')) {
        handleAuthError();
        return;
      }
      
      let errorMessage = 'Gagal memuat data group customers';
      if (err.message.includes('404')) {
        errorMessage = 'Data group customers tidak ditemukan';
      } else if (err.message.includes('500')) {
        errorMessage = 'Terjadi kesalahan server. Silakan coba lagi.';
      } else if (err.message.includes('Network')) {
        errorMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toastService.error(errorMessage);
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
      setError(null);
      const result = await groupCustomerService.searchGroupCustomers(query, page, limit);
      
      if (result.success) {
        // API mengembalikan data dalam format: {success: true, data: {data: [...], pagination: {...}}}
        setGroupCustomers(result.data.data || []);
        const paginationData = result.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1
        };
        setPagination({
          currentPage: paginationData.page,
          totalPages: paginationData.totalPages,
          totalItems: paginationData.total,
          itemsPerPage: paginationData.limit,
          // Backward compatibility
          page: paginationData.page,
          total: paginationData.total,
          limit: paginationData.limit
        });
      } else {
        throw new Error(result.error?.message || 'Failed to search group customers');
      }
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message.includes('401')) {
        handleAuthError();
        return;
      }
      
      let errorMessage = 'Gagal mencari group customers';
      if (err.message.includes('404')) {
        errorMessage = 'Tidak ada hasil pencarian yang ditemukan';
      } else if (err.message.includes('500')) {
        errorMessage = 'Terjadi kesalahan server saat mencari. Silakan coba lagi.';
      } else if (err.message.includes('Network')) {
        errorMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toastService.error(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  }, [fetchGroupCustomers, handleAuthError]);

  const deleteGroupCustomerFunction = async (id) => {
    try {
      const result = await groupCustomerService.deleteGroupCustomer(id);
      if (result.success) {
        setGroupCustomers(groupCustomers.filter((gc) => gc.id !== id));
        toastService.success('Group customer berhasil dihapus');
        // Refresh data after deletion
        refreshData();
      }
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message.includes('401')) {
        handleAuthError();
        return;
      }
      
      let errorMessage = 'Gagal menghapus group customer';
      if (err.message.includes('404')) {
        errorMessage = 'Group customer tidak ditemukan';
      } else if (err.message.includes('409')) {
        errorMessage = 'Group customer tidak dapat dihapus karena masih digunakan';
      } else if (err.message.includes('500')) {
        errorMessage = 'Terjadi kesalahan server. Silakan coba lagi.';
      } else if (err.message.includes('Network')) {
        errorMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toastService.error(errorMessage);
    }
  };

  const deleteGroupCustomerConfirmation = useDeleteConfirmation(
    deleteGroupCustomerFunction,
    'Apakah Anda yakin ingin menghapus group customer ini?',
    'Hapus Group Customer'
  );

  const deleteGroupCustomer = deleteGroupCustomerConfirmation.showDeleteConfirmation;

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
      searchGroupCustomers(searchQuery, newPage, pagination.itemsPerPage || pagination.limit);
    } else {
      fetchGroupCustomers(newPage, pagination.itemsPerPage || pagination.limit);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      itemsPerPage: newLimit,
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
    fetchGroupCustomers(1, pagination.itemsPerPage || pagination.limit);

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
    deleteGroupCustomerConfirmation,
    fetchGroupCustomers,
    handleAuthError,
    refreshData,
    clearSearch
  };
};

export default useGroupCustomersPage;

