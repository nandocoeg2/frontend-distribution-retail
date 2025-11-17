import { createApiService } from './apiService';
import authService from './authService';

const baseService = createApiService('group-customers');
const API_URL = `${process.env.BACKEND_BASE_URL_LOCAL}api/v1/group-customers`;

const extractErrorMessage = (errorData, fallbackMessage) => {
  if (!errorData) {
    return fallbackMessage;
  }

  if (typeof errorData === 'string' && errorData.trim()) {
    return errorData;
  }

  if (typeof errorData.message === 'string' && errorData.message.trim()) {
    return errorData.message;
  }

  if (typeof errorData.error === 'string' && errorData.error.trim()) {
    return errorData.error;
  }

  if (errorData.error && typeof errorData.error.message === 'string' && errorData.error.message.trim()) {
    return errorData.error.message;
  }

  if (Array.isArray(errorData.errors) && errorData.errors.length) {
    const firstError = errorData.errors[0];

    if (typeof firstError === 'string' && firstError.trim()) {
      return firstError;
    }

    if (firstError && typeof firstError.message === 'string' && firstError.message.trim()) {
      return firstError.message;
    }
  }

  return fallbackMessage;
};

const parseErrorMessage = async (response, fallbackMessage) => {
  try {
    const errorData = await response.json();
    return extractErrorMessage(errorData, fallbackMessage);
  } catch (error) {
    return fallbackMessage;
  }
};

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
  },

  // Bulk Upload Methods
  downloadBulkTemplate: async () => {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/bulk/template`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to download template');
      throw new Error(errorMessage);
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'GroupCustomer_Template.xlsx';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Convert response to blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, filename };
  },

  uploadBulkGroupCustomer: async (file) => {
    const token = authService.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/bulk/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to upload file');
      throw new Error(errorMessage);
    }

    return response.json();
  },

  getBulkUploadStatus: async (bulkId) => {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/bulk/status/${bulkId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to get bulk upload status');
      throw new Error(errorMessage);
    }

    return response.json();
  },

  getAllBulkFiles: async (status = null) => {
    const token = authService.getToken();
    const url = status 
      ? `${API_URL}/bulk/files?status=${encodeURIComponent(status)}`
      : `${API_URL}/bulk/files`;
      
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to get bulk files');
      throw new Error(errorMessage);
    }

    return response.json();
  }
};

export default groupCustomerService;
