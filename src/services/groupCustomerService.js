import { createApiService } from './apiService';

const baseService = createApiService('group-customers');

export const groupCustomerService = {
  ...baseService,
  
  // Alias untuk getAll dengan nama yang lebih spesifik
  getAllGroupCustomers: (page = 1, limit = 10) => {
    return baseService.getAll(page, limit);
  }
};

export default groupCustomerService;
