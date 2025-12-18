import api from './apiService';

const BASE_URL = '/item-name-group-customers';

const itemNameGroupCustomerService = {
    /**
     * Get all item name group customers with pagination
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number
     * @param {number} params.limit - Items per page
     * @param {string} params.itemId - Filter by item ID
     * @param {string} params.groupCustomerId - Filter by group customer ID
     */
    getAll: async (params = {}) => {
        const response = await api.get(BASE_URL, { params });
        return response.data;
    },

    /**
     * Get by ID
     * @param {string} id - Item name group customer ID
     */
    getById: async (id) => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Get all names for a specific item
     * @param {string} itemId - Item ID
     */
    getByItemId: async (itemId) => {
        const response = await api.get(`${BASE_URL}/item/${itemId}`);
        return response.data;
    },

    /**
     * Get all item names for a specific group customer
     * @param {string} groupCustomerId - Group customer ID
     */
    getByGroupCustomerId: async (groupCustomerId) => {
        const response = await api.get(`${BASE_URL}/group-customer/${groupCustomerId}`);
        return response.data;
    },

    /**
     * Create new item name for group customer
     * @param {Object} data - Create data
     * @param {string} data.itemId - Item ID
     * @param {string} data.groupCustomerId - Group customer ID
     * @param {string} data.nama_barang - Custom name for this group
     */
    create: async (data) => {
        const response = await api.post(BASE_URL, data);
        return response.data;
    },

    /**
     * Update item name
     * @param {string} id - Item name group customer ID
     * @param {Object} data - Update data
     * @param {string} data.nama_barang - Updated name
     */
    update: async (id, data) => {
        const response = await api.put(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    /**
     * Delete item name mapping
     * @param {string} id - Item name group customer ID
     */
    delete: async (id) => {
        const response = await api.delete(`${BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Bulk upsert names for an item
     * @param {Object} data - Bulk upsert data
     * @param {string} data.itemId - Item ID
     * @param {Array} data.names - Array of { groupCustomerId, nama_barang }
     */
    bulkUpsert: async (data) => {
        const response = await api.post(`${BASE_URL}/bulk-upsert`, data);
        return response.data;
    },
};

export default itemNameGroupCustomerService;
