import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { getInventories, searchInventories, deleteInventory } from '../services/inventoryService';

const useInventoriesPage = () => {
  const [inventories, setInventories] = useState([]);
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

  const fetchInventories = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const data = await getInventories(page, limit);
      setInventories(data.data);
      setPagination(data.pagination);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error('Failed to load inventories');
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchInventoriesCallback = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchInventories(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      const data = await searchInventories(query, page, limit);
      setInventories(data.data);
      setPagination(data.pagination);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleAuthError();
      } else {
        toastService.error('Failed to search inventories');
      }
    } finally {
      setSearchLoading(false);
    }
  }, [fetchInventories, handleAuthError]);

  const handleDeleteInventory = async (id) => {
    try {
      await deleteInventory(id);
      toastService.success('Inventory item deleted successfully');
      
      // Determine the page to fetch after deletion
      const newPage = (inventories.length === 1 && pagination.currentPage > 1)
        ? pagination.currentPage - 1
        : pagination.currentPage;

      // Refresh the list based on whether a search is active
      if (searchQuery.trim()) {
        searchInventoriesCallback(searchQuery, newPage, pagination.itemsPerPage);
      } else {
        fetchInventories(newPage, pagination.itemsPerPage);
      }
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to delete inventory item');
      }
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchInventoriesCallback(query, 1, pagination.itemsPerPage);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchInventoriesCallback(searchQuery, newPage, pagination.itemsPerPage);
    } else {
      fetchInventories(newPage, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    if (searchQuery.trim()) {
      searchInventoriesCallback(searchQuery, 1, newLimit);
    } else {
      fetchInventories(1, newLimit);
    }
  };

  useEffect(() => {
    fetchInventories(1, pagination.itemsPerPage);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    inventories,
    setInventories,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteInventory: handleDeleteInventory,
    fetchInventories,
    handleAuthError
  };
};

export default useInventoriesPage;

