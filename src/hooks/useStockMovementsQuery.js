import { useQuery } from '@tanstack/react-query';
import { getStockMovements } from '../services/stockMovementService';
import authService from '../services/authService';

/**
 * Custom hook for fetching stock movements with filtering, sorting, and pagination
 * Defaults to fetching STOCK_IN type movements.
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page (default: 9999 for all records)
 * @param {string} params.type - Stock movement type (default: 'STOCK_IN')
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term
 * @returns {Object} - Query result with data, isLoading, error, etc.
 */
export const useStockMovementsQuery = ({
  page = 1,
  limit = 9999,
  type = 'STOCK_IN',
  sorting = [],
  filters = {},
  globalFilter = '',
} = {}) => {
  const companyId = authService.getCompanyData()?.id;

  return useQuery({
    queryKey: ['stockMovements', { page, limit, type, sorting, filters, globalFilter, companyId }],
    queryFn: async () => {
      // Build query parameters for backend API
      const params = {
        page,
        limit,
        type: type || 'STOCK_IN',
      };

      if (companyId) {
        params.companyId = companyId;
      }

      // Add column filters
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[key] = value;
          }
        });
      }

      // Add global search filter
      if (globalFilter) {
        params.search = globalFilter;
      }

      // Call backend API
      const response = await getStockMovements(params);

      // Handle nested response format: { success: true, data: { data: [...], pagination: {...} } } or array
      const responseData = response?.data || response;
      const movementsData = responseData?.data || responseData || [];
      const paginationData = responseData?.pagination || {
        currentPage: parseInt(page, 10) || 1,
        totalPages: 1,
        totalItems: Array.isArray(movementsData) ? movementsData.length : 0,
        itemsPerPage: parseInt(limit, 10) || 9999,
      };

      const normalizedPagination = {
        currentPage: parseInt(paginationData.currentPage, 10) || page,
        totalPages: parseInt(paginationData.totalPages, 10) || 1,
        totalItems: parseInt(paginationData.totalItems, 10) || (Array.isArray(movementsData) ? movementsData.length : 0),
        itemsPerPage: parseInt(paginationData.itemsPerPage, 10) || limit,
      };

      return {
        movements: Array.isArray(movementsData) ? movementsData : [],
        pagination: normalizedPagination,
      };
    },
    keepPreviousData: true,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
  });
};

/**
 * Dedicated hook for fetching STOCK_OUT type movements
 */
export const useStockOutMovementsQuery = (params = {}) => {
  return useStockMovementsQuery({ ...params, type: 'STOCK_OUT' });
};

export default useStockMovementsQuery;
