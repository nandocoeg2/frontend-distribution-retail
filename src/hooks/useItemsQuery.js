import { useQuery } from '@tanstack/react-query';
import { searchItemsWithFilters } from '../services/itemService';

/**
 * Custom hook for fetching items with server-side filtering, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term
 * @returns {Object} - Query result with data, isLoading, error, etc.
 */
export const useItemsQuery = ({
    page = 1,
    limit = 10,
    sorting = [],
    filters = {},
    globalFilter = '',
}) => {
    return useQuery({
        queryKey: ['items', { page, limit, sorting, filters, globalFilter }],
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
                params.q = globalFilter;
            }

            // Call backend API
            const response = await searchItemsWithFilters(params);

            // Handle nested response format: { success: true, data: { data: [...], pagination: {...} } }
            const responseData = response?.data || response;
            const itemsData = responseData?.data || responseData || [];
            const paginationData = responseData?.pagination || {
                currentPage: parseInt(page) || 1,
                totalPages: 1,
                totalItems: Array.isArray(itemsData) ? itemsData.length : 0,
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
                items: Array.isArray(itemsData) ? itemsData : [],
                pagination: normalizedPagination,
            };
        },
        keepPreviousData: true, // Keep previous data while fetching new data
        staleTime: 0, // Always consider data stale to ensure fresh data after mutations
        cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    });
};

export default useItemsQuery;
