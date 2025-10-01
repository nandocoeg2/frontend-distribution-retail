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
  const [searchField, setSearchField] = useState('q');
  const searchFieldRef = useRef('q');

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: reports,
    setSearchResults: setReports,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    performSearch,
    debouncedSearch,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    handleAuthError: authHandler,
    resolveLimit,
  } = usePaginatedSearch({
    initialPagination: INITIAL_PAGINATION,
    searchFn: (query, page, limit) => {
      const trimmedQuery = typeof query === 'string' ? query.trim() : '';
      if (!trimmedQuery) {
        return laporanPenerimaanBarangService.getAllReports(page, limit);
      }
      return laporanPenerimaanBarangService.searchReports(trimmedQuery, page, limit);
    },
    parseResponse: parseReportsResponse,
    resolveErrorMessage: resolveReportsError,
    onAuthError: handleAuthRedirect,
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchReports = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  useEffect(() => {
    fetchReports(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchReports]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchQuery]);

  const handleSearchFieldChange = useCallback((field) => {
    searchFieldRef.current = field;
    setSearchField(field);
    if (typeof searchQuery === 'string' && searchQuery.trim()) {
      performSearch(searchQuery, 1, resolveLimit());
    } else {
      performSearch('', 1, resolveLimit());
    }
  }, [performSearch, resolveLimit, searchQuery]);

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
    await performSearch(trimmedQuery, currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit, searchQuery]);

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

  const deleteReportFunction = useCallback(async (id) => {
    try {
      const result = await laporanPenerimaanBarangService.deleteReport(id);
      if (!(result?.success || result === '' || result == null)) {
        throw new Error(result?.error?.message || 'Failed to delete laporan penerimaan barang');
      }
      toastService.success('Laporan penerimaan barang deleted successfully');

      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || reports.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);
      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to delete laporan penerimaan barang';
      setError(message);
      toastService.error(message);
    }
  }, [authHandler, pagination, performSearch, reports.length, resolveLimit, searchQuery, setError]);

  const processReports = useCallback(async (ids = []) => {
    const payloadIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

    if (!payloadIds.length) {
      toastService.warning('Pilih minimal satu laporan penerimaan barang untuk diproses.');
      return null;
    }

    try {
      const result = await laporanPenerimaanBarangService.processReports(payloadIds);

      if (result?.success === false) {
        throw new Error(
          result?.message ||
          result?.error?.message ||
          'Failed to process laporan penerimaan barang'
        );
      }

      const responseData = result?.data || result || {};
      const successItems = Array.isArray(responseData?.success) ? responseData.success : [];
      const failedItems = Array.isArray(responseData?.failed) ? responseData.failed : [];

      if (successItems.length > 0) {
        const baseMessage = `Berhasil memproses ${successItems.length} laporan penerimaan barang.`;
        if (failedItems.length > 0) {
          toastService.success(`${baseMessage} ${failedItems.length} laporan gagal diproses.`);
        } else {
          toastService.success(baseMessage);
        }
      }

      if (!successItems.length && failedItems.length > 0) {
        toastService.warning(`${failedItems.length} laporan gagal diproses.`);
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
        'Failed to process laporan penerimaan barang';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const deleteReportConfirmation = useDeleteConfirmation(
    deleteReportFunction,
    'Are you sure you want to delete this laporan penerimaan barang?',
    'Delete Laporan Penerimaan Barang'
  );

  return {
    reports,
    setReports,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    createReport,
    updateReport,
    deleteReport: deleteReportConfirmation.showDeleteConfirmation,
    deleteReportConfirmation,
    fetchReports,
    handleAuthError: authHandler,
    createReportFromFile,
    uploadBulkReports,
    fetchBulkStatus,
    fetchBulkFiles,
    processReports,
    fetchReportById,
  };
};

export default useLaporanPenerimaanBarangPage;
