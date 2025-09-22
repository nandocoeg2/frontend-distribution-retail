import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { termOfPaymentService } from '../services/termOfPaymentService';
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

const parseTermOfPaymentResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.message || 'Failed to load term of payments');
  }

  const rawData = response?.data?.data || response?.data || [];
  const paginationData = response?.data?.pagination || {};
  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;

  return {
    results: Array.isArray(rawData) ? rawData : Array.isArray(rawData?.data) ? rawData.data : [],
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

const resolveTermOfPaymentError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Gagal memuat data term of payments';
};

const useTermOfPayments = () => {
  const navigate = useNavigate();

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: termOfPayments,
    setSearchResults: setTermOfPayments,
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
    resolveLimit
  } = usePaginatedSearch({
    initialPagination: INITIAL_PAGINATION,
    searchFn: (query, page, limit) => {
      const trimmedQuery = typeof query === 'string' ? query.trim() : '';
      if (!trimmedQuery) {
        return termOfPaymentService.getAllTermOfPayments(page, limit);
      }
      return termOfPaymentService.searchTermOfPayments(trimmedQuery, page, limit);
    },
    parseResponse: parseTermOfPaymentResponse,
    resolveErrorMessage: resolveTermOfPaymentError,
    onAuthError: handleAuthRedirect
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchTermOfPayments = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const searchTermOfPayments = useCallback((query, page = 1, limit = resolveLimit()) => {
    return performSearch(query, page, limit);
  }, [performSearch, resolveLimit]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchQuery]);

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
    await performSearch(trimmedQuery, currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit, searchQuery]);

  const createTermOfPayment = useCallback(async (termOfPaymentData) => {
    try {
      const result = await termOfPaymentService.createTermOfPayment(termOfPaymentData);
      if (result?.success === false) {
        throw new Error(result?.message || 'Failed to create term of payment');
      }
      toastService.success('Term of payment berhasil dibuat');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.message === 'Unauthorized' || err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Gagal membuat term of payment';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const updateTermOfPayment = useCallback(async (id, termOfPaymentData) => {
    try {
      const result = await termOfPaymentService.updateTermOfPayment(id, termOfPaymentData);
      if (result?.success === false) {
        throw new Error(result?.message || 'Failed to update term of payment');
      }
      toastService.success('Term of payment berhasil diperbarui');
      await refreshAfterMutation();
      return result?.data;
    } catch (err) {
      if (err?.message === 'Unauthorized' || err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Gagal memperbarui term of payment';
      toastService.error(message);
      throw err;
    }
  }, [authHandler, refreshAfterMutation]);

  const getTermOfPaymentById = useCallback(async (id) => {
    try {
      const result = await termOfPaymentService.getTermOfPaymentById(id);
      if (result?.success === false) {
        throw new Error(result?.message || 'Failed to fetch term of payment');
      }
      return result?.data;
    } catch (err) {
      if (err?.message === 'Unauthorized' || err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return undefined;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Gagal mengambil data term of payment';
      toastService.error(message);
      throw err;
    }
  }, [authHandler]);

  const deleteTermOfPaymentFunction = useCallback(async (id) => {
    try {
      const result = await termOfPaymentService.deleteTermOfPayment(id);
      if (!(result === true || result?.success)) {
        throw new Error(result?.message || 'Failed to delete term of payment');
      }
      toastService.success('Term of payment berhasil dihapus');

      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || termOfPayments.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);
      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err?.message === 'Unauthorized' || err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return;
      }
      const message = err?.response?.data?.error?.message || err?.message || 'Gagal menghapus term of payment';
      setError(message);
      toastService.error(message);
    }
  }, [authHandler, pagination, performSearch, resolveLimit, searchQuery, setError, termOfPayments.length]);

  const deleteTermOfPaymentConfirmation = useDeleteConfirmation(
    deleteTermOfPaymentFunction,
    'Apakah Anda yakin ingin menghapus term of payment ini?',
    'Hapus Term of Payment'
  );

  useEffect(() => {
    fetchTermOfPayments(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchTermOfPayments]);

  return {
    termOfPayments,
    setTermOfPayments,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    createTermOfPayment,
    updateTermOfPayment,
    getTermOfPaymentById,
    deleteTermOfPayment: deleteTermOfPaymentConfirmation.showDeleteConfirmation,
    deleteTermOfPaymentConfirmation,
    fetchTermOfPayments,
    searchTermOfPayments,
    handleAuthError: authHandler
  };
};

export default useTermOfPayments;
