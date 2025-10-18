import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import suratJalanService from '../services/suratJalanService';
import usePaginatedSearch from './usePaginatedSearch';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const DEFAULT_FILTERS = {
  no_surat_jalan: '',
  deliver_to: '',
  PIC: '',
  invoiceId: '',
  purchaseOrderId: '',
  status_code: '',
  checklistSuratJalanId: '',
  is_printed: '',
};

const sanitizeFilters = (filters = {}) => {
  const sanitized = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        sanitized[key] = trimmed;
      }
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
};

const parseSuratJalanResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.message || 'Failed to fetch surat jalan');
  }

  const rawData =
    response?.data?.data || response?.data?.suratJalan || response?.data || [];
  const paginationData = response?.data?.pagination || {};
  const currentPage =
    paginationData.currentPage ||
    paginationData.page ||
    INITIAL_PAGINATION.currentPage;
  const itemsPerPage =
    paginationData.itemsPerPage ||
    paginationData.limit ||
    INITIAL_PAGINATION.itemsPerPage;
  const totalItems =
    paginationData.totalItems ||
    paginationData.total ||
    INITIAL_PAGINATION.totalItems;

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
      limit: itemsPerPage,
    },
  };
};

const resolveSuratJalanError = (error) => {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    'Gagal memuat data surat jalan'
  );
};

const useSuratJalanPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const filtersRef = useRef(DEFAULT_FILTERS);
  const activeFiltersRef = useRef({});
  const [activeFiltersVersion, setActiveFiltersVersion] = useState(0);
  const [selectedSuratJalan, setSelectedSuratJalan] = useState([]);
  const [isProcessingSuratJalan, setIsProcessingSuratJalan] = useState(false);

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input: currentFilters,
    setInput: setSearchInput,
    searchResults: suratJalan,
    setSearchResults: setSuratJalan,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    performSearch,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    handleAuthError: authHandler,
    resolveLimit,
    isSearching,
  } = usePaginatedSearch({
    initialInput: DEFAULT_FILTERS,
    initialPagination: INITIAL_PAGINATION,
    searchFn: (queryFilters = {}, page, limit) => {
      const sanitized = sanitizeFilters(queryFilters);

      if (Object.keys(sanitized).length === 0) {
        return suratJalanService.getAllSuratJalan(page, limit);
      }

      return suratJalanService.searchSuratJalan(sanitized, page, limit);
    },
    parseResponse: parseSuratJalanResponse,
    resolveErrorMessage: resolveSuratJalanError,
    onAuthError: handleAuthRedirect,
  });

  const searchLoading = useMemo(() => {
    return (
      isSearching && Object.keys(activeFiltersRef.current || {}).length > 0
    );
  }, [isSearching, activeFiltersVersion]);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(activeFiltersRef.current || {}).length > 0;
  }, [activeFiltersVersion]);

  const fetchSuratJalan = useCallback(
    (page = 1, limit = resolveLimit()) => {
      const nextFilters = { ...DEFAULT_FILTERS };
      filtersRef.current = nextFilters;
      activeFiltersRef.current = {};
      setActiveFiltersVersion((prev) => prev + 1);
      setFilters(nextFilters);
      setSearchInput(nextFilters);
      return performSearch(nextFilters, page, limit);
    },
    [performSearch, resolveLimit, setSearchInput]
  );

  const handleFiltersChange = useCallback((field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      filtersRef.current = next;
      return next;
    });
  }, []);

  const handleSearchSubmit = useCallback(async () => {
    const effectiveFilters = {
      ...DEFAULT_FILTERS,
      ...(filtersRef.current || {}),
    };
    const sanitized = sanitizeFilters(effectiveFilters);

    activeFiltersRef.current = sanitized;
    setActiveFiltersVersion((prev) => prev + 1);
    setSearchInput(effectiveFilters);

    await performSearch(effectiveFilters, 1, resolveLimit());
  }, [performSearch, resolveLimit, setSearchInput]);

  const handleResetFilters = useCallback(async () => {
    const nextFilters = { ...DEFAULT_FILTERS };
    filtersRef.current = nextFilters;
    activeFiltersRef.current = {};
    setActiveFiltersVersion((prev) => prev + 1);
    setFilters(nextFilters);
    setSearchInput(nextFilters);
    await performSearch(nextFilters, 1, resolveLimit());
  }, [performSearch, resolveLimit, setSearchInput]);

  const deleteSuratJalanFunction = useCallback(
    async (id) => {
      try {
        const result = await suratJalanService.deleteSuratJalan(id);
        if (result?.success === false) {
          throw new Error(result?.message || 'Failed to delete surat jalan');
        }
        toastService.success('Surat jalan berhasil dihapus');

        const itemsPerPage = resolveLimit();
        const currentPage = pagination.currentPage || pagination.page || 1;
        const totalItems =
          pagination.totalItems || pagination.total || suratJalan.length;
        const newTotalItems = Math.max(totalItems - 1, 0);
        const newTotalPages = Math.max(
          Math.ceil(newTotalItems / itemsPerPage),
          1
        );
        const nextPage = Math.min(currentPage, newTotalPages);

        await performSearch(currentFilters, nextPage, itemsPerPage);
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Gagal menghapus surat jalan';
        setError(message);
        toastService.error(message);
      }
    },
    [
      authHandler,
      currentFilters,
      pagination,
      performSearch,
      resolveLimit,
      setError,
      suratJalan.length,
    ]
  );

  const deleteSuratJalanConfirmation = useDeleteConfirmation(
    deleteSuratJalanFunction,
    'Apakah Anda yakin ingin menghapus surat jalan ini?',
    'Hapus Surat Jalan'
  );

  const handleSelectSuratJalan = useCallback((suratJalanId) => {
    setSelectedSuratJalan((prevSelected) => {
      if (prevSelected.includes(suratJalanId)) {
        return prevSelected.filter((id) => id !== suratJalanId);
      }
      return [...prevSelected, suratJalanId];
    });
  }, []);

  const handleSelectAllSuratJalan = useCallback(
    (items = []) => {
      if (!Array.isArray(items) || items.length === 0) {
        setSelectedSuratJalan([]);
        return;
      }

      const ids = items.map((item) => item?.id).filter(Boolean);
      if (ids.length === 0) {
        setSelectedSuratJalan([]);
        return;
      }

      const isAllSelected = ids.every((id) => selectedSuratJalan.includes(id));
      setSelectedSuratJalan(isAllSelected ? [] : ids);
    },
    [selectedSuratJalan]
  );

  useEffect(() => {
    fetchSuratJalan(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchSuratJalan]);

  const refreshData = useCallback(() => {
    const currentPage = pagination.currentPage || pagination.page || 1;
    performSearch(currentFilters, currentPage, resolveLimit());
  }, [currentFilters, pagination, performSearch, resolveLimit]);

  const handleProcessSuratJalan = useCallback(
    async (payload) => {
      let targetIds = [];
      let checklistPayload = null;

      if (Array.isArray(payload)) {
        targetIds = payload;
      } else if (payload && typeof payload === 'object') {
        if (Array.isArray(payload.ids)) {
          targetIds = payload.ids;
        } else {
          targetIds = selectedSuratJalan;
        }

        if (payload.checklist && typeof payload.checklist === 'object') {
          checklistPayload = payload.checklist;
        }
      } else {
        targetIds = selectedSuratJalan;
      }

      const validIds = Array.from(
        new Set((targetIds || []).filter(Boolean))
      );

      if (validIds.length === 0) {
        toastService.error('Pilih minimal satu surat jalan untuk diproses');
        return;
      }

      if (checklistPayload) {
        const requiredChecklistFields = [
          'status_code',
          'tanggal',
          'checker',
          'driver',
          'mobil',
          'kota',
        ];
        const missingFields = requiredChecklistFields.filter((field) => {
          const value = checklistPayload[field];
          if (typeof value === 'string') {
            return value.trim() === '';
          }
          return value === null || value === undefined;
        });

        if (missingFields.length > 0) {
          toastService.error(
            `Checklist belum lengkap: ${missingFields.join(', ')}`
          );
          return;
        }

        if (checklistPayload.tanggal) {
          const dateValue = new Date(checklistPayload.tanggal);

          if (Number.isNaN(dateValue.getTime())) {
            toastService.error('Format tanggal checklist tidak valid');
            return;
          }

          checklistPayload = {
            ...checklistPayload,
            tanggal: dateValue.toISOString(),
          };
        }
      }

      setIsProcessingSuratJalan(true);

      try {
        const requestBody = {
          ids: validIds,
          ...(checklistPayload ? { checklist: checklistPayload } : {}),
        };

        const response =
          await suratJalanService.processSuratJalan(requestBody);

        if (response?.success === false) {
          const errorMessage =
            response?.message ||
            response?.error?.message ||
            'Gagal memproses surat jalan';
          toastService.error(errorMessage);
          return response;
        }

        const successMessage =
          response?.data?.message ||
          `Surat jalan berhasil diproses (${validIds.length})`;
        toastService.success(successMessage);
        setSelectedSuratJalan([]);
        await refreshData();
        return response;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Gagal memproses surat jalan';
        toastService.error(message);
        throw err;
      } finally {
        setIsProcessingSuratJalan(false);
      }
    },
    [authHandler, refreshData, selectedSuratJalan]
  );

  return {
    suratJalan,
    setSuratJalan,
    pagination,
    setPagination,
    loading,
    error,
    filters,
    searchLoading,
    hasActiveFilters,
    selectedSuratJalan,
    setSelectedSuratJalan,
    hasSelectedSuratJalan: selectedSuratJalan.length > 0,
    isProcessingSuratJalan,
    handleFiltersChange,
    handleSearchSubmit,
    handleResetFilters,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    handleSelectSuratJalan,
    handleSelectAllSuratJalan,
    handleProcessSuratJalan,
    deleteSuratJalan: deleteSuratJalanConfirmation.showDeleteConfirmation,
    deleteSuratJalanConfirmation,
    fetchSuratJalan,
    refreshData,
    handleAuthError: authHandler,
  };
};

export default useSuratJalanPage;
