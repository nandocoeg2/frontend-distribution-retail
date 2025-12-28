import { useQuery, keepPreviousData } from '@tanstack/react-query';
import scheduledPriceService from '../services/scheduledPriceService';

/**
 * Custom hook for fetching scheduled prices with server-side filtering, sorting, and pagination
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @param {Array} params.sorting - Array of sorting objects [{id: 'column', desc: boolean}]
 * @param {Object} params.filters - Filter object {column: value}
 * @param {string} params.globalFilter - Global search term
 * @returns {Object} - Query result with data, isLoading, error, etc.
 */
export const useScheduledPricesQuery = ({
    page = 1,
    limit = 10,
    sorting = [],
    filters = {},
    globalFilter = '',
}) => {
    return useQuery({
        queryKey: ['scheduled-prices', { page, limit, sorting, filters, globalFilter }],
        queryFn: async () => {
            // Build query parameters for backend
            const params = {
                page,
                limit,
            };

            // Add sorting
            if (sorting.length > 0) {
                const sort = sorting[0]; // Take first sort
                params.sortBy = sort.id;
                params.sortOrder = sort.desc ? 'desc' : 'asc';
            }

            // Add column filters - map to backend parameter names
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    // Handle range filters (min/max objects)
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        if (value.min !== undefined && value.min !== '') {
                            params[`${key}_min`] = value.min;
                        }
                        if (value.max !== undefined && value.max !== '') {
                            params[`${key}_max`] = value.max;
                        }
                    } else if (Array.isArray(value)) {
                        // Handle array filters (customerIds, statuses)
                        if (value.length > 0) {
                            params[key] = value;
                        }
                    } else {
                        // Handle text filters and other simple values
                        params[key] = value;
                    }
                }
            });

            // Add global filter
            if (globalFilter) {
                params.q = globalFilter;
            }

            // Call backend API
            // Note: axios interceptor already returns response.data, so response IS the API response body
            // API returns: { success: true, data: [...schedules], pagination: {...} }
            const response = await scheduledPriceService.getAllSchedules(params);

            // Extract schedules and pagination from flat response structure
            const schedulesData = response?.data || [];
            const paginationData = response?.pagination || {
                currentPage: parseInt(page) || 1,
                totalPages: 1,
                totalItems: Array.isArray(schedulesData) ? schedulesData.length : 0,
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
                schedules: Array.isArray(schedulesData) ? schedulesData : [],
                pagination: normalizedPagination,
            };
        },
        placeholderData: keepPreviousData, // React Query v5: Keep previous data while fetching new data
        staleTime: 0, // Always consider data stale to ensure fresh data after mutations
        gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes (renamed from cacheTime in v5)
    });
};

export default useScheduledPricesQuery;
