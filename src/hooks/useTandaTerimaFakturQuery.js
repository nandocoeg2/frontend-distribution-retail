import { useQuery } from '@tanstack/react-query';
import tandaTerimaFakturService from '../services/tandaTerimaFakturService';

const sanitizeParams = (params = {}) => {
  const sanitized = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        sanitized[key] = trimmed;
      }
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
};

const parseResponsePayload = (response, { page = 1, limit = 10 } = {}) => {
  const payload = response?.data ?? response;

  const dataCandidates = [
    payload?.items,
    payload?.data?.items,
    payload?.tandaTerimaFakturs,
    payload?.data?.tandaTerimaFakturs,
    payload?.results,
    Array.isArray(payload?.data) ? payload.data : null,
    Array.isArray(payload) ? payload : null,
  ];

  const items = dataCandidates.find((candidate) => Array.isArray(candidate)) || [];

  const paginationSource =
    payload?.pagination ??
    payload?.data?.pagination ??
    payload?.meta ??
    {};

  const currentPage =
    Number(paginationSource.currentPage ?? paginationSource.page) ||
    Number(page) ||
    1;
  const itemsPerPage =
    Number(paginationSource.itemsPerPage ?? paginationSource.limit) ||
    Number(limit) ||
    10;
  const totalItems =
    Number(paginationSource.totalItems ?? paginationSource.total) ||
    items.length ||
    0;
  const totalPages =
    Number(paginationSource.totalPages) ||
    Math.max(Math.ceil((totalItems || 1) / (itemsPerPage || 1)), 1);

  return {
    tandaTerimaFakturs: items,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
    },
  };
};

/**
 * Custom hook for fetching tanda terima faktur with server-side filtering, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term
 * @returns {Object} - Query result with data, isLoading, error, etc.
 */
export const useTandaTerimaFakturQuery = ({
  page = 1,
  limit = 10,
  sorting = [],
  filters = {},
  globalFilter = '',
}) => {
  return useQuery({
    queryKey: ['tandaTerimaFaktur', { page, limit, sorting, filters, globalFilter }],
    queryFn: async () => {
      // Build query parameters for backend
      const params = {
        page,
        limit,
      };

      // Add sorting
      if (sorting.length > 0) {
        const sort = sorting[0]; // Take first sort for now
        params.sortBy = sort.id;
        params.sortOrder = sort.desc ? 'desc' : 'asc';
      }

      // Add column filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          return;
        }

        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed !== '') {
            params[key] = trimmed;
          }
          return;
        }

        params[key] = value;
      });

      // Add global filter
      if (globalFilter) {
        params.search = globalFilter;
      }

      // Call backend API
      const response = await tandaTerimaFakturService.getTandaTerimaFaktur(
        sanitizeParams(params)
      );

      return parseResponsePayload(response, { page, limit });
    },
    keepPreviousData: true, // Keep previous data while fetching new data
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
};

/**
 * Custom hook for fetching tanda terima faktur by status (for tabs)
 */
export const useTandaTerimaFakturByStatus = ({
  statusCode,
  page = 1,
  limit = 10,
}) => {
  return useQuery({
    queryKey: ['tandaTerimaFaktur', 'status', statusCode, { page, limit }],
    queryFn: async () => {
      const params = sanitizeParams({
        page,
        limit,
        statusCode: statusCode,
        status_code: statusCode,
      });

      const response = await tandaTerimaFakturService.getTandaTerimaFaktur(params);

      return parseResponsePayload(response, { page, limit });
    },
    enabled: !!statusCode, // Only run query if statusCode exists
    keepPreviousData: true,
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
};

export default useTandaTerimaFakturQuery;

