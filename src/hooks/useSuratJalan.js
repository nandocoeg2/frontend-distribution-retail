import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import suratJalanService from '../services/suratJalanService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const useSuratJalan = () => {
  const [suratJalan, setSuratJalan] = useState([]);
  const [selectedSuratJalan, setSelectedSuratJalan] = useState(null);
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
  const [isSearching, setIsSearching] = useState(false);
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
      setIsSearching(false);
      
      const result = await suratJalanService.getAllSuratJalan(page, limit);
      
      if (result.success) {
        setSuratJalan(result.data.suratJalan);
        setPagination(result.data.pagination);
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
      setIsSearching(true);
      
      const searchParams = {};
      searchParams[field] = query;
      const result = await suratJalanService.searchSuratJalan(searchParams, page, limit);
      
      if (result.success) {
        setSuratJalan(result.data.suratJalan);
        setPagination(result.data.pagination);
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

  const getSuratJalanById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await suratJalanService.getSuratJalanById(id);
      
      if (result.success) {
        setSelectedSuratJalan(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      if (err.response?.status === 404) {
        toastService.error('Surat jalan tidak ditemukan');
      } else {
        toastService.error('Gagal memuat data surat jalan');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const createSuratJalan = useCallback(async (suratJalanData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await suratJalanService.createSuratJalan(suratJalanData);
      
      if (result.success) {
        toastService.success('Surat jalan berhasil dibuat');
        // Refresh the list
        fetchSuratJalan(pagination.page, pagination.limit);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to create surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      if (err.response?.status === 400) {
        const errorMessage = err.response.data?.message || 'Validation error';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else if (err.response?.status === 409) {
        toastService.error('Nomor surat jalan sudah ada');
      } else if (err.response?.status === 422) {
        toastService.error('Invoice ID tidak valid');
      } else {
        toastService.error('Gagal membuat surat jalan');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, fetchSuratJalan, pagination.page, pagination.limit]);

  const updateSuratJalan = useCallback(async (id, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await suratJalanService.updateSuratJalan(id, updateData);
      
      if (result.success) {
        toastService.success('Surat jalan berhasil diperbarui');
        // Update the list
        setSuratJalan(prev => 
          prev.map(item => item.id === id ? result.data : item)
        );
        // Update selected surat jalan if it's the same one
        if (selectedSuratJalan && selectedSuratJalan.id === id) {
          setSelectedSuratJalan(result.data);
        }
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to update surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      if (err.response?.status === 400) {
        const errorMessage = err.response.data?.message || 'Validation error';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else if (err.response?.status === 404) {
        toastService.error('Surat jalan tidak ditemukan');
      } else if (err.response?.status === 409) {
        toastService.error('Nomor surat jalan sudah ada');
      } else {
        toastService.error('Gagal memperbarui surat jalan');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, selectedSuratJalan]);

  const deleteSuratJalanFunction = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await suratJalanService.deleteSuratJalan(id);
      
      if (result.success) {
        toastService.success('Surat jalan berhasil dihapus');
        // Remove from list
        setSuratJalan(prev => prev.filter(item => item.id !== id));
        // Clear selected if it's the deleted one
        if (selectedSuratJalan && selectedSuratJalan.id === id) {
          setSelectedSuratJalan(null);
        }
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return false;
      }
      
      if (err.response?.status === 404) {
        toastService.error('Surat jalan tidak ditemukan');
      } else if (err.response?.status === 409) {
        toastService.error('Surat jalan tidak dapat dihapus karena sudah dalam status SHIPPED atau DELIVERED');
      } else {
        toastService.error('Gagal menghapus surat jalan');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, selectedSuratJalan]);

  const deleteSuratJalanConfirmation = useDeleteConfirmation(
    deleteSuratJalanFunction,
    'Apakah Anda yakin ingin menghapus surat jalan ini?',
    'Hapus Surat Jalan'
  );

  const deleteSuratJalan = deleteSuratJalanConfirmation.showDeleteConfirmation;

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchSuratJalan(query, searchField, 1, pagination.limit);
    }, 500);

    setDebounceTimeout(timeout);
  }, [searchField, pagination.limit, searchSuratJalan, debounceTimeout]);

  const handleSearchFieldChange = useCallback((field) => {
    setSearchField(field);
    setSearchQuery('');

    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, field, 1, pagination.limit);
    } else {
      fetchSuratJalan(1, pagination.limit);
    }
  }, [searchQuery, pagination.limit, searchSuratJalan, fetchSuratJalan]);

  const handlePageChange = useCallback((newPage) => {
    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, searchField, newPage, pagination.limit);
    } else {
      fetchSuratJalan(newPage, pagination.limit);
    }
  }, [searchQuery, searchField, pagination.limit, searchSuratJalan, fetchSuratJalan]);

  const handleLimitChange = useCallback((newLimit) => {
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
  }, [searchQuery, searchField, pagination, searchSuratJalan, fetchSuratJalan]);

  const refreshData = useCallback(() => {
    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, searchField, pagination.page, pagination.limit);
    } else {
      fetchSuratJalan(pagination.page, pagination.limit);
    }
  }, [searchQuery, searchField, pagination.page, pagination.limit, searchSuratJalan, fetchSuratJalan]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchField('no_surat_jalan');
    setIsSearching(false);
    fetchSuratJalan(1, pagination.limit);
  }, [fetchSuratJalan, pagination.limit]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSelectedSuratJalan = useCallback(() => {
    setSelectedSuratJalan(null);
  }, []);

  useEffect(() => {
    fetchSuratJalan(1, pagination.limit);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchSuratJalan, pagination.limit, debounceTimeout]);

  return {
    // Data
    suratJalan,
    setSuratJalan,
    selectedSuratJalan,
    setSelectedSuratJalan,
    pagination,
    setPagination,
    
    // States
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    isSearching,
    
    // Actions
    fetchSuratJalan,
    searchSuratJalan,
    getSuratJalanById,
    createSuratJalan,
    updateSuratJalan,
    deleteSuratJalan,
    deleteSuratJalanConfirmation,
    
    // Handlers
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange,
    refreshData,
    clearSearch,
    clearError,
    clearSelectedSuratJalan,
    
    // Auth
    handleAuthError
  };
};

export default useSuratJalan;
