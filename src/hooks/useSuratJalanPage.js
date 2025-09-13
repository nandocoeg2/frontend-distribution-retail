import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import suratJalanService from '../services/suratJalanService';

const useSuratJalan = () => {
  const [suratJalan, setSuratJalan] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
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
      const result = await suratJalanService.getAllSuratJalan(page, limit);
      setSuratJalan(result.data);
      setPagination(result.pagination);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error('Failed to load surat jalan');
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
      const searchParams = {};
      searchParams[field] = query;
      const result = await suratJalanService.searchSuratJalan(searchParams, page, limit);
      setSuratJalan(result.data);
      setPagination(result.pagination);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to search surat jalan');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchSuratJalan, handleAuthError]);

  const deleteSuratJalan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this surat jalan?'))
      return;

    try {
      await suratJalanService.deleteSuratJalan(id);
      setSuratJalan(suratJalan.filter((item) => item.id !== id));
      toastService.success('Surat jalan deleted successfully');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      toastService.error('Failed to delete surat jalan');
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchSuratJalan(query, searchField, 1, pagination.itemsPerPage); // Reset to first page when searching
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handleSearchFieldChange = (field) => {
    setSearchField(field);
    setSearchQuery('');

    // If there's a current search, perform it with the new field
    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, field, 1, pagination.itemsPerPage);
    } else {
      fetchSuratJalan(1, pagination.itemsPerPage);
    }
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, searchField, newPage, pagination.itemsPerPage);
    } else {
      fetchSuratJalan(newPage, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      itemsPerPage: newLimit
    };
    setPagination(newPagination);

    if (searchQuery.trim()) {
      searchSuratJalan(searchQuery, searchField, 1, newLimit); // Reset to first page when changing limit
    } else {
      fetchSuratJalan(1, newLimit); // Reset to first page when changing limit
    }
  };

  useEffect(() => {
    fetchSuratJalan(1, pagination.itemsPerPage); // Start on first page

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
    fetchSuratJalan,
    handleAuthError
  };
};

export default useSuratJalan;
