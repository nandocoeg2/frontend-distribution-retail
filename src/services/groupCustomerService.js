import { createApiService } from './apiService';

const baseService = createApiService('group-customers');

export const groupCustomerService = {
  ...baseService,

  // Alias untuk getAll dengan nama yang lebih spesifik
  getAllGroupCustomers: (page = 1, limit = 10) => {
    return baseService.getAll(page, limit);
  },

  // Alias untuk create
  createGroupCustomer: (data) => {
    return baseService.create(data);
  },

  // Alias untuk update
  updateGroupCustomer: (id, data) => {
    return baseService.update(id, data);
  },

  // Alias untuk delete
  deleteGroupCustomer: (id) => {
    return baseService.delete(id);
  },

  // Alias untuk getById
  getGroupCustomerById: (id) => {
    return baseService.getById(id);
  }
};

export default groupCustomerService;
