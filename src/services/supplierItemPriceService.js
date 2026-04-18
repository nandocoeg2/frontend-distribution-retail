import { createApiService } from './apiService';

const baseService = createApiService('supplier-item-prices');

export const supplierItemPriceService = {
  getAll: (page = 1, limit = 10, params = {}) => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    return baseService.getAll(page, limit);
  },

  getAllWithFilters: async (page = 1, limit = 10, filters = {}) => {
    const { default: api } = await import('./apiService');
    const params = { page, limit, ...filters };
    return api.get('/supplier-item-prices', { params });
  },

  getById: (id) => baseService.getById(id),

  create: (data) => baseService.create(data),

  update: (id, data) => baseService.update(id, data),

  delete: (id) => baseService.delete(id),
};

export default supplierItemPriceService;
