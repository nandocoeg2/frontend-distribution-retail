import { createApiService } from './apiService';
import authService from './authService';

const baseService = createApiService('parent-group-customers');
const API_URL = `${process.env.BACKEND_BASE_URL}api/v1/parent-group-customers`;

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

  /**
   * Export parent group customers to Excel
   * @param {string} searchQuery - Optional search query to filter data
   */
  exportExcel: async (searchQuery = '') => {
    const token = authService.getToken();
    const url = searchQuery
      ? `${API_URL}/export-excel/${encodeURIComponent(searchQuery)}`
      : `${API_URL}/export-excel`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to export data';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'ParentGroupCustomers.xlsx';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Convert response to blob and trigger download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);

    return { success: true, filename };
  }
};

export default parentGroupCustomerService;
