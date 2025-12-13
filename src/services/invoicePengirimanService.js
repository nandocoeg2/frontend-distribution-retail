import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1/invoice-pengiriman`;

// Custom params serializer that repeats keys for arrays (no [] notation)
const serializeParams = (params) => {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== '') {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
        }
      });
    } else if (typeof value === 'object') {
      // Handle nested objects (e.g., date ranges)
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue !== undefined && subValue !== null && subValue !== '') {
          parts.push(`${encodeURIComponent(subKey)}=${encodeURIComponent(subValue)}`);
        }
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join('&');
};

class InvoicePengirimanService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      paramsSerializer: serializeParams
    });

    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAllInvoicePengiriman(params = {}) {
    try {
      // Support both old (page, limit) and new (params object) signatures
      if (typeof params === 'number') {
        const page = params;
        const limit = typeof arguments[1] !== 'undefined' ? arguments[1] : 10;
        const response = await this.api.get('/', {
          params: { page, limit }
        });
        return response.data;
      }

      // New params object signature
      const response = await this.api.get('/', {
        params: params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice pengiriman:', error);
      throw error;
    }
  }

  async createInvoicePengiriman(invoiceData) {
    try {
      const response = await this.api.post('/', invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice pengiriman:', error);
      throw error;
    }
  }

  async getInvoicePengirimanById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice pengiriman by id:', error);
      throw error;
    }
  }

  async searchInvoicePengiriman(searchParams = {}, page = 1, limit = 10) {
    try {
      const response = await this.api.get('/search', {
        params: {
          ...searchParams,
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching invoice pengiriman:', error);
      throw error;
    }
  }

  async updateInvoicePengiriman(id, updateData) {
    try {
      const response = await this.api.put(`/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating invoice pengiriman:', error);
      throw error;
    }
  }

  async createInvoicePenagihan(id, payload = {}) {
    try {
      const response = await this.api.post(`/${id}/create-penagihan`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice penagihan from invoice pengiriman:', error);
      throw error;
    }
  }

  async deleteInvoicePengiriman(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice pengiriman:', error);
      throw error;
    }
  }

  async generateInvoicePenagihan(id) {
    try {
      const response = await this.api.post(`/${id}/generate-invoice-penagihan`);
      return response.data;
    } catch (error) {
      console.error('Error generating invoice penagihan:', error);
      throw error;
    }
  }

  async exportInvoicePengiriman(id) {
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_BASE_URL}/${id}/export`, {
        headers: {
          'Accept': 'text/html',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting invoice pengiriman:', error);
      throw error;
    }
  }

  async exportExcel(filters = {}) {
    try {
      const token = authService.getToken();
      const queryString = serializeParams(filters);
      const url = queryString ? `${API_BASE_URL}/export-excel?${queryString}` : `${API_BASE_URL}/export-excel`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to export data');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Invoice_Pengiriman.xlsx';
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
    } catch (error) {
      console.error('Error exporting invoice pengiriman to Excel:', error);
      throw error;
    }
  }
}

export default new InvoicePengirimanService();
