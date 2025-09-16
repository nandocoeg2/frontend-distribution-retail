import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { regionService } from '../services/regionService';

const useRegionsPage = () => {
  const [regions, setRegions] = useState([]);
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

  const fetchRegions = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const result = await regionService.getAllRegions(page, limit);
      setRegions(result.data);
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
      toastService.error('Failed to load regions');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchRegions = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchRegions(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      const result = await regionService.searchRegions(query, page, limit);
      setRegions(result.data);
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
      toastService.error('Failed to search regions');
    } finally {
      setSearchLoading(false);
    }
  }, [fetchRegions, handleAuthError]);

  const deleteRegion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this region?'))
      return;

    try {
      await regionService.deleteRegion(id);
      setRegions(regions.filter((region) => region.id !== id));
      toastService.success('Region deleted successfully');
      fetchRegions(pagination.page, pagination.limit); // Refetch to update pagination
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Failed to delete region');
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchRegions(query, 1, pagination.limit);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchRegions(searchQuery, newPage, pagination.limit);
    } else {
      fetchRegions(newPage, pagination.limit);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      limit: newLimit
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchRegions(searchQuery, 1, newLimit);
    } else {
      fetchRegions(1, newLimit);
    }
  };

  useEffect(() => {
    fetchRegions(1, pagination.limit);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchRegions]);

  return {
    regions,
    setRegions,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteRegion,
    fetchRegions,
    handleAuthError
  };
};

export default useRegionsPage;

