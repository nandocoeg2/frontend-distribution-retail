import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1`;

const fileService = {
  downloadFile: async (fileId, fileName) => {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_BASE_URL}/files/download/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return { success: true };
    } catch (error) {
      console.error('Error downloading file:', error);
      return { success: false, error: 'Download failed' };
    }
  },

  uploadBulkPurchaseOrders: async (files, companyId) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const formData = new FormData();

      for (const file of files) {
        formData.append('files', file);
      }

      // Add companyId for validation (must match company from PDF supplier code)
      if (companyId) {
        formData.append('companyId', companyId);
      }

      const response = await axios.post(`${API_BASE_URL}/bulk-purchase-order/bulk`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error uploading bulk files:', error);
      return { success: false, error: error.response?.data?.message || 'Bulk upload failed' };
    }
  },

  uploadBulkPurchaseOrdersTextExtraction: async (files, companyId) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const formData = new FormData();

      for (const file of files) {
        formData.append('files', file);
      }

      // Add companyId for validation (must match company from PDF supplier code)
      if (companyId) {
        formData.append('companyId', companyId);
      }

      const response = await axios.post(`${API_BASE_URL}/bulk-purchase-order/bulk/text-extraction`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error uploading bulk files (text extraction):', error);
      return { success: false, error: error.response?.data?.message || 'Bulk upload failed' };
    }
  },

  uploadFile: async (file, category = 'company_logo') => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'File upload failed'
      };
    }
  },

  getFileUrl: (fileId) => {
    return `${API_BASE_URL}/files/download/${fileId}`;
  },
};

export default fileService;

