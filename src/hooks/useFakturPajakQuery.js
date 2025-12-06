import { useQuery } from '@tanstack/react-query';
import fakturPajakService from '../services/fakturPajakService';

/**
 * Custom hook for fetching faktur pajak with server-side filtering, sorting, and pagination
 * Uses the unified GET / endpoint that supports all features (filtering, sorting, global search)
 *
 * API Response Structure:
 * {
 *   success: true,
 *   data: {
 *     data: [...], // Array of faktur pajak objects
 *     pagination: { currentPage, totalPages, totalItems, itemsPerPage },
 *     meta: { queryTime, appliedFilters, appliedSort }
 *   }
 * }
 *
 * Key Fields (from API):
 * - ppnRupiah (PPN in rupiah)
 * - dasar_pengenaan_pajak (DPP)
 * - invoicePenagihan (array) - One-to-many relationship
 * - status.status_code - Status code field
 *
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term (searches no_pajak and customer name)
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
      // Build query parameters for unified endpoint
      const params = {
        page,
        limit,
      };

      // Add sorting (default: createdAt desc)
      if (sorting.length > 0) {
        const sort = sorting[0]; // Take first sort for now
        params.sortBy = sort.id;
        params.sortOrder = sort.desc ? 'desc' : 'asc';
      } else {
        // Default sorting from API docs
        params.sortBy = 'createdAt';
        params.sortOrder = 'desc';
      }

      // Add column filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Handle array values (multi-select filters)
          if (Array.isArray(value) && value.length > 0) {
            params[key] = value;
          }
          // Handle object values (range filters) - these should already be mapped by getQueryParams
          else if (typeof value === 'object' && !Array.isArray(value)) {
            // Skip objects as they should be flattened by getQueryParams
          }
          // Handle primitive values
          else if (!Array.isArray(value)) {
            params[key] = value;
          }
        }
      });

      // Add global filter (searches in no_pajak and customer.namaCustomer)
      if (globalFilter) {
        params.search = globalFilter;
      }

      // Call unified endpoint (GET /) that supports all features
      const response = await fakturPajakService.getAllFakturPajak(params);

      // Handle nested response format: { success: true, data: { data: [...], pagination: {...} } }
      const responseData = response?.data || response;
      const fakturPajaksData =
        responseData?.data || responseData?.fakturPajaks || responseData || [];
      const paginationData = responseData?.pagination || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(fakturPajaksData)
          ? fakturPajaksData.length
          : 0,
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
 * Uses the unified GET / endpoint with status filter
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
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      // Add status filter if provided
      if (statusCode) {
        params.status_code = statusCode;
      }

      // Use unified endpoint (GET /)
      const response = await fakturPajakService.getAllFakturPajak(params);

      // Handle nested response format: { success: true, data: { data: [...], pagination: {...} } }
      const responseData = response?.data || response;
      const fakturPajaksData =
        responseData?.data || responseData?.fakturPajaks || responseData || [];
      const paginationData = responseData?.pagination || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(fakturPajaksData)
          ? fakturPajaksData.length
          : 0,
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
