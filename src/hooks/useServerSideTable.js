import { useEffect, useMemo, useState } from 'react';
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

const mergeLockedFilters = (filters = [], lockedFilters = []) => {
  if (!Array.isArray(filters) || filters.length === 0) {
    return lockedFilters.filter((filter) => isDefined(filter.value));
  }

  const lockedIds = lockedFilters.map((filter) => filter.id);
  const base = filters.filter((filter) => !lockedIds.includes(filter.id));
  const lockedWithValue = lockedFilters.filter((filter) => isDefined(filter.value));

  return [...base, ...lockedWithValue];
};

const areFiltersEqual = (a = [], b = []) => {
  if (a === b) {
    return true;
  }

  if (!Array.isArray(a) || !Array.isArray(b)) {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  return a.every((item, index) => {
    const other = b[index];
    return item?.id === other?.id && item?.value === other?.value;
  });
};

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
  autoResetPageOnColumnFilterChange = true,
  columnFilterDebounceMs = 500,
  tableOptions: extraTableOptions = {},
} = {}) => {
  if (typeof queryHook !== 'function') {
    throw new Error('useServerSideTable requires a queryHook function');
  }

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sorting, setSorting] = useState([]);

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

  const [columnFiltersInput, setColumnFiltersInput] = useState(() =>
    mergeLockedFilters([], normalizedLockedFilters)
  );
  const [columnFiltersApplied, setColumnFiltersApplied] = useState(() =>
    mergeLockedFilters([], normalizedLockedFilters)
  );

  useEffect(() => {
    setColumnFiltersInput((prev) => mergeLockedFilters(prev, normalizedLockedFilters));
    setColumnFiltersApplied((prev) => mergeLockedFilters(prev, normalizedLockedFilters));
  }, [normalizedLockedFilters]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setColumnFiltersApplied((prev) => {
        const next = mergeLockedFilters(columnFiltersInput, normalizedLockedFilters);
        if (areFiltersEqual(prev, next)) {
          return prev;
        }

        if (autoResetPageOnColumnFilterChange) {
          setPage(1);
        }

        return next;
      });
    }, columnFilterDebounceMs);

    return () => clearTimeout(timeout);
  }, [
    columnFiltersInput,
    normalizedLockedFilters,
    columnFilterDebounceMs,
    autoResetPageOnColumnFilterChange,
  ]);

  const lockedFilterMap = useMemo(() => {
    const map = new Map();
    normalizedLockedFilters.forEach((filter) => {
      if (isDefined(filter.value)) {
        map.set(filter.id, filter.value);
      }
    });
    return map;
  }, [normalizedLockedFilters]);

  const filters = useMemo(() => {
    const filterObj = {};
    columnFiltersApplied.forEach(({ id, value }) => {
      if (isDefined(value)) {
        filterObj[id] = value;
      }
    });
    return filterObj;
  }, [columnFiltersApplied]);

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
        columnFilters: columnFiltersApplied,
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
    columnFiltersApplied,
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

  const hasColumnFilters = columnFiltersApplied.some(({ id, value }) => {
    if (!isDefined(value)) {
      return false;
    }
    const lockedValue = lockedFilterMap.get(id);
    return lockedValue === undefined || lockedValue !== value;
  });
  const hasGlobalFilter = globalFilterEnabled && isDefined(globalFilter);
  const hasActiveFilters = hasColumnFilters || hasGlobalFilter;

  const resetFilters = () => {
    const resetValue = mergeLockedFilters([], normalizedLockedFilters);
    setColumnFiltersInput(resetValue);
    setColumnFiltersApplied(resetValue);

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
      columnFilters: columnFiltersInput,
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
    onColumnFiltersChange: setColumnFiltersInput,
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
    columnFilters: columnFiltersInput,
    appliedColumnFilters: columnFiltersApplied,
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
    setColumnFilters: setColumnFiltersInput,
    setGlobalFilter: globalFilterEnabled ? setGlobalFilter : undefined,
    resetFilters,
    tableOptions,
    queryResult,
    queryParams,
  };
};

export default useServerSideTable;
