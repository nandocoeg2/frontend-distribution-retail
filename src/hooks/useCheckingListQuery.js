import { useQuery } from '@tanstack/react-query';
import checkingListService from '../services/checkingListService';

/**
 * Custom hook for fetching checklist surat jalan with server-side filtering, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term
 * @returns {Object} - Query result with data, isLoading, error, etc.
 */
export const useCheckingListQuery = ({
  page = 1,
  limit = 10,
  sorting = [],
  filters = {},
  globalFilter = '',
}) => {
  return useQuery({
    queryKey: ['checkingList', { page, limit, sorting, filters, globalFilter }],
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

      // Determine if we need to use search or getAllChecklists
      const hasFilters = Object.keys(filters).length > 0 || globalFilter;
      
      // Call backend API
      const response = hasFilters
        ? await checkingListService.searchChecklists(params, page, limit)
        : await checkingListService.getAllChecklists(page, limit);

      // Handle nested response format: { success: true, data: { checklistSuratJalans: [...], pagination: {...} } }
      const responseData = response?.data || response;
      const checklistsData = 
        responseData?.checklistSuratJalans || 
        responseData?.data || 
        responseData || 
        [];
      const paginationData = responseData?.pagination || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(checklistsData) ? checklistsData.length : 0,
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
        checklists: Array.isArray(checklistsData) ? checklistsData : [],
        pagination: normalizedPagination,
      };
    },
    keepPreviousData: true, // Keep previous data while fetching new data
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
};

export default useCheckingListQuery;

