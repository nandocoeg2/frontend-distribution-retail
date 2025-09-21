import { createApiService } from './apiService';

const baseService = createApiService('customers');

const customerService = {
  ...baseService,
  
  // Alias untuk create dengan nama yang lebih spesifik
  createCustomer: (data) => {
    return baseService.create(data);
  },
  
  // Alias untuk update dengan nama yang lebih spesifik
  updateCustomer: (id, data) => {
    return baseService.update(id, data);
  },
  
  // Alias untuk delete dengan nama yang lebih spesifik
  deleteCustomer: (id) => {
    return baseService.delete(id);
  },
  
  // Alias untuk getById dengan nama yang lebih spesifik
  getCustomerById: (id) => {
    return baseService.getById(id);
  },
  
  // Alias untuk getAll dengan nama yang lebih spesifik
  getAllCustomers: (page = 1, limit = 10) => {
    return baseService.getAll(page, limit);
  }
};

export default customerService;
