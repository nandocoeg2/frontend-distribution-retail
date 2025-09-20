import { useState, useEffect, useCallback } from 'react';
import { 
  getPackings, 
  searchPackingsByStatus, 
  getPackingById, 
  searchPackings,
  searchPackingsAdvanced,
  deletePacking,
  processPackings
} from '../services/packingService';
import toastService from '../services/toastService';

const usePackingsPage = () => {
  const [packings, setPackingsData] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('packing_number');
  const [searchLoading, setSearchLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [viewingPacking, setViewingPacking] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [searchFilters, setSearchFilters] = useState({});
  const [selectedPackings, setSelectedPackings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper function to safely set packings data
  const setPackingsDataData = (data) => {
    if (Array.isArray(data)) {
      setPackingsData(data);
    } else {
      console.warn('setPackingsDataData received non-array data:', data);
      setPackingsData([]);
    }
  };

  const fetchPackings = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPackings(page);
      console.log('API Response:', response); // Debug log
      
      if (response && response.success && response.data) {
        // Handle API response structure: { success: true, data: { data: [...], pagination: {...} } }
        const packingsData = Array.isArray(response.data.data) ? response.data.data : [];
        const paginationData = response.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 };
        
        setPackingsData(packingsData);
        setPagination(paginationData);
      } else if (response && Array.isArray(response.data)) {
        // Handle direct array response
        setPackingsData(response.data);
        setPagination(response.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
      } else {
        setPackingsData([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toastService.error(errorMessage);
      setPackingsData([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
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
      console.log('Search API Response:', response); // Debug log
      
      if (response && response.success && response.data) {
        // Handle API response structure: { success: true, data: { data: [...], pagination: {...} } }
        const packingsData = Array.isArray(response.data.data) ? response.data.data : [];
        const paginationData = response.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 };
        
        setPackingsData(packingsData);
        setPagination(paginationData);
      } else if (response && Array.isArray(response.data)) {
        // Handle direct array response
        setPackingsData(response.data);
        setPagination(response.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
      } else {
        setPackingsData([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to search packings';
      toastService.error(errorMessage);
      setPackingsData([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
    } finally {
      setSearchLoading(false);
    }
  }, [fetchPackings]);

  const searchPackingsWithFilters = useCallback(async (filters, page = 1) => {
    try {
      setSearchLoading(true);
      const response = await searchPackingsAdvanced(filters, page);
      console.log('Advanced Search API Response:', response); // Debug log
      
      if (response && response.success && response.data) {
        // Handle API response structure: { success: true, data: { data: [...], pagination: {...} } }
        const packingsData = Array.isArray(response.data.data) ? response.data.data : [];
        const paginationData = response.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 };
        
        setPackingsData(packingsData);
        setPagination(paginationData);
      } else if (response && Array.isArray(response.data)) {
        // Handle direct array response
        setPackingsData(response.data);
        setPagination(response.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
      } else {
        setPackingsData([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to search packings with filters';
      toastService.error(errorMessage);
      setPackingsData([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
    } finally {
      setSearchLoading(false);
    }
  }, []);

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
      const response = await getPackingById(id);
      
      // Handle API response structure: { success: true, data: {...} }
      const packing = response?.success ? response.data : response;
      
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

  const handleDeletePacking = async (id) => {
    setIsDeleting(true);
    try {
      await deletePacking(id);
      toastService.success('Packing berhasil dihapus');
      refreshPackings();
    } catch (err) {
      const errorMessage = err.message || 'Gagal menghapus packing';
      toastService.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleFilterChange = (filters) => {
    setSearchFilters(filters);
    searchPackingsWithFilters(filters, 1);
  };

  const clearFilters = () => {
    setSearchFilters({});
    setSearchQuery('');
    setSelectedPackings([]);
    fetchPackings(1);
  };

  // Handle packing selection
  const handleSelectPacking = (packingId) => {
    setSelectedPackings(prev => {
      if (prev.includes(packingId)) {
        return prev.filter(id => id !== packingId);
      } else {
        return [...prev, packingId];
      }
    });
  };

  const handleSelectAllPackings = () => {
    if (selectedPackings.length === packings.length) {
      setSelectedPackings([]);
    } else {
      setSelectedPackings(packings.map(packing => packing.id));
    }
  };

  // Handle process packing
  const handleProcessPackings = async () => {
    if (selectedPackings.length === 0) {
      toastService.error('Pilih minimal satu packing untuk diproses');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await processPackings(selectedPackings);
      
      if (response && response.success) {
        const { processedCount, processedPackingItemsCount } = response.data;
        toastService.success(
          `Berhasil memproses ${processedCount} packing dengan ${processedPackingItemsCount} item`
        );
        setSelectedPackings([]);
        refreshPackings();
      } else {
        toastService.error(response?.error?.message || 'Gagal memproses packing');
      }
    } catch (err) {
      const errorMessage = err.message || 'Gagal memproses packing';
      toastService.error(errorMessage);
    } finally {
      setIsProcessing(false);
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
    isDeleting,
    deleteConfirmId,
    searchFilters,
    selectedPackings,
    isProcessing,
    hasSelectedPackings: selectedPackings.length > 0,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    openViewModal,
    closeViewModal,
    refreshPackings,
    handleDeletePacking,
    confirmDelete,
    cancelDelete,
    handleFilterChange,
    clearFilters,
    searchPackingsWithFilters,
    handleSelectPacking,
    handleSelectAllPackings,
    handleProcessPackings
  };
};

export default usePackingsPage;

