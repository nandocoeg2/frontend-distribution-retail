import apiService from './apiService';

/**
 * Service for fetching audit trails
 */

/**
 * Get paginated audit trails for any entity
 * @param {string} tableName - The entity table name (e.g., 'PurchaseOrder', 'Packing')
 * @param {string} recordId - The record ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getAuditTrails = async (tableName, recordId, page = 1, limit = 10) => {
    const response = await apiService.get(
        `/audit-trails/${tableName}/${recordId}`,
        {
            params: { page, limit },
        }
    );
    return response.data;
};

/**
 * Get more audit trails for an entity (convenience method for "Load More" button)
 * @param {string} tableName - The entity table name
 * @param {string} recordId - The record ID
 * @param {number} currentCount - Current number of audit trails displayed
 * @param {number} limit - Number of additional items to load
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const loadMoreAuditTrails = async (tableName, recordId, currentCount, limit = 10) => {
    const page = Math.floor(currentCount / limit) + 1;
    return getAuditTrails(tableName, recordId, page, limit);
};

export default {
    getAuditTrails,
    loadMoreAuditTrails,
};
