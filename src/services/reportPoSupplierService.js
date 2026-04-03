import { createApiService } from './apiService';

const baseService = createApiService('report-po-suppliers');

export const reportPoSupplierService = {
  ...baseService,

  // Get all report PO suppliers (paginated)
  getAllReportPoSuppliers: (page = 1, limit = 10) => {
    return baseService.getAll(page, limit);
  },

  // Get report PO supplier by ID
  getReportPoSupplierById: (id) => {
    return baseService.getById(id);
  },

  // Create report PO supplier
  createReportPoSupplier: (data) => {
    return baseService.create(data);
  },

  // Update report PO supplier
  updateReportPoSupplier: (id, data) => {
    return baseService.update(id, data);
  },

  // Delete report PO supplier
  deleteReportPoSupplier: (id) => {
    return baseService.delete(id);
  },
};

export default reportPoSupplierService;
