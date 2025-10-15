import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import checkingListService from '../services/checkingListService';
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

const DEFAULT_SEARCH_FIELD = 'checker';

const parseChecklistsResponse = (response = {}) => {
  if (response?.success === false) {
    throw new Error(
      response?.error?.message || 'Failed to fetch checklist surat jalan'
    );
  }

  const rawData =
    response?.data?.checklistSuratJalans ??
    response?.data?.data ??
    response?.data ??
    [];

  const paginationData =
    response?.data?.pagination ?? response?.pagination ?? {};

  const currentPage =
    paginationData.currentPage ?? paginationData.page ?? INITIAL_PAGINATION.page;
  const itemsPerPage =
    paginationData.itemsPerPage ??
    paginationData.limit ??
    INITIAL_PAGINATION.itemsPerPage;
  const totalItems =
    paginationData.totalItems ??
    paginationData.total ??
    (Array.isArray(rawData) ? rawData.length : INITIAL_PAGINATION.totalItems);
  const totalPages =
    paginationData.totalPages ??
    Math.max(Math.ceil((totalItems || 1) / (itemsPerPage || 1)), 1);

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
      totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage,
    },
  };
};

const resolveChecklistsError = (error) => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    'Failed to load checklist surat jalan'
  );
};

const buildSearchInput = (field = DEFAULT_SEARCH_FIELD, term = '') => ({
  field: field || DEFAULT_SEARCH_FIELD,
  term: typeof term === 'string' ? term : '',
});

const normalizeSearchInput = (input) => {
  if (input && typeof input === 'object') {
    return {
      field: input.field || DEFAULT_SEARCH_FIELD,
      term:
        typeof input.term === 'string'
          ? input.term
          : typeof input.query === 'string'
            ? input.query
            : '',
    };
  }

  if (typeof input === 'string') {
    return { field: DEFAULT_SEARCH_FIELD, term: input };
  }

  return { field: DEFAULT_SEARCH_FIELD, term: '' };
};

const useCheckingListPage = () => {
  const navigate = useNavigate();
  const [searchField, setSearchField] = useState(DEFAULT_SEARCH_FIELD);
  const [searchTerm, setSearchTerm] = useState('');
  const searchFieldRef = useRef(DEFAULT_SEARCH_FIELD);
  const searchTermRef = useRef('');

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const {
    input,
    setInput: setSearchInput,
    searchResults: checklists,
    setSearchResults: setChecklists,
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
    initialInput: buildSearchInput(DEFAULT_SEARCH_FIELD, ''),
    initialPagination: INITIAL_PAGINATION,
    searchFn: (value, page, limit) => {
      const { field, term } = normalizeSearchInput(value);
      const trimmedTerm = typeof term === 'string' ? term.trim() : '';

      if (!trimmedTerm) {
        return checkingListService.getAllChecklists(page, limit);
      }

      return checkingListService.searchChecklists(
        { [field || DEFAULT_SEARCH_FIELD]: trimmedTerm },
        page,
        limit
      );
    },
    parseResponse: parseChecklistsResponse,
    resolveErrorMessage: resolveChecklistsError,
    onAuthError: handleAuthRedirect,
  });

  useEffect(() => {
    const { field, term } = normalizeSearchInput(input);
    if (field !== searchFieldRef.current) {
      searchFieldRef.current = field;
      setSearchField(field);
    }
    if (term !== searchTermRef.current) {
      searchTermRef.current = term;
      setSearchTerm(term);
    }
  }, [input]);

  const searchLoading = useMemo(() => {
    if (typeof searchTerm !== 'string') {
      return false;
    }
    return loading && Boolean(searchTerm.trim());
  }, [loading, searchTerm]);

  const fetchChecklists = useCallback(
    (page = 1, limit = resolveLimit()) => {
      return performSearch(
        buildSearchInput(searchFieldRef.current, searchTermRef.current),
        page,
        limit
      );
    },
    [performSearch, resolveLimit]
  );

  useEffect(() => {
    fetchChecklists(1, INITIAL_PAGINATION.itemsPerPage);
  }, [fetchChecklists]);

  const handleSearchChange = useCallback(
    (event) => {
      const value = event?.target ? event.target.value : event;
      searchTermRef.current = value;
      setSearchTerm(value);
      const searchInput = buildSearchInput(searchFieldRef.current, value);
      setSearchInput(searchInput);
      debouncedSearch(searchInput, 1, resolveLimit());
    },
    [debouncedSearch, resolveLimit, setSearchInput]
  );

  const handleSearchFieldChange = useCallback(
    (field) => {
      const nextField =
        typeof field === 'string' && field.trim()
          ? field.trim()
          : DEFAULT_SEARCH_FIELD;

      searchFieldRef.current = nextField;
      setSearchField(nextField);

      const currentTerm = searchTermRef.current || '';
      const trimmed = currentTerm.trim();
      const searchInput = buildSearchInput(nextField, currentTerm);
      setSearchInput(searchInput);

      if (trimmed) {
        performSearch(searchInput, 1, resolveLimit());
      } else {
        performSearch(
          buildSearchInput(nextField, ''),
          1,
          resolveLimit()
        );
      }
    },
    [performSearch, resolveLimit, setSearchInput]
  );

  const refreshAfterMutation = useCallback(async () => {
    const itemsPerPage = resolveLimit();
    const currentPage = pagination.currentPage || pagination.page || 1;
    const searchInput = buildSearchInput(
      searchFieldRef.current,
      searchTermRef.current
    );
    await performSearch(searchInput, currentPage, itemsPerPage);
  }, [pagination, performSearch, resolveLimit]);

  const createChecklist = useCallback(
    async (payload) => {
      try {
        const result = await checkingListService.createChecklist(payload);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to create checklist surat jalan'
          );
        }
        toastService.success('Checklist surat jalan berhasil dibuat');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return undefined;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to create checklist surat jalan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation]
  );

  const updateChecklist = useCallback(
    async (id, payload) => {
      try {
        const result = await checkingListService.updateChecklist(id, payload);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to update checklist surat jalan'
          );
        }
        toastService.success('Checklist surat jalan berhasil diperbarui');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return undefined;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to update checklist surat jalan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler, refreshAfterMutation]
  );

  const fetchChecklistById = useCallback(
    async (id) => {
      if (!id) {
        return null;
      }
      try {
        const result = await checkingListService.getChecklistById(id);
        if (result?.success === false) {
          throw new Error(
            result?.error?.message || 'Failed to fetch checklist surat jalan'
          );
        }
        return result?.data || result;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return null;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to fetch checklist surat jalan';
        toastService.error(message);
        throw err;
      }
    },
    [authHandler]
  );

  const deleteChecklistFunction = useCallback(
    async (id) => {
      try {
        const result = await checkingListService.deleteChecklist(id);
        if (!(result?.success || result == null || result === '')) {
          throw new Error(
            result?.error?.message || 'Failed to delete checklist surat jalan'
          );
        }
        toastService.success('Checklist surat jalan berhasil dihapus');

        const itemsPerPage = resolveLimit();
        const currentPage = pagination.currentPage || pagination.page || 1;
        const totalItems =
          pagination.totalItems || pagination.total || checklists.length;
        const newTotalItems = Math.max(totalItems - 1, 0);
        const newTotalPages = Math.max(
          Math.ceil(newTotalItems / itemsPerPage),
          1
        );
        const nextPage = Math.min(currentPage, newTotalPages);
        const searchInput = buildSearchInput(
          searchFieldRef.current,
          searchTermRef.current
        );

        await performSearch(searchInput, nextPage, itemsPerPage);
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          authHandler();
          return;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to delete checklist surat jalan';
        toastService.error(message);
        throw err;
      }
    },
    [
      authHandler,
      checklists.length,
      pagination.currentPage,
      pagination.page,
      pagination.total,
      pagination.totalItems,
      performSearch,
      resolveLimit,
    ]
  );

  const deleteChecklistConfirmation = useDeleteConfirmation(
    deleteChecklistFunction,
    'Apakah Anda yakin ingin menghapus checklist surat jalan ini?',
    'Hapus Checklist Surat Jalan'
  );

  return {
    checklists,
    setChecklists,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery: searchTerm,
    searchField,
    searchLoading,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    createChecklist,
    updateChecklist,
    deleteChecklist: deleteChecklistConfirmation.showDeleteConfirmation,
    deleteChecklistConfirmation,
    fetchChecklists,
    fetchChecklistById,
    handleAuthError: authHandler,
  };
};

export default useCheckingListPage;
