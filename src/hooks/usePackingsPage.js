import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getPackings,
  getPackingById,
  searchPackings,
  searchPackingsAdvanced,
  deletePacking,
  processPackings
} from '../services/packingService';
import toastService from '../services/toastService';
import usePaginatedSearch from './usePaginatedSearch';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0
};

const parsePackingsResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Gagal memuat data packing');
  }

  const rawData = response?.data?.data || response?.data || [];
  const paginationData = response?.data?.pagination || response?.pagination || {};
  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;

  const results = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

  return {
    results,
    pagination: {
      currentPage,
      page: currentPage,
      totalPages: paginationData.totalPages || INITIAL_PAGINATION.totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage
    }
  };
};

const resolvePackingsError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Terjadi kesalahan saat memuat packing';
};

const usePackingsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('packing_number');
  const [searchFilters, setSearchFilters] = useState({});
  const [viewingPacking, setViewingPacking] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPackings, setSelectedPackings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const searchFieldRef = useRef('packing_number');

  const {
    input: currentSearchValue,
    setInput: setSearchInput,
    searchResults: packings,
    setSearchResults: setPackings,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    performSearch,
    debouncedSearch,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    resolveLimit
  } = usePaginatedSearch({
    initialPagination: INITIAL_PAGINATION,
    searchFn: (value, page, limit) => {
      const effectiveLimit =
        typeof limit === 'number' ? limit : INITIAL_PAGINATION.itemsPerPage;

      if (value && typeof value === 'object' && value.type === 'filters') {
        return searchPackingsAdvanced(value.filters || {}, page, effectiveLimit);
      }

      const trimmedQuery = typeof value === 'string' ? value.trim() : '';
      const field = searchFieldRef.current || 'packing_number';

      if (!trimmedQuery) {
        return getPackings(page, effectiveLimit);
      }

      return searchPackings(trimmedQuery, field, page, effectiveLimit);
    },
    parseResponse: parsePackingsResponse,
    resolveErrorMessage: resolvePackingsError
  });

  const searchLoading = useMemo(() => {
    const hasFilters = Object.keys(searchFilters || {}).length > 0;
    return loading && (Boolean(searchQuery.trim()) || hasFilters || typeof currentSearchValue === 'object');
  }, [currentSearchValue, loading, searchFilters, searchQuery]);

  const fetchPackings = useCallback((page = 1) => {
    setSearchFilters({});
    setSearchInput('');
    return performSearch('', page, resolveLimit());
  }, [performSearch, resolveLimit, setSearchInput]);

  const searchPackingsData = useCallback((query, field = searchFieldRef.current, page = 1) => {
    searchFieldRef.current = field;
    setSearchField(field);
    setSearchFilters({});
    setSearchQuery(query);
    setSearchInput(query);
    return performSearch(query, page, resolveLimit());
  }, [performSearch, resolveLimit, setSearchInput]);

  const searchPackingsWithFilters = useCallback((filters, page = 1) => {
    setSearchFilters(filters);
    setSearchQuery('');
    const payload = { type: 'filters', filters };
    setSearchInput(payload);
    return performSearch(payload, page, resolveLimit());
  }, [performSearch, resolveLimit, setSearchInput]);

  const clearFilters = useCallback(() => {
    setSearchFilters({});
    setSearchQuery('');
    setSelectedPackings([]);
    setSearchInput('');
    performSearch('', 1, resolveLimit());
  }, [performSearch, resolveLimit, setSearchInput]);

  useEffect(() => {
    fetchPackings(1);
  }, [fetchPackings]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    setSearchFilters({});
    setSearchInput(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchInput]);

  const handleSearchFieldChange = useCallback((field) => {
    searchFieldRef.current = field;
    setSearchField(field);
    if (searchQuery.trim()) {
      performSearch(searchQuery, 1, resolveLimit());
    }
  }, [performSearch, resolveLimit, searchQuery]);

  const handlePageChange = useCallback((page) => {
    handlePageChangeInternal(page);
  }, [handlePageChangeInternal]);

  const deletePackingHandler = useCallback(async (id) => {
    try {
      await deletePacking(id);
      toastService.success('Packing berhasil dihapus');

      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || packings.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);

      await performSearch(currentSearchValue, nextPage, itemsPerPage);
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || 'Gagal menghapus packing';
      setError(message);
      toastService.error(message);
    }
  }, [currentSearchValue, packings.length, pagination, performSearch, resolveLimit, setError]);

  const openViewModal = useCallback(async (id) => {
    try {
      const response = await getPackingById(id);
      const packing = response?.success ? response.data : response;
      setViewingPacking(packing);
      setIsViewModalOpen(true);
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || 'Error fetching packing details.';
      toastService.error(message);
    }
  }, []);

  const closeViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewingPacking(null);
  }, []);

  const refreshPackings = useCallback(() => {
    const currentPage = pagination.currentPage || pagination.page || 1;
    performSearch(currentSearchValue, currentPage, resolveLimit());
  }, [currentSearchValue, pagination, performSearch, resolveLimit]);

  const handleFilterChange = useCallback((filters) => {
    setSearchFilters(filters);
    searchPackingsWithFilters(filters, 1);
  }, [searchPackingsWithFilters]);

  const handleSelectPacking = useCallback((packingId) => {
    setSelectedPackings(prev => {
      if (prev.includes(packingId)) {
        return prev.filter(id => id !== packingId);
      }
      return [...prev, packingId];
    });
  }, []);

  const handleSelectAllPackings = useCallback(() => {
    if (selectedPackings.length === packings.length) {
      setSelectedPackings([]);
    } else {
      setSelectedPackings(packings.map(packing => packing.id));
    }
  }, [packings, selectedPackings.length]);

  const handleProcessPackings = useCallback(async () => {
    if (selectedPackings.length === 0) {
      toastService.error('Pilih minimal satu packing untuk diproses');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await processPackings(selectedPackings);
      if (response?.success) {
        const { processedCount, processedPackingItemsCount } = response.data;
        toastService.success(`Berhasil memproses ${processedCount} packing dengan ${processedPackingItemsCount} item`);
        setSelectedPackings([]);
        refreshPackings();
      } else {
        toastService.error(response?.error?.message || 'Gagal memproses packing');
      }
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || 'Gagal memproses packing';
      toastService.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [processPackings, refreshPackings, selectedPackings]);

  const deletePackingConfirmation = useDeleteConfirmation(
    deletePackingHandler,
    'Apakah Anda yakin ingin menghapus packing ini?',
    'Hapus Packing'
  );

  return {
    packings,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    searchQuery,
    searchField,
    searchFilters,
    searchLoading,
    viewingPacking,
    isViewModalOpen,
    selectedPackings,
    setSelectedPackings,
    isProcessing,
    hasSelectedPackings: selectedPackings.length > 0,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange: handleLimitChangeInternal,
    fetchPackings,
    searchPackingsData,
    searchPackingsWithFilters,
    clearFilters,
    openViewModal,
    closeViewModal,
    refreshPackings,
    deletePacking: deletePackingConfirmation.showDeleteConfirmation,
    deletePackingConfirmation,
    handleFilterChange,
    handleSelectPacking,
    handleSelectAllPackings,
    handleProcessPackings
  };
};

export default usePackingsPage;
