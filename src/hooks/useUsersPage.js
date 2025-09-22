import { useCallback, useEffect, useMemo } from 'react';
import userService from '../services/userService';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import usePaginatedSearch from './usePaginatedSearch';

const INITIAL_PAGINATION = {
  currentPage: 1,
  page: 1,
  totalPages: 1,
  totalItems: 0,
  total: 0,
  itemsPerPage: 10,
  limit: 10
};

const parseUserResponse = (response) => {
  const data = response?.data || [];
  const paginationData = response?.pagination || {};

  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;
  const totalPages = paginationData.totalPages || INITIAL_PAGINATION.totalPages;

  return {
    results: Array.isArray(data) ? data : [],
    pagination: {
      currentPage,
      page: currentPage,
      totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage
    }
  };
};

const resolveUserError = (error) => {
  return error?.message || 'Gagal memuat data users';
};

const useUsers = () => {
  const {
    input: searchQuery,
    setInput: setSearchQuery,
    searchResults: users,
    setSearchResults: setUsers,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    performSearch,
    debouncedSearch,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    handleAuthError,
    resolveLimit
  } = usePaginatedSearch({
    initialInput: '',
    initialPagination: INITIAL_PAGINATION,
    searchFn: (query, page, limit) => {
      const trimmedQuery = typeof query === 'string' ? query.trim() : '';
      if (!trimmedQuery) {
        return userService.getAllUsers(page, limit);
      }
      return userService.searchUsers(trimmedQuery, page, limit);
    },
    parseResponse: parseUserResponse,
    resolveErrorMessage: resolveUserError,
    requireInput: false
  });

  useEffect(() => {
    performSearch('', 1, INITIAL_PAGINATION.itemsPerPage);
  }, [performSearch]);

  const searchLoading = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(searchQuery.trim());
  }, [loading, searchQuery]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    setSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, resolveLimit, setSearchQuery]);

  const fetchUsers = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const deleteUserFunction = useCallback(async (id) => {
    try {
      await userService.deleteUser(id);
      toastService.success('User berhasil dihapus');

      const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || users.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      const message = err.message || 'Gagal menghapus user';
      toastService.error(message);
    }
  }, [handleAuthError, pagination, performSearch, resolveLimit, searchQuery, users.length]);

  const deleteUserConfirmation = useDeleteConfirmation(
    deleteUserFunction,
    'Apakah Anda yakin ingin menghapus user ini?',
    'Hapus User'
  );

  const clearSearchState = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  return {
    users,
    setUsers,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteUser: deleteUserConfirmation.showDeleteConfirmation,
    deleteUserConfirmation,
    fetchUsers,
    clearSearch: clearSearchState,
    handleAuthError
  };
};

export default useUsers;
