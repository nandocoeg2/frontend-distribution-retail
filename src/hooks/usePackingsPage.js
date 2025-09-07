import { useState, useEffect, useCallback } from 'react';
import { getPackings, searchPackingsByStatus, getPackingById } from '../services/packingService';
import toastService from '../services/toastService';

const usePackingsPage = () => {
  const [packings, setPackings] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingPacking, setViewingPacking] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchPackings = useCallback(async (page = 1, query = '') => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (query) {
        response = await searchPackingsByStatus(query, page);
      } else {
        response = await getPackings(page);
      }
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

  useEffect(() => {
    fetchPackings(1, searchQuery);
  }, [fetchPackings, searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchPackings(1, query);
  };

  const handlePageChange = (page) => {
    fetchPackings(page, searchQuery);
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
    fetchPackings(pagination.currentPage, searchQuery);
  };

  return {
    packings,
    pagination,
    loading,
    error,
    searchQuery,
    viewingPacking,
    isViewModalOpen,
    handleSearch,
    handlePageChange,
    openViewModal,
    closeViewModal,
    refreshPackings,
  };
};

export default usePackingsPage;

