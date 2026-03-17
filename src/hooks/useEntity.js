import { useCallback, useEffect, useMemo, useState } from 'react';
import toastService from '../services/toastService';
import usePaginatedSearch from './usePaginatedSearch';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const INITIAL_PAGINATION = {
  currentPage: 1,
  page: 1,
  totalPages: 1,
  totalItems: 0,
  total: 0,
  itemsPerPage: 10,
  limit: 10
};

const normalizePaginationShape = (paginationData = {}) => {
  const currentPage = paginationData.currentPage || paginationData.page || INITIAL_PAGINATION.currentPage;
  const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || INITIAL_PAGINATION.itemsPerPage;
  const totalItems = paginationData.totalItems || paginationData.total || INITIAL_PAGINATION.totalItems;
  const totalPages = paginationData.totalPages || INITIAL_PAGINATION.totalPages;

  return {
    currentPage,
    page: currentPage,
    totalPages,
    totalItems,
    total: totalItems,
    itemsPerPage,
    limit: itemsPerPage
  };
};

const parseEntityResponse = (response, entityNamePlural) => {
  if (response?.success === false) {
    throw new Error(`Failed to fetch ${entityNamePlural}`);
  }

  const rawData = response?.data?.data || response?.data || [];
  const paginationData = response?.data?.pagination || response?.meta || response?.pagination || {};

  const results = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

  return {
    results,
    pagination: normalizePaginationShape(paginationData)
  };
};

const createErrorResolver = (entityNamePlural) => (error) => {
  return error?.response?.data?.error?.message || error?.message || `Failed to load ${entityNamePlural}`;
};

const useEntity = ({
  entityName,
  entityNamePlural,
  getAllService,
  searchService,
  deleteService,
  createService,
  updateService,
  searchMode = 'debounce',
}) => {
  const {
    input: activeSearchQuery,
    setInput: setActiveSearchQuery,
    searchResults: entities,
    setSearchResults: setEntities,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    performSearch,
    debouncedSearch,
    handlePageChange: handlePageChangeInternal,
    handleLimitChange: handleLimitChangeInternal,
    clearSearch,
    handleAuthError,
    resolveLimit
  } = usePaginatedSearch({
    initialInput: '',
    initialPagination: INITIAL_PAGINATION,
    searchFn: (query, page, limit) => {
      const trimmedQuery = typeof query === 'string' ? query.trim() : '';
      if (!trimmedQuery || !searchService) {
        return getAllService(page, limit);
      }
      return searchService(trimmedQuery, page, limit);
    },
    parseResponse: (response) => parseEntityResponse(response, entityNamePlural),
    resolveErrorMessage: createErrorResolver(entityNamePlural),
    requireInput: false
  });

  const isSubmitSearchMode = searchMode === 'submit';
  const [searchDraft, setSearchDraft] = useState('');

  useEffect(() => {
    performSearch('', 1, INITIAL_PAGINATION.itemsPerPage);
  }, [performSearch]);

  useEffect(() => {
    if (!isSubmitSearchMode) {
      return;
    }

    setSearchDraft(activeSearchQuery || '');
  }, [activeSearchQuery, isSubmitSearchMode]);

  const searchLoading = useMemo(() => {
    if (typeof activeSearchQuery !== 'string') {
      return false;
    }
    return loading && Boolean(activeSearchQuery.trim());
  }, [activeSearchQuery, loading]);

  const handleSearchChange = useCallback((event) => {
    const query = event?.target ? event.target.value : event;
    if (isSubmitSearchMode) {
      setSearchDraft(query);
      return;
    }

    setActiveSearchQuery(query);
    debouncedSearch(query, 1, resolveLimit());
  }, [debouncedSearch, isSubmitSearchMode, resolveLimit, setActiveSearchQuery]);

  const handleSearchSubmit = useCallback(() => {
    const querySource = isSubmitSearchMode ? searchDraft : activeSearchQuery;
    const query = typeof querySource === 'string' ? querySource.trim() : '';

    return performSearch(query, 1, resolveLimit());
  }, [activeSearchQuery, isSubmitSearchMode, performSearch, resolveLimit, searchDraft]);

  const fetchEntities = useCallback((page = 1, limit = resolveLimit()) => {
    return performSearch('', page, limit);
  }, [performSearch, resolveLimit]);

  const createEntity = useCallback(async (entityData) => {
    if (!createService) return undefined;

    try {
      const result = await createService(entityData);
      if (result?.success === false) {
        throw new Error(`Failed to create ${entityName}`);
      }

      toastService.success(`${entityName} berhasil dibuat`);
      await fetchEntities(pagination.currentPage || pagination.page || 1, resolveLimit());
      return result?.data || result;
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return undefined;
      }
      const message = err.message || `Failed to create ${entityName}`;
      toastService.error(message);
      throw err;
    }
  }, [createService, entityName, fetchEntities, handleAuthError, pagination, resolveLimit]);

  const updateEntity = useCallback(async (id, entityData) => {
    if (!updateService) return undefined;

    try {
      const result = await updateService(id, entityData);
      if (result?.success === false) {
        throw new Error(`Failed to update ${entityName}`);
      }

      toastService.success(`${entityName} berhasil diperbarui`);
      const updatedEntity = result?.data || result;
      setEntities(prev => prev.map((entity) => (entity.id === id ? updatedEntity : entity)));
      return updatedEntity;
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return undefined;
      }
      const message = err.message || `Failed to update ${entityName}`;
      toastService.error(message);
      throw err;
    }
  }, [entityName, handleAuthError, setEntities, updateService]);

  const deleteEntityFunction = useCallback(async (id) => {
    if (!deleteService) return;

    try {
      const result = await deleteService(id);
      if (result?.success === false) {
        throw new Error(`Failed to delete ${entityName}`);
      }

      toastService.success(`${entityName} berhasil dihapus`);

      const trimmedQuery = typeof activeSearchQuery === 'string' ? activeSearchQuery.trim() : '';
      const itemsPerPage = resolveLimit();
      const currentPage = pagination.currentPage || pagination.page || 1;
      const totalItems = pagination.totalItems || pagination.total || entities.length;
      const newTotalItems = Math.max(totalItems - 1, 0);
      const newTotalPages = Math.max(Math.ceil(newTotalItems / itemsPerPage), 1);
      const nextPage = Math.min(currentPage, newTotalPages);

      await performSearch(trimmedQuery, nextPage, itemsPerPage);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      const message = err.message || `Failed to delete ${entityName}`;
      toastService.error(message);
    }
  }, [activeSearchQuery, deleteService, entities.length, entityName, handleAuthError, pagination, performSearch, resolveLimit]);

  const deleteConfirmation = useDeleteConfirmation(
    deleteEntityFunction,
    `Apakah Anda yakin ingin menghapus ${entityName.toLowerCase()} ini?`,
    `Hapus ${entityName}`
  );

  const handlePageChange = useCallback((newPage) => {
    handlePageChangeInternal(newPage);
  }, [handlePageChangeInternal]);

  const handleLimitChange = useCallback((newLimit) => {
    handleLimitChangeInternal(newLimit);
  }, [handleLimitChangeInternal]);

  const clearSearchState = useCallback(() => {
    if (isSubmitSearchMode) {
      setSearchDraft('');
    }
    clearSearch();
  }, [clearSearch, isSubmitSearchMode]);

  const searchQuery = isSubmitSearchMode ? searchDraft : activeSearchQuery;

  return {
    entities,
    setEntities,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    searchQuery,
    activeSearchQuery,
    searchLoading,
    handleSearchChange,
    handleSearchSubmit,
    handlePageChange,
    handleLimitChange,
    createEntity,
    updateEntity,
    deleteEntity: deleteConfirmation.showDeleteConfirmation,
    deleteConfirmation,
    fetchEntities,
    clearSearch: clearSearchState,
    handleAuthError,
  };
};

export default useEntity;
