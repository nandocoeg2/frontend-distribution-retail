import { useQuery } from '@tanstack/react-query';
import kwitansiService from '../services/kwitansiService';

/**
 * Custom hook for fetching kwitansi with server-side filtering, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term
 * @returns {Object} - Query result with data, isLoading, error, etc.
 */
export const useKwitansiQuery = ({
  page = 1,
  limit = 10,
  sorting = [],
  filters = {},
  globalFilter = '',
}) => {
  return useQuery({
    queryKey: ['kwitansi', { page, limit, sorting, filters, globalFilter }],
    queryFn: async () => {
      // Build query parameters for backend
      const params = {};

      // Add sorting
      if (sorting.length > 0) {
        const sort = sorting[0]; // Take first sort for now
        params.sortBy = sort.id;
        params.sortOrder = sort.desc ? 'desc' : 'asc';
      }

      // Add column filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params[key] = value;
        }
      });

      // Add global filter
      if (globalFilter) {
        params.search = globalFilter;
      }

      // Determine whether to use search or getAll endpoint
      const hasFilters = Object.keys(params).length > 0;
      let response;

      if (hasFilters) {
        response = await kwitansiService.searchKwitansi(params, page, limit);
      } else {
        response = await kwitansiService.getAllKwitansi(page, limit);
      }

      // Handle nested response format
      const responseData = response?.data || response;
      const kwitansisData = responseData?.kwitansis || responseData?.data || responseData || [];
      const paginationData = responseData?.pagination || responseData?.meta || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(kwitansisData) ? kwitansisData.length : 0,
        itemsPerPage: parseInt(limit) || 10,
      };

      // Normalize pagination values (convert strings to numbers if needed)
      const normalizedPagination = {
        currentPage: parseInt(paginationData.currentPage || paginationData.page) || page,
        totalPages: parseInt(paginationData.totalPages) || 1,
        totalItems: parseInt(paginationData.totalItems || paginationData.total) || 0,
        itemsPerPage: parseInt(paginationData.itemsPerPage || paginationData.limit) || limit,
      };

      return {
        kwitansis: Array.isArray(kwitansisData) ? kwitansisData : [],
        pagination: normalizedPagination,
      };
    },
    keepPreviousData: true, // Keep previous data while fetching new data
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
  });
};

/**
 * Custom hook for fetching kwitansi by status (for tabs)
 */
export const useKwitansiByStatus = ({
  statusCode,
  page = 1,
  limit = 10,
}) => {
  return useQuery({
    queryKey: ['kwitansi', 'status', statusCode, { page, limit }],
    queryFn: async () => {
      const params = {
        status_code: statusCode,
      };

      const response = await kwitansiService.searchKwitansi(params, page, limit);

      // Handle nested response format
      const responseData = response?.data || response;
      const kwitansisData = responseData?.kwitansis || responseData?.data || responseData || [];
      const paginationData = responseData?.pagination || responseData?.meta || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(kwitansisData) ? kwitansisData.length : 0,
        itemsPerPage: parseInt(limit) || 10,
      };

      // Normalize pagination values (convert strings to numbers if needed)
      const normalizedPagination = {
        currentPage: parseInt(paginationData.currentPage || paginationData.page) || page,
        totalPages: parseInt(paginationData.totalPages) || 1,
        totalItems: parseInt(paginationData.totalItems || paginationData.total) || 0,
        itemsPerPage: parseInt(paginationData.itemsPerPage || paginationData.limit) || limit,
      };

      return {
        kwitansis: Array.isArray(kwitansisData) ? kwitansisData : [],
        pagination: normalizedPagination,
      };
    },
    enabled: !!statusCode, // Only run query if statusCode exists
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });
};

export default useKwitansiQuery;

