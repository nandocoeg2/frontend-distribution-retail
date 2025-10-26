import { useEffect, useMemo, useRef, useState } from 'react';
import { getCoreRowModel } from '@tanstack/react-table';

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
};

const DEFAULT_GLOBAL_FILTER = {
  enabled: false,
  initialValue: '',
  debounceMs: 500,
  resetPageOnChange: true,
};

const isDefined = (value) => value !== undefined && value !== null && value !== '';

export const useServerSideTable = ({
  queryHook,
  selectData,
  selectPagination,
  getQueryParams,
  initialPage = 1,
  initialLimit = 10,
  globalFilter: globalFilterOptions = DEFAULT_GLOBAL_FILTER,
  lockedFilters = [],
  manualPagination = true,
  manualSorting = true,
  manualFiltering = true,
  autoResetPageOnSort = true,
  tableOptions: extraTableOptions = {},
} = {}) => {
  if (typeof queryHook !== 'function') {
    throw new Error('useServerSideTable requires a queryHook function');
  }

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const globalFilterEnabled = Boolean(globalFilterOptions?.enabled);
  const globalFilterInitialValue = globalFilterOptions?.initialValue ?? '';
  const globalFilterDebounceMs = globalFilterOptions?.debounceMs ?? 500;
  const resetPageOnGlobalFilterChange = globalFilterOptions?.resetPageOnChange !== false;

  const [globalFilter, setGlobalFilter] = useState(
    globalFilterEnabled ? globalFilterInitialValue : ''
  );
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState(
    globalFilterEnabled ? globalFilterInitialValue : ''
  );

  useEffect(() => {
    if (!globalFilterEnabled) {
      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      if (resetPageOnGlobalFilterChange) {
        setPage(1);
      }
    }, globalFilterDebounceMs);

    return () => clearTimeout(timeout);
  }, [
    globalFilter,
    globalFilterEnabled,
    resetPageOnGlobalFilterChange,
    globalFilterDebounceMs,
  ]);

  const normalizedLockedFilters = useMemo(
    () =>
      (lockedFilters || [])
        .filter((filter) => filter && filter.id)
        .map((filter) => ({
          id: filter.id,
          value: filter.value,
        })),
    [lockedFilters]
  );

  const lockedFilterIdsRef = useRef([]);

  useEffect(() => {
    setColumnFilters((prev) => {
      const previousLockedIds = lockedFilterIdsRef.current;
      const nextLockedIds = normalizedLockedFilters.map((filter) => filter.id);

      // Remove filters that belonged to the old locked set
      let nextFilters = prev.filter((filter) => !previousLockedIds.includes(filter.id));

      // Remove filters for the new locked ids (will be re-added below)
      nextFilters = nextFilters.filter((filter) => !nextLockedIds.includes(filter.id));

      // Add new locked filters when they have a defined value
      const lockedWithValue = normalizedLockedFilters.filter((filter) =>
        isDefined(filter.value)
      );

      lockedFilterIdsRef.current = nextLockedIds;
      return [...nextFilters, ...lockedWithValue];
    });
  }, [normalizedLockedFilters]);

  const filters = useMemo(() => {
    const filterObj = {};
    columnFilters.forEach(({ id, value }) => {
      if (isDefined(value)) {
        filterObj[id] = value;
      }
    });
    return filterObj;
  }, [columnFilters]);

  const queryParams = useMemo(() => {
    const baseParams = {
      page,
      limit,
      sorting,
      filters,
      globalFilter: globalFilterEnabled ? debouncedGlobalFilter : '',
    };

    if (typeof getQueryParams === 'function') {
      return getQueryParams({
        ...baseParams,
        columnFilters,
        globalFilter,
        debouncedGlobalFilter,
      });
    }

    return baseParams;
  }, [
    page,
    limit,
    sorting,
    filters,
    columnFilters,
    globalFilterEnabled,
    globalFilter,
    debouncedGlobalFilter,
    getQueryParams,
  ]);

  const queryResult = queryHook(queryParams);
  const {
    data: rawData,
    isLoading = false,
    isFetching = false,
    error = null,
  } = queryResult ?? {};

  const data = useMemo(() => {
    if (typeof selectData === 'function') {
      return selectData(rawData) ?? [];
    }

    if (!rawData) {
      return [];
    }

    if (Array.isArray(rawData)) {
      return rawData;
    }

    if (Array.isArray(rawData?.items)) {
      return rawData.items;
    }

    return [];
  }, [rawData, selectData]);

  const pagination = useMemo(() => {
    if (typeof selectPagination === 'function') {
      return {
        ...DEFAULT_PAGINATION,
        itemsPerPage: limit,
        ...selectPagination(rawData),
      };
    }

    if (rawData?.pagination) {
      const { pagination: meta } = rawData;
      return {
        currentPage: meta.currentPage ?? page,
        totalPages: meta.totalPages ?? 1,
        totalItems: meta.totalItems ?? 0,
        itemsPerPage: meta.itemsPerPage ?? limit,
      };
    }

    return {
      currentPage: page,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: limit,
    };
  }, [rawData, selectPagination, page, limit]);

  const hasColumnFilters = columnFilters.some(({ value }) => isDefined(value));
  const hasGlobalFilter = globalFilterEnabled && isDefined(globalFilter);
  const hasActiveFilters = hasColumnFilters || hasGlobalFilter;

  const resetFilters = () => {
    setColumnFilters(
      normalizedLockedFilters.filter((filter) => isDefined(filter.value))
    );

    if (globalFilterEnabled) {
      setGlobalFilter(globalFilterInitialValue);
      setDebouncedGlobalFilter(globalFilterInitialValue);
    }

    setPage(1);
  };

  const tableOptions = {
    data,
    getCoreRowModel: getCoreRowModel(),
    manualPagination,
    manualSorting,
    manualFiltering,
    pageCount: pagination.totalPages,
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: Math.max(page - 1, 0),
        pageSize: limit,
      },
      ...(globalFilterEnabled ? { globalFilter } : {}),
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      if (autoResetPageOnSort) {
        setPage(1);
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => {
      const current = { pageIndex: Math.max(page - 1, 0), pageSize: limit };
      const next =
        typeof updater === 'function'
          ? updater(current)
          : updater;

      const nextPageIndex = Math.max(next?.pageIndex ?? 0, 0);
      const nextPageSize = next?.pageSize ?? limit;

      setPage(nextPageIndex + 1);
      setLimit(nextPageSize);
    },
    ...(globalFilterEnabled ? { onGlobalFilterChange: setGlobalFilter } : {}),
    ...extraTableOptions,
  };

  return {
    data,
    pagination,
    page,
    limit,
    sorting,
    columnFilters,
    globalFilter: globalFilterEnabled ? globalFilter : undefined,
    debouncedGlobalFilter: globalFilterEnabled ? debouncedGlobalFilter : undefined,
    filters,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    setPage,
    setLimit,
    setSorting,
    setColumnFilters,
    setGlobalFilter: globalFilterEnabled ? setGlobalFilter : undefined,
    resetFilters,
    tableOptions,
    queryResult,
    queryParams,
  };
};

export default useServerSideTable;
