import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import suratJalanService from '../services/suratJalanService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const useSuratJalanPage = () => {
  const [suratJalan, setSuratJalan] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('no_surat_jalan');
  const [searchLoading, setSearchLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchSuratJalan = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const result = await suratJalanService.getAllSuratJalan(page, limit);
      
      if (result.success) {
        // API response structure: { success: true, data: { data: [...], pagination: {...} } }
        setSuratJalan(result.data.data || result.data.suratJalan || []);
        
        // Map pagination structure from API to expected format
        const apiPagination = result.data.pagination || {};
        setPagination({
          page: apiPagination.currentPage || apiPagination.page || 1,
          limit: apiPagination.itemsPerPage || apiPagination.limit || 10,
          total: apiPagination.totalItems || apiPagination.total || 0,
          totalPages: apiPagination.totalPages || 1
        });
      } else {
        throw new Error(result.message || 'Failed to fetch surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error('Gagal memuat data surat jalan');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchSuratJalan = useCallback(async (query, field, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchSuratJalan(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      const searchParams = {};
      searchParams[field] = query;
      const result = await suratJalanService.searchSuratJalan(searchParams, page, limit);
      
      if (result.success) {
        // API response structure: { success: true, data: { data: [...], pagination: {...} } }
        setSuratJalan(result.data.data || result.data.suratJalan || []);
        
        // Map pagination structure from API to expected format
        const apiPagination = result.data.pagination || {};
        setPagination({
          page: apiPagination.currentPage || apiPagination.page || 1,
          limit: apiPagination.itemsPerPage || apiPagination.limit || 10,
          total: apiPagination.totalItems || apiPagination.total || 0,
          totalPages: apiPagination.totalPages || 1
        });
      } else {
        throw new Error(result.message || 'Failed to search surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Gagal mencari surat jalan');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchSuratJalan, handleAuthError]);

  const deleteSuratJalanFunction = async (id) => {
    try {
      const result = await suratJalanService.deleteSuratJalan(id);
      if (result.success) {
        setSuratJalan(suratJalan.filter((item) => item.id !== id));
        toastService.success('Surat jalan berhasil dihapus');
      } else {
        throw new Error(result.message || 'Failed to delete surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Gagal menghapus surat jalan');
    }
  };

  const deleteSuratJalanConfirmation = useDeleteConfirmation(
    deleteSuratJalanFunction,
    'Apakah Anda yakin ingin menghapus surat jalan ini?',
    'Hapus Surat Jalan'
  );

  const deleteSuratJalan = deleteSuratJalanConfirmation.showDeleteConfirmation;

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchSuratJalan(query, searchField, 1, pagination.limit);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handleSearchFieldChange = (field) => {
    setSearchField(field);
    setSearchQuery('');

    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, field, 1, pagination.limit);
    } else {
      fetchSuratJalan(1, pagination.limit);
    }
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, searchField, newPage, pagination.limit);
    } else {
      fetchSuratJalan(newPage, pagination.limit);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      limit: newLimit
    };
    setPagination(newPagination);

    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, searchField, 1, newLimit);
    } else {
      fetchSuratJalan(1, newLimit);
    }
  };

  const refreshData = useCallback(() => {
    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, searchField, pagination.page, pagination.limit);
    } else {
      fetchSuratJalan(pagination.page, pagination.limit);
    }
  }, [searchQuery, searchField, pagination.page, pagination.limit, searchSuratJalan, fetchSuratJalan]);

  useEffect(() => {
    fetchSuratJalan(1, pagination.limit);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchSuratJalan]);

  return {
    suratJalan,
    setSuratJalan,
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
    deleteSuratJalan,
    deleteSuratJalanConfirmation,
    fetchSuratJalan,
    refreshData,
    handleAuthError
  };
};

export default useSuratJalanPage;
