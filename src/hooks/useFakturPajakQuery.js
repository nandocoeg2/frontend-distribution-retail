import { useQuery } from '@tanstack/react-query';
import fakturPajakService from '../services/fakturPajakService';

/**
 * Custom hook for fetching faktur pajak with server-side filtering, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term
 * @returns {Object} - Query result with data, isLoading, error, etc.
 */
export const useFakturPajakQuery = ({
  page = 1,
  limit = 10,
  sorting = [],
  filters = {},
  globalFilter = '',
}) => {
  return useQuery({
    queryKey: ['fakturPajak', { page, limit, sorting, filters, globalFilter }],
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
        if (value) {
          params[key] = value;
        }
      });

      // Add global filter
      if (globalFilter) {
        params.search = globalFilter;
      }

      // Call backend API - if filters exist, use search, otherwise get all
      const hasFilters = Object.keys(filters).length > 0 || globalFilter;
      const response = hasFilters
        ? await fakturPajakService.searchFakturPajak(params, page, limit)
        : await fakturPajakService.getAllFakturPajak(page, limit);

      // Handle nested response format: { success: true, data: { fakturPajaks: [...], pagination: {...} } }
      const responseData = response?.data || response;
      const fakturPajaksData = responseData?.fakturPajaks || responseData?.data || responseData || [];
      const paginationData = responseData?.pagination || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(fakturPajaksData) ? fakturPajaksData.length : 0,
        itemsPerPage: parseInt(limit) || 10,
      };

      // Normalize pagination values (convert strings to numbers if needed)
      const normalizedPagination = {
        currentPage: parseInt(paginationData.currentPage) || page,
        totalPages: parseInt(paginationData.totalPages) || 1,
        totalItems: parseInt(paginationData.totalItems) || 0,
        itemsPerPage: parseInt(paginationData.itemsPerPage) || limit,
      };

      return {
        fakturPajaks: Array.isArray(fakturPajaksData) ? fakturPajaksData : [],
        pagination: normalizedPagination,
      };
    },
    keepPreviousData: true, // Keep previous data while fetching new data
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
};

/**
 * Custom hook for fetching faktur pajak by status (for tabs)
 */
export const useFakturPajakByStatus = ({
  statusCode,
  page = 1,
  limit = 10,
}) => {
  return useQuery({
    queryKey: ['fakturPajak', 'status', statusCode, { page, limit }],
    queryFn: async () => {
      const params = {
        page,
        limit,
      };

      if (statusCode) {
        params.status_code = statusCode;
      }

      const response = statusCode
        ? await fakturPajakService.searchFakturPajak(params, page, limit)
        : await fakturPajakService.getAllFakturPajak(page, limit);

      // Handle nested response format: { success: true, data: { fakturPajaks: [...], pagination: {...} } }
      const responseData = response?.data || response;
      const fakturPajaksData = responseData?.fakturPajaks || responseData?.data || responseData || [];
      const paginationData = responseData?.pagination || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(fakturPajaksData) ? fakturPajaksData.length : 0,
        itemsPerPage: parseInt(limit) || 10,
      };

      // Normalize pagination values (convert strings to numbers if needed)
      const normalizedPagination = {
        currentPage: parseInt(paginationData.currentPage) || page,
        totalPages: parseInt(paginationData.totalPages) || 1,
        totalItems: parseInt(paginationData.totalItems) || 0,
        itemsPerPage: parseInt(paginationData.itemsPerPage) || limit,
      };

      return {
        fakturPajaks: Array.isArray(fakturPajaksData) ? fakturPajaksData : [],
        pagination: normalizedPagination,
      };
    },
    keepPreviousData: true,
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
};

export default useFakturPajakQuery;

