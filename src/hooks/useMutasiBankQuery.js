import { useQuery } from '@tanstack/react-query';
import mutasiBankService from '../services/mutasiBankService';

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }

  return value;
};

const buildListParams = ({ page, limit, filters, globalFilter }) => {
  const params = {
    page,
    limit,
  };

  const resolvedFilters = filters || {};

  Object.entries(resolvedFilters).forEach(([key, value]) => {
    const normalized = normalizeValue(value);
    if (normalized === undefined) {
      return;
    }
    params[key] = normalized;
  });

  const resolvedGlobalFilter = normalizeValue(globalFilter);
  if (resolvedGlobalFilter !== undefined) {
    params.search = resolvedGlobalFilter;
  }

  return params;
};

const extractListData = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.mutations)) {
    return response.mutations;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  return [];
};

const extractMeta = (response) => {
  if (!response) {
    return {};
  }

  if (response?.meta) {
    return response.meta;
  }

  if (response?.data?.meta) {
    return response.data.meta;
  }

  return {};
};

const extractPagination = (response) => {
  const base = response?.pagination || response?.data?.pagination || {};

  if (!base || typeof base !== 'object') {
    return { ...DEFAULT_PAGINATION };
  }

  const currentPage =
    parseInt(base.currentPage || base.page || DEFAULT_PAGINATION.currentPage, 10) ||
    DEFAULT_PAGINATION.currentPage;
  const itemsPerPage =
    parseInt(base.itemsPerPage || base.limit || DEFAULT_PAGINATION.itemsPerPage, 10) ||
    DEFAULT_PAGINATION.itemsPerPage;
  const totalItems =
    parseInt(base.totalItems || base.total || DEFAULT_PAGINATION.totalItems, 10) ||
    DEFAULT_PAGINATION.totalItems;
  const totalPages =
    parseInt(base.totalPages || Math.ceil(totalItems / itemsPerPage) || DEFAULT_PAGINATION.totalPages, 10) ||
    DEFAULT_PAGINATION.totalPages;

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
  };
};

const parseListResponse = (response) => {
  if (response?.success === false) {
    const message =
      response?.error?.message ||
      response?.message ||
      'Failed to fetch bank mutations';
    const error = new Error(message);
    error.response = response;
    throw error;
  }

  const data = extractListData(response);
  const pagination = extractPagination(response);
  const meta = extractMeta(response);

  return {
    mutations: Array.isArray(data) ? data : [],
    pagination: {
      ...DEFAULT_PAGINATION,
      ...pagination,
    },
    meta,
  };
};

export const useMutasiBankQuery = ({
  page = 1,
  limit = 10,
  sorting = [],
  filters = {},
  globalFilter = '',
} = {}) => {
  return useQuery({
    queryKey: [
      'mutasiBank',
      {
        page,
        limit,
        sorting,
        filters,
        globalFilter,
      },
    ],
    queryFn: async () => {
      const params = buildListParams({ page, limit, filters, globalFilter, sorting });
      const response = await mutasiBankService.listMutations(params);
      return parseListResponse(response);
    },
    keepPreviousData: true,
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
};

export default useMutasiBankQuery;
