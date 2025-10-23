import { useCallback, useEffect, useMemo } from 'react';
import usePaginatedSearch from './usePaginatedSearch';
import {
  getStockMovements,
  createStockIn,
  createReturn,
  classifyReturn,
} from '../services/stockMovementService';
import toastService from '../services/toastService';

const INITIAL_FILTERS = {
  search: '',
  status: 'all',
  type: 'all',
};

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const toUpper = (value, fallback = '') => {
  if (!value) {
    return fallback;
  }

  return String(value).trim().toUpperCase();
};

const parseStockMovementsResponse = (response) => {
  if (response?.success === false) {
    const message =
      response?.error?.message ||
      response?.message ||
      'Failed to load stock movements';
    throw new Error(message);
  }

  const dataBlock = response?.data || {};
  const items =
    dataBlock?.items ||
    dataBlock?.data ||
    response?.items ||
    response?.data?.data ||
    [];
  const paginationBlock =
    dataBlock?.pagination ||
    response?.pagination ||
    INITIAL_PAGINATION;

  const safeItems = Array.isArray(items) ? items : [];

  const normalizeMovement = (movement) => {
    if (!movement || typeof movement !== 'object') {
      return movement;
    }

    const movementItems = Array.isArray(movement.items)
      ? movement.items
      : Array.isArray(movement.data)
      ? movement.data
      : [];

    const totalQuantity = movementItems.reduce((sum, item) => {
      const quantity = Number(item?.quantity || 0);
      return sum + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);

    const supplierName =
      movement?.supplier?.name ||
      movement?.supplierName ||
      movement?.supplier_name ||
      null;

    return {
      ...movement,
      type: toUpper(movement.type, 'UNKNOWN'),
      status: toUpper(movement.status, 'UNKNOWN'),
      movementNumber:
        movement.movementNumber ||
        movement.movement_number ||
        movement.documentNumber ||
        movement.document_number ||
        '-',
      notes: movement.notes || movement.description || '',
      supplierName,
      createdAt: movement.createdAt || movement.created_at || null,
      updatedAt: movement.updatedAt || movement.updated_at || null,
      totalItems: movementItems.length,
      totalQuantity,
      items: movementItems,
    };
  };

  return {
    results: safeItems.map(normalizeMovement),
    pagination: {
      currentPage:
        paginationBlock.currentPage ||
        paginationBlock.page ||
        INITIAL_PAGINATION.currentPage,
      page:
        paginationBlock.page ||
        paginationBlock.currentPage ||
        INITIAL_PAGINATION.page,
      totalPages:
        paginationBlock.totalPages || INITIAL_PAGINATION.totalPages,
      totalItems:
        paginationBlock.totalItems ||
        paginationBlock.total ||
        INITIAL_PAGINATION.totalItems,
      total:
        paginationBlock.total ||
        paginationBlock.totalItems ||
        INITIAL_PAGINATION.total,
      itemsPerPage:
        paginationBlock.itemsPerPage ||
        paginationBlock.limit ||
        INITIAL_PAGINATION.itemsPerPage,
      limit:
        paginationBlock.limit ||
        paginationBlock.itemsPerPage ||
        INITIAL_PAGINATION.limit,
    },
  };
};

const resolveStockMovementError = (error) => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    'Failed to load stock movements'
  );
};

const sanitizeFilters = (filters = {}) => {
  const trimmedSearch =
    typeof filters.search === 'string' ? filters.search.trim() : '';
  const status =
    filters.status && filters.status !== 'all' ? filters.status : undefined;
  const type =
    filters.type && filters.type !== 'all' ? filters.type : undefined;

  return {
    search: trimmedSearch || undefined,
    status,
    type,
  };
};

const useStockMovementsPage = () => {
  const {
    input: filters,
    setInput: setFilters,
    searchResults: movements,
    setSearchResults: setMovements,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    performSearch,
    debouncedSearch,
    handlePageChange,
    handleLimitChange,
    resolveLimit,
    handleAuthError,
  } = usePaginatedSearch({
    initialInput: INITIAL_FILTERS,
    initialPagination: INITIAL_PAGINATION,
    searchFn: (filterValue = INITIAL_FILTERS, page = 1, limit = 10) => {
      const params = sanitizeFilters(filterValue);
      return getStockMovements({
        page,
        limit,
        ...params,
      });
    },
    parseResponse: parseStockMovementsResponse,
    resolveErrorMessage: resolveStockMovementError,
    toastOnError: false,
  });

  const searchLoading = useMemo(() => {
    if (!loading) {
      return false;
    }

    if (!filters) {
      return false;
    }

    return Boolean(
      typeof filters.search === 'string' && filters.search.trim()
    );
  }, [filters, loading]);

  const fetchMovements = useCallback(
    (page = 1, limit = resolveLimit()) => {
      const activeFilters = filters || INITIAL_FILTERS;
      return performSearch({ ...activeFilters }, page, limit);
    },
    [filters, performSearch, resolveLimit]
  );

  const refreshAfterMutation = useCallback(async () => {
    const currentPage = pagination.currentPage || pagination.page || 1;
    const limit =
      pagination.itemsPerPage || pagination.limit || resolveLimit();

    await fetchMovements(currentPage, limit);
  }, [fetchMovements, pagination, resolveLimit]);

  const createStockInMovement = useCallback(
    async (payload) => {
      setError(null);
      try {
        const result = await createStockIn(payload);
        toastService.success('Stock in berhasil dicatat');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        const message =
          resolveStockMovementError(err) ||
          'Failed to create stock-in movement';
        setError(message);
        toastService.error(message);
        throw err;
      }
    },
    [refreshAfterMutation, setError]
  );

  const createReturnMovement = useCallback(
    async (payload) => {
      setError(null);
      try {
        const result = await createReturn(payload);
        toastService.success('Return berhasil dicatat');
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        const message =
          resolveStockMovementError(err) ||
          'Failed to create return movement';
        setError(message);
        toastService.error(message);
        throw err;
      }
    },
    [refreshAfterMutation, setError]
  );

  const classifyReturnMovement = useCallback(
    async (movementId, action) => {
      setError(null);
      try {
        const result = await classifyReturn(movementId, action);
        const successMessage =
          action === 'restock'
            ? 'Return berhasil direstock dan stok diperbarui'
            : 'Return ditolak dan stok tetap';
        toastService.success(successMessage);
        await refreshAfterMutation();
        return result?.data || result;
      } catch (err) {
        const message =
          resolveStockMovementError(err) ||
          'Failed to classify return movement';
        setError(message);
        toastService.error(message);
        throw err;
      }
    },
    [refreshAfterMutation, setError]
  );

  const handleFiltersChange = useCallback(
    (changes) => {
      setFilters((prev) => {
        const nextFilters = { ...(prev || INITIAL_FILTERS), ...changes };
        debouncedSearch({ ...nextFilters }, 1, resolveLimit());
        return nextFilters;
      });
    },
    [debouncedSearch, resolveLimit, setFilters]
  );

  const handleResetFilters = useCallback(() => {
    const defaults = { ...INITIAL_FILTERS };
    setFilters(defaults);
    performSearch(defaults, 1, resolveLimit());
  }, [performSearch, resolveLimit, setFilters]);

  useEffect(() => {
    const defaults = { ...INITIAL_FILTERS };
    setFilters(defaults);
    performSearch(defaults, 1, INITIAL_PAGINATION.itemsPerPage);
  }, [performSearch, setFilters]);

  return {
    filters: filters || INITIAL_FILTERS,
    setFilters,
    movements,
    setMovements,
    pagination,
    setPagination,
    loading,
    searchLoading,
    error,
    setError,
    handleFiltersChange,
    handleResetFilters,
    handlePageChange,
    handleLimitChange,
    fetchMovements,
    resolveLimit,
    handleAuthError,
    createStockInMovement,
    createReturnMovement,
    classifyReturnMovement,
  };
};

export default useStockMovementsPage;
