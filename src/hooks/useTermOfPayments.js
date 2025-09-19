import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { termOfPaymentService } from '../services/termOfPaymentService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const useTermOfPayments = () => {
  const [termOfPayments, setTermOfPayments] = useState([]);
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

  const fetchTermOfPayments = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const result = await termOfPaymentService.getAllTermOfPayments(page, limit);
      
      if (result.success) {
        setTermOfPayments(result.data.data || []);
        setPagination({
          page: result.data.pagination?.currentPage || 1,
          totalPages: result.data.pagination?.totalPages || 1,
          total: result.data.pagination?.totalItems || 0,
          limit: result.data.pagination?.itemsPerPage || 10
        });
      } else {
        throw new Error(result.message || 'Failed to fetch term of payments');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error('Gagal memuat data term of payments');
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
      setError(null);
      const result = await termOfPaymentService.searchTermOfPayments(query, page, limit);
      
      if (result.success) {
        setTermOfPayments(result.data.data || []);
        setPagination({
          page: result.data.pagination?.currentPage || 1,
          totalPages: result.data.pagination?.totalPages || 1,
          total: result.data.pagination?.totalItems || 0,
          limit: result.data.pagination?.itemsPerPage || 10
        });
      } else {
        throw new Error(result.message || 'Failed to search term of payments');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Gagal mencari data term of payments');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchTermOfPayments, handleAuthError]);

  const createTermOfPayment = async (termOfPaymentData) => {
    try {
      setLoading(true);
      const result = await termOfPaymentService.createTermOfPayment(termOfPaymentData);
      
      if (result.success) {
        toastService.success('Term of payment berhasil dibuat');
        // Refresh data setelah create
        fetchTermOfPayments(pagination.page, pagination.limit);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to create term of payment');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Gagal membuat term of payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTermOfPayment = async (id, termOfPaymentData) => {
    try {
      setLoading(true);
      const result = await termOfPaymentService.updateTermOfPayment(id, termOfPaymentData);
      
      if (result.success) {
        toastService.success('Term of payment berhasil diperbarui');
        // Refresh data setelah update
        fetchTermOfPayments(pagination.page, pagination.limit);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to update term of payment');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Gagal memperbarui term of payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTermOfPaymentById = async (id) => {
    try {
      setLoading(true);
      const result = await termOfPaymentService.getTermOfPaymentById(id);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch term of payment');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Gagal mengambil data term of payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTermOfPaymentFunction = async (id) => {
    try {
      const result = await termOfPaymentService.deleteTermOfPayment(id);
      
      if (result === true || result.success) {
        setTermOfPayments(termOfPayments.filter((top) => top.id !== id));
        toastService.success('Term of payment berhasil dihapus');
        // Refresh data setelah delete
        fetchTermOfPayments(pagination.page, pagination.limit);
      } else {
        throw new Error(result.message || 'Failed to delete term of payment');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      console.log(err);
      toastService.error('Gagal menghapus term of payment');
    }
  };

  const deleteTermOfPaymentConfirmation = useDeleteConfirmation(
    deleteTermOfPaymentFunction,
    'Apakah Anda yakin ingin menghapus term of payment ini?',
    'Hapus Term of Payment'
  );

  const deleteTermOfPayment = deleteTermOfPaymentConfirmation.showDeleteConfirmation;

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchTermOfPayments(query, 1, pagination.limit);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchTermOfPayments(searchQuery, newPage, pagination.limit);
    } else {
      fetchTermOfPayments(newPage, pagination.limit);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      limit: newLimit
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchTermOfPayments(searchQuery, 1, newLimit);
    } else {
      fetchTermOfPayments(1, newLimit);
    }
  };

  useEffect(() => {
    fetchTermOfPayments(1, pagination.limit);

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
    createTermOfPayment,
    updateTermOfPayment,
    getTermOfPaymentById,
    deleteTermOfPayment,
    deleteTermOfPaymentConfirmation,
    fetchTermOfPayments,
    searchTermOfPayments,
    handleAuthError
  };
};

export default useTermOfPayments;
