import { createApiService } from './apiService';

const baseService = createApiService('report-po-suppliers');

export const reportPoSupplierService = {
  // Get all report PO suppliers (paginated)
  getAll: (page = 1, limit = 10) => {
    return baseService.getAll(page, limit);
  },

  // Get report PO supplier by ID
  getById: (id) => {
    return baseService.getById(id);
  },
};

export default reportPoSupplierService;
