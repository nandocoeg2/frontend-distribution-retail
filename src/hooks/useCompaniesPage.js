import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { getCompanies, searchCompanies, deleteCompany } from '../services/companyService';
import usePaginatedSearch from './usePaginatedSearch';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0
};

const parseCompaniesResponse = (response) => {
  if (response?.success === false) {
    throw new Error(response?.error?.message || 'Failed to load companies');
  }

  let rawData = response?.data?.data || response?.data?.companies || response?.data || [];
  if (!Array.isArray(rawData)) {
    rawData = Array.isArray(rawData?.data) ? rawData.data : [];
  }

  const paginationData = response?.data?.pagination || {};
  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;

  return {
    results: rawData,
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

const resolveCompanyError = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to load companies';
};

const useCompaniesPage = () => {
  const navigate = useNavigate();

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: companies,
    setSearchResults: setCompanies,
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
        return getCompanies(page, limit);
      }
      return searchCompanies(trimmedQuery, page, limit);
    },
    parseResponse: parseCompaniesResponse,
    resolveErrorMessage: resolveCompanyError,
    onAuthError: handleAuthRedirect
  });

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const fetchCompanies = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchQuery]);

  const handleDeleteCompany = useCallback(async (id) => {
    try {
      await deleteCompany(id);
      toastService.success('Company deleted successfully');

      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || companies.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return;
      }
      const message = resolveCompanyError(err) || 'Failed to delete company';
      setError(message);
      toastService.error(message);
    }
  }, [authHandler, companies.length, pagination, performSearch, resolveLimit, searchQuery, setError]);

  useEffect(() => {
    fetchCompanies(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchCompanies]);

  return {
    companies,
    setCompanies,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    deleteCompany: handleDeleteCompany,
    fetchCompanies,
    handleAuthError: authHandler
  };
};

export default useCompaniesPage;
