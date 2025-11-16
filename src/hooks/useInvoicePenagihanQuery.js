import { useQuery } from '@tanstack/react-query';
import invoicePenagihanService from '../services/invoicePenagihanService';

/**
 * Custom hook for fetching invoice penagihan with server-side filtering, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term
 * @returns {Object} - Query result with data, isLoading, error, etc.
 */
export const useInvoicePenagihanQuery = ({
  page = 1,
  limit = 10,
  sorting = [],
  filters = {},
  globalFilter = '',
}) => {
  return useQuery({
    queryKey: ['invoicePenagihan', { page, limit, sorting, filters, globalFilter }],
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
          // Handle range filter (start/end) for no_invoice_penagihan
          if (key === 'no_invoice_penagihan' && typeof value === 'object') {
            if (value.start) {
              params['no_invoice_penagihan_start'] = value.start;
            }
            if (value.end) {
              params['no_invoice_penagihan_end'] = value.end;
            }
          } else {
            params[key] = value;
          }
        }
      });

      // Add global filter
      if (globalFilter) {
        params.search = globalFilter;
      }

      // Call backend API - if filters exist, use search, otherwise get all
      const hasFilters = Object.keys(filters).length > 0 || globalFilter;
      const response = hasFilters
        ? await invoicePenagihanService.searchInvoicePenagihan(params, page, limit)
        : await invoicePenagihanService.getAllInvoicePenagihan(page, limit);

      // Handle nested response format: { success: true, data: { data: [...], pagination: {...} } }
      const responseData = response?.data || response;
      const invoicesData = responseData?.data || responseData || [];
      const paginationData = responseData?.pagination || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(invoicesData) ? invoicesData.length : 0,
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
        invoices: Array.isArray(invoicesData) ? invoicesData : [],
        pagination: normalizedPagination,
      };
    },
    keepPreviousData: true, // Keep previous data while fetching new data
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
};

/**
 * Custom hook for fetching invoice penagihan by status (for tabs)
 */
export const useInvoicePenagihanByStatus = ({
  statusCode,
  page = 1,
  limit = 10,
}) => {
  return useQuery({
    queryKey: ['invoicePenagihan', 'status', statusCode, { page, limit }],
    queryFn: async () => {
      const params = {
        page,
        limit,
      };

      if (statusCode) {
        params.status_code = statusCode;
      }

      const response = statusCode
        ? await invoicePenagihanService.searchInvoicePenagihan(params, page, limit)
        : await invoicePenagihanService.getAllInvoicePenagihan(page, limit);

      // Handle nested response format: { success: true, data: { data: [...], pagination: {...} } }
      const responseData = response?.data || response;
      const invoicesData = responseData?.data || responseData || [];
      const paginationData = responseData?.pagination || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(invoicesData) ? invoicesData.length : 0,
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
        invoices: Array.isArray(invoicesData) ? invoicesData : [],
        pagination: normalizedPagination,
      };
    },
    keepPreviousData: true,
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
};

export default useInvoicePenagihanQuery;

