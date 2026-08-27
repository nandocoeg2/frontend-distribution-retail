import { useQuery } from '@tanstack/react-query';
import laporanPenerimaanBarangService from '../services/laporanPenerimaanBarangService';
import authService from '../services/authService';

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
  const activeCompanyId = authService.getCompanyData()?.id;

  return useQuery({
    queryKey: ['laporanPenerimaanBarang', { page, limit, sorting, filters, globalFilter, companyId: activeCompanyId }],
    queryFn: async () => {
      // If we have filters, globalFilter, or activeCompanyId, use search endpoint
      const hasFilters = Object.keys(filters).length > 0 || globalFilter || activeCompanyId;
      
      if (hasFilters) {
        const searchCriteria = { ...filters };
        if (activeCompanyId && !searchCriteria.companyId) {
          searchCriteria.companyId = activeCompanyId;
        }
        
        // Handle special status_code value for showing all including completed
        if (searchCriteria.status_code === '__ALL__') {
          delete searchCriteria.status_code;
          searchCriteria.includeCompleted = true;
        }

        // Handle multi-select no_lpb (array)
        if (searchCriteria.no_lpb && Array.isArray(searchCriteria.no_lpb)) {
          if (searchCriteria.no_lpb.length === 0) {
            delete searchCriteria.no_lpb;
          } else {
            searchCriteria.no_lpb = searchCriteria.no_lpb.join(',');
          }
        }

        // Handle multi-select po_number (array)
        if (searchCriteria.po_number && Array.isArray(searchCriteria.po_number)) {
          if (searchCriteria.po_number.length === 0) {
            delete searchCriteria.po_number;
          } else {
            searchCriteria.po_number = searchCriteria.po_number.join(',');
          }
        }

        // Handle multi-select no_po_pengganti (array)
        if (searchCriteria.no_po_pengganti && Array.isArray(searchCriteria.no_po_pengganti)) {
          if (searchCriteria.no_po_pengganti.length === 0) {
            delete searchCriteria.no_po_pengganti;
          } else {
            searchCriteria.no_po_pengganti = searchCriteria.no_po_pengganti.join(',');
          }
        }

        // Handle multi-select invoice (array)
        if (searchCriteria.invoice && Array.isArray(searchCriteria.invoice)) {
          if (searchCriteria.invoice.length === 0) {
            delete searchCriteria.invoice;
          } else {
            searchCriteria.invoice = searchCriteria.invoice.join(',');
          }
        }

        // Handle multi-select customerIds (array)
        if (searchCriteria.customerIds && Array.isArray(searchCriteria.customerIds)) {
          if (searchCriteria.customerIds.length === 0) {
            delete searchCriteria.customerIds;
          } else {
            searchCriteria.customerIds = searchCriteria.customerIds.join(',');
          }
        }

        // Handle multi-select status_codes (array)
        if (searchCriteria.status_codes && Array.isArray(searchCriteria.status_codes)) {
          if (searchCriteria.status_codes.length === 0) {
            // Empty array means show active (exclude completed), backend default behavior
            delete searchCriteria.status_codes;
          } else {
            searchCriteria.status_codes = searchCriteria.status_codes.join(',');
          }
        }

        // Handle date range filter (tanggal_po with from/to)
        if (searchCriteria.tanggal_po && typeof searchCriteria.tanggal_po === 'object') {
          if (searchCriteria.tanggal_po.from) {
            searchCriteria.tanggal_po_from = searchCriteria.tanggal_po.from;
          }
          if (searchCriteria.tanggal_po.to) {
            searchCriteria.tanggal_po_to = searchCriteria.tanggal_po.to;
          }
          delete searchCriteria.tanggal_po;
        }

        // Handle grandtotal_lpb filter (min/max)
        if (searchCriteria.grandtotal_lpb && typeof searchCriteria.grandtotal_lpb === 'object') {
          if (searchCriteria.grandtotal_lpb.min) {
            searchCriteria.grandtotal_lpb_min = searchCriteria.grandtotal_lpb.min;
          }
          if (searchCriteria.grandtotal_lpb.max) {
            searchCriteria.grandtotal_lpb_max = searchCriteria.grandtotal_lpb.max;
          }
          delete searchCriteria.grandtotal_lpb;
        }

        // Handle grandtotal_invoice filter (min/max)
        if (searchCriteria.grandtotal_invoice && typeof searchCriteria.grandtotal_invoice === 'object') {
          if (searchCriteria.grandtotal_invoice.min) {
            searchCriteria.grandtotal_invoice_min = searchCriteria.grandtotal_invoice.min;
          }
          if (searchCriteria.grandtotal_invoice.max) {
            searchCriteria.grandtotal_invoice_max = searchCriteria.grandtotal_invoice.max;
          }
          delete searchCriteria.grandtotal_invoice;
        }
        
        // Add global filter as 'q' parameter
        if (globalFilter) {
          searchCriteria.q = globalFilter;
        }

        // Add sorting parameters
        if (sorting && sorting.length > 0) {
          const sort = sorting[0];
          searchCriteria.sortBy = sort.id;
          searchCriteria.sortOrder = sort.desc ? 'desc' : 'asc';
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
      
      // Otherwise use getAllReports with sorting
      const sortCriteria = {};
      if (sorting && sorting.length > 0) {
        const sort = sorting[0];
        sortCriteria.sortBy = sort.id;
        sortCriteria.sortOrder = sort.desc ? 'desc' : 'asc';
      }
      
      // If sorting is provided, use search endpoint to apply it
      if (Object.keys(sortCriteria).length > 0) {
        const response = await laporanPenerimaanBarangService.searchReports(
          sortCriteria,
          page,
          limit
        );
        const responseData = response?.data || response;
        const reportsData = responseData?.data || responseData || [];
        const paginationData = responseData?.pagination || {
          currentPage: parseInt(page) || 1,
          totalPages: 1,
          totalItems: Array.isArray(reportsData) ? reportsData.length : 0,
          itemsPerPage: parseInt(limit) || 10,
        };
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

      const response = await laporanPenerimaanBarangService.getAllReports(page, limit, activeCompanyId);
      
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
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
};

export default useLaporanPenerimaanBarangQuery;

