import { useQuery } from '@tanstack/react-query';
import laporanPenerimaanBarangService from '../services/laporanPenerimaanBarangService';

/**
 * Custom hook for fetching laporan penerimaan barang with server-side filtering, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term
 * @returns {Object} - Query result with data, isLoading, error, etc.
 */
export const useLaporanPenerimaanBarangQuery = ({
  page = 1,
  limit = 10,
  sorting = [],
  filters = {},
  globalFilter = '',
}) => {
  return useQuery({
    queryKey: ['laporanPenerimaanBarang', { page, limit, sorting, filters, globalFilter }],
    queryFn: async () => {
      // If we have filters or globalFilter, use search endpoint
      const hasFilters = Object.keys(filters).length > 0 || globalFilter;
      
      if (hasFilters) {
        const searchCriteria = { ...filters };
        
        // Add global filter as 'q' parameter
        if (globalFilter) {
          searchCriteria.q = globalFilter;
        }
        
        const response = await laporanPenerimaanBarangService.searchReports(
          searchCriteria,
          page,
          limit
        );
        
        // Handle nested response format
        const responseData = response?.data || response;
        const reportsData = responseData?.data || responseData || [];
        const paginationData = responseData?.pagination || {
          currentPage: parseInt(page) || 1,
          totalPages: 1,
          totalItems: Array.isArray(reportsData) ? reportsData.length : 0,
          itemsPerPage: parseInt(limit) || 10,
        };
        
        // Normalize pagination values
        const normalizedPagination = {
          currentPage: parseInt(paginationData.currentPage) || page,
          totalPages: parseInt(paginationData.totalPages) || 1,
          totalItems: parseInt(paginationData.totalItems) || 0,
          itemsPerPage: parseInt(paginationData.itemsPerPage) || limit,
        };
        
        return {
          reports: Array.isArray(reportsData) ? reportsData : [],
          pagination: normalizedPagination,
        };
      }
      
      // Otherwise use getAllReports
      const response = await laporanPenerimaanBarangService.getAllReports(page, limit);
      
      // Handle nested response format
      const responseData = response?.data || response;
      const reportsData = responseData?.data || responseData || [];
      const paginationData = responseData?.pagination || {
        currentPage: parseInt(page) || 1,
        totalPages: 1,
        totalItems: Array.isArray(reportsData) ? reportsData.length : 0,
        itemsPerPage: parseInt(limit) || 10,
      };
      
      // Normalize pagination values
      const normalizedPagination = {
        currentPage: parseInt(paginationData.currentPage) || page,
        totalPages: parseInt(paginationData.totalPages) || 1,
        totalItems: parseInt(paginationData.totalItems) || 0,
        itemsPerPage: parseInt(paginationData.itemsPerPage) || limit,
      };
      
      return {
        reports: Array.isArray(reportsData) ? reportsData : [],
        pagination: normalizedPagination,
      };
    },
    keepPreviousData: true, // Keep previous data while fetching new data
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
  });
};

export default useLaporanPenerimaanBarangQuery;

