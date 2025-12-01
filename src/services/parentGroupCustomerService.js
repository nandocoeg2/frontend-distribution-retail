import { createApiService } from './apiService';

const baseService = createApiService('parent-group-customers');

export const parentGroupCustomerService = {
  ...baseService,

  // Get all parent group customers (paginated)
  getAllParentGroupCustomers: (page = 1, limit = 10) => {
    return baseService.getAll(page, limit);
  },

  // Get all parent group customers without pagination (for dropdowns)
  getAllForDropdown: async () => {
    try {
      const result = await baseService.getAll(1, 100); // Get all records (max 100)
      return result;
    } catch (error) {
      console.error('Error fetching parent group customers:', error);
      throw error;
    }
  },

  // Create parent group customer
  createParentGroupCustomer: (data) => {
    return baseService.create(data);
  },

  // Update parent group customer
  updateParentGroupCustomer: (id, data) => {
    return baseService.update(id, data);
  },

  // Delete parent group customer
  deleteParentGroupCustomer: (id) => {
    return baseService.delete(id);
  },

  // Get by ID
  getParentGroupCustomerById: (id) => {
    return baseService.getById(id);
  },

  // Search parent group customers
  searchParentGroupCustomers: (query, page = 1, limit = 10) => {
    return baseService.search(query, page, limit);
  },
};

export default parentGroupCustomerService;
