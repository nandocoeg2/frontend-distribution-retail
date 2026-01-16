import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import laporanPenerimaanBarangService from '../services/laporanPenerimaanBarangService';
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
  status_code: '',
  purchaseOrderId: '',
  customerId: '',
  companyId: '', // Changed from supplierId
  termin_bayar: '',
  q: '',
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

const parseReportsResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Failed to fetch laporan penerimaan barang');
  }

  const rawData = response?.data?.data || response?.data || [];
  const paginationData = response?.data?.pagination || {};
  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;
  const totalPages = paginationData.totalPages || INITIAL_PAGINATION.totalPages;

  return {
    results: Array.isArray(rawData) ? rawData : Array.isArray(rawData?.data) ? rawData.data : [],
    pagination: {
      currentPage,
      page: currentPage,
      totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage,
    },
  };
};

const resolveReportsError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to load laporan penerimaan barang';
};

const useLaporanPenerimaanBarangPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const filtersRef = useRef({ ...DEFAULT_FILTERS });
  const activeFiltersRef = useRef({});
  const [activeFiltersVersion, setActiveFiltersVersion] = useState(0);
  const [searchPending, setSearchPending] = useState(false);

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    searchResults: reports,
    setSearchResults: setReports,
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
    searchFn: (criteria, page, limit) => {
      let rawCriteria = criteria;
      if (typeof rawCriteria === 'string') {
        rawCriteria = { q: rawCriteria };
      }

      const sanitized = sanitizeFilters(rawCriteria);
      if (!sanitized || Object.keys(sanitized).length === 0) {
        return laporanPenerimaanBarangService.getAllReports(page, limit);
      }
      return laporanPenerimaanBarangService.searchReports(sanitized, page, limit);
    },
    parseResponse: parseReportsResponse,
    resolveErrorMessage: resolveReportsError,
    onAuthError: handleAuthRedirect,
  });

  const searchLoading = useMemo(
    () => searchPending || isSearching,
    [isSearching, searchPending]
  );

  const fetchReports = useCallback(
    (page = 1, limit = resolveLimit()) => {
      const activeFilters = activeFiltersRef.current || {};
      return performSearch({ ...activeFilters }, page, limit);
    },
    [performSearch, resolveLimit]
  );

  useEffect(() => {
    fetchReports(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchReports]);

  const handleFiltersChange = useCallback((field, value) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };
      filtersRef.current = next;
      return next;
    });
  }, []);

  const handleSearchSubmit = useCallback(async () => {
    const sanitized = sanitizeFilters(filtersRef.current);
    activeFiltersRef.current = sanitized;
    setActiveFiltersVersion((version) => version + 1);
    setSearchPending(true);
    try {
      await performSearch(sanitized, 1, resolveLimit());
    } finally {
      setSearchPending(false);
    }
  }, [performSearch, resolveLimit]);

  const handleResetFilters = useCallback(async () => {
    const resetFilters = { ...DEFAULT_FILTERS };
    filtersRef.current = resetFilters;
    activeFiltersRef.current = {};
    setFilters(resetFilters);
    setActiveFiltersVersion((version) => version + 1);
    setSearchPending(true);
    try {
      await performSearch({}, 1, resolveLimit());
    } finally {
      setSearchPending(false);
    }
  }, [performSearch, resolveLimit]);

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    const activeFilters = activeFiltersRef.current || {};
    await performSearch({ ...activeFilters }, currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit]);

  const hasActiveFilters = useMemo(() => {
    const active = activeFiltersRef.current || {};
    return Object.keys(active).length > 0;
  }, [activeFiltersVersion]);

  const searchQuery = useMemo(() => {
    if (!hasActiveFilters) {
      return '';
    }

    const active = activeFiltersRef.current || {};
    return (
      active.q ||
      active.purchaseOrderId ||
      active.customerId ||
      active.companyId || // Changed from supplierId
      active.status_code ||
      active.termin_bayar ||
      'filter aktif'
    );
  }, [activeFiltersVersion, hasActiveFilters]);

  const createReport = useCallback(async (reportData) => {
    try {
      const result = await laporanPenerimaanBarangService.createReport(reportData);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to create laporan penerimaan barang');
      }
      toastService.success('Laporan penerimaan barang created successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to create laporan penerimaan barang';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const fetchReportById = useCallback(async (id) => {
    if (!id) {
      return null;
    }

    try {
      const result = await laporanPenerimaanBarangService.getReportById(id);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to fetch laporan penerimaan barang detail');
      }
      return result?.data || result;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return null;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to fetch laporan penerimaan barang detail';
      toastService.error(message);
      throw err;
    }
  }, [authHandler]);

  const createReportFromFile = useCallback(async ({ file, prompt }) => {
    try {
      const result = await laporanPenerimaanBarangService.uploadFromFile({ file, prompt });
      if (result?.success === false) {
        throw new Error(result?.message || result?.error?.message || 'Failed to upload laporan penerimaan barang file');
      }
      toastService.success(result?.message || 'File uploaded and converted successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to upload laporan penerimaan barang file';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const uploadBulkReports = useCallback(async ({ files, prompt } = {}) => {
    try {
      const result = await laporanPenerimaanBarangService.uploadBulkReports({
        files,
        prompt,
      });
      if (result?.success === false) {
        throw new Error(
          result?.message ||
          result?.error?.message ||
          'Failed to upload bulk laporan penerimaan barang files'
        );
      }
      toastService.success(
        result?.message ||
        'Bulk upload laporan penerimaan barang berhasil dikirim ke background.'
      );
      return result?.data || result;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to upload bulk laporan penerimaan barang files';
      toastService.error(message);
      throw err;
    }
  }, [authHandler]);

  const fetchBulkStatus = useCallback(async (bulkId) => {
    const id = typeof bulkId === 'string' ? bulkId.trim() : bulkId;
    if (!id) {
      return null;
    }

    try {
      const result = await laporanPenerimaanBarangService.getBulkStatus(id);
      if (result?.success === false) {
        throw new Error(
          result?.message ||
          result?.error?.message ||
          'Failed to fetch laporan penerimaan barang bulk status'
        );
      }
      return result?.data || result;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return null;
      }
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to fetch laporan penerimaan barang bulk status';
      toastService.error(message);
      throw err;
    }
  }, [authHandler]);

  const fetchBulkFiles = useCallback(async ({ status } = {}) => {
    try {
      const result = await laporanPenerimaanBarangService.getBulkFiles({ status });
      if (result?.success === false) {
        throw new Error(
          result?.message ||
          result?.error?.message ||
          'Failed to fetch laporan penerimaan barang bulk files'
        );
      }
      return result?.data || result;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return null;
      }
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to fetch laporan penerimaan barang bulk files';
      toastService.error(message);
      throw err;
    }
  }, [authHandler]);

  /**
   * Upload bulk LPB files using Text Extraction (alternative to AI conversion)
   */
  const uploadBulkReportsTextExtraction = useCallback(async ({ files } = {}) => {
    try {
      const result = await laporanPenerimaanBarangService.uploadBulkReportsTextExtraction({
        files,
      });
      if (result?.success === false) {
        throw new Error(
          result?.message ||
          result?.error?.message ||
          'Failed to upload bulk LPB files with text extraction'
        );
      }
      toastService.success(
        result?.message ||
        'Bulk upload LPB dengan Text Extraction berhasil.'
      );
      return result?.data || result;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to upload bulk LPB files with text extraction';
      toastService.error(message);
      throw err;
    }
  }, [authHandler]);

  const updateReport = useCallback(async (id, reportData) => {
    try {
      const result = await laporanPenerimaanBarangService.updateReport(id, reportData);
      if (result?.success === false) {
        throw new Error(result?.error?.message || 'Failed to update laporan penerimaan barang');
      }
      toastService.success('Laporan penerimaan barang updated successfully');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to update laporan penerimaan barang';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const bulkDeleteReports = useCallback(async (ids = []) => {
    const payloadIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

    if (!payloadIds.length) {
      toastService.warning('Pilih minimal satu laporan penerimaan barang untuk dihapus.');
      return null;
    }

    try {
      const result = await laporanPenerimaanBarangService.bulkDeleteReports(payloadIds);

      if (result?.success === false) {
        throw new Error(
          result?.message ||
          result?.error?.message ||
          'Failed to delete laporan penerimaan barang'
        );
      }

      const responseData = result?.data || result || {};
      const successItems = Array.isArray(responseData?.success) ? responseData.success : [];
      const failedItems = Array.isArray(responseData?.failed) ? responseData.failed : [];

      if (successItems.length > 0) {
        const baseMessage = `Berhasil menghapus ${successItems.length} laporan penerimaan barang.`;
        if (failedItems.length > 0) {
          toastService.success(`${baseMessage} ${failedItems.length} laporan gagal dihapus.`);
        } else {
          toastService.success(baseMessage);
        }
      }

      if (!successItems.length && failedItems.length > 0) {
        toastService.warning(`${failedItems.length} laporan gagal dihapus.`);
      }

      await refreshAfterMutation();
      return { success: successItems, failed: failedItems };
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return null;
      }

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to delete laporan penerimaan barang';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const completeReports = useCallback(async (ids = []) => {
    const payloadIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

    if (!payloadIds.length) {
      toastService.warning('Pilih minimal satu laporan penerimaan barang untuk diselesaikan.');
      return null;
    }

    try {
      const result = await laporanPenerimaanBarangService.completeReports(payloadIds);

      if (result?.success === false) {
        throw new Error(
          result?.message ||
          result?.error?.message ||
          'Failed to complete laporan penerimaan barang'
        );
      }

      const responseData = result?.data || result || {};
      const successItems = Array.isArray(responseData?.success) ? responseData.success : [];
      const failedItems = Array.isArray(responseData?.failed) ? responseData.failed : [];

      if (successItems.length > 0) {
        const baseMessage = `Berhasil menyelesaikan ${successItems.length} laporan penerimaan barang.`;
        if (failedItems.length > 0) {
          toastService.success(`${baseMessage} ${failedItems.length} laporan gagal diselesaikan.`);
        } else {
          toastService.success(baseMessage);
        }
      }

      if (!successItems.length && failedItems.length > 0) {
        toastService.warning(`${failedItems.length} laporan gagal diselesaikan.`);
      }

      await refreshAfterMutation();
      return { success: successItems, failed: failedItems };
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return null;
      }

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to complete laporan penerimaan barang';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const bulkDeleteConfirmation = useDeleteConfirmation(
    bulkDeleteReports,
    'Are you sure you want to delete selected laporan penerimaan barang?',
    'Delete Laporan Penerimaan Barang'
  );

  return {
    reports,
    setReports,
    pagination,
    setPagination,
    loading,
    error,
    filters,
    searchQuery,
    hasActiveFilters,
    searchLoading,
    handleFiltersChange,
    handleSearchSubmit,
    handleResetFilters,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    createReport,
    updateReport,
    bulkDeleteReports,
    bulkDeleteConfirmation,
    fetchReports,
    handleAuthError: authHandler,
    createReportFromFile,
    uploadBulkReports,
    uploadBulkReportsTextExtraction,
    fetchBulkStatus,
    fetchBulkFiles,
    completeReports,
    fetchReportById,
  };
};

export default useLaporanPenerimaanBarangPage;
