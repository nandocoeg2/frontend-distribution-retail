import { useState, useEffect, useCallback } from 'react';
import { getPackings, searchPackingsByStatus, getPackingById, searchPackings } from '../services/packingService';
import toastService from '../services/toastService';

const usePackingsPage = () => {
  const [packings, setPackings] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('packing_number');
  const [searchLoading, setSearchLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [viewingPacking, setViewingPacking] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchPackings = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPackings(page);
      if (response && response.data) {
        setPackings(response.data);
        setPagination(response.pagination);
      } else {
        setPackings([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toastService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPackingsData = useCallback(async (query, field, page = 1) => {
    if (!query.trim()) {
      fetchPackings(page);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await searchPackings(query, field, page);
      if (response && response.data) {
        setPackings(response.data);
        setPagination(response.pagination);
      } else {
        setPackings([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to search packings';
      toastService.error(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  }, [fetchPackings]);

  useEffect(() => {
    fetchPackings(1);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchPackings]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchPackingsData(query, searchField, 1); // Reset to first page when searching
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handleSearchFieldChange = (field) => {
    setSearchField(field);
    if (searchQuery.trim()) {
      searchPackingsData(searchQuery, field, 1);
    }
  };

  const handlePageChange = (page) => {
    if (searchQuery.trim()) {
      searchPackingsData(searchQuery, searchField, page);
    } else {
      fetchPackings(page);
    }
  };

  const openViewModal = async (id) => {
    try {
      const packing = await getPackingById(id);
      setViewingPacking(packing);
      setIsViewModalOpen(true);
    } catch (err) {
      const errorMessage = err.message || 'Error fetching packing details.';
      toastService.error(errorMessage);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingPacking(null);
  };

  const refreshPackings = () => {
    if (searchQuery.trim()) {
      searchPackingsData(searchQuery, searchField, pagination.currentPage);
    } else {
      fetchPackings(pagination.currentPage);
    }
  };

  return {
    packings,
    pagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    viewingPacking,
    isViewModalOpen,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    openViewModal,
    closeViewModal,
    refreshPackings,
  };
};

export default usePackingsPage;

