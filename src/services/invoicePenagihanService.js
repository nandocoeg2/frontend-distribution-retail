import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1/invoice-penagihan`;

class InvoicePenagihanService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAllInvoicePenagihan(page = 1, limit = 10) {
    try {
      const response = await this.api.get('/', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice penagihan:', error);
      throw error;
    }
  }

  async createInvoicePenagihan(invoiceData) {
    try {
      const response = await this.api.post('/', invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice penagihan:', error);
      throw error;
    }
  }

  async getInvoicePenagihanById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice penagihan by id:', error);
      throw error;
    }
  }

  async searchInvoicePenagihan(searchParams = {}, page = 1, limit = 10) {
    try {
      const response = await this.api.get('/search', {
        params: {
          ...searchParams,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching invoice penagihan:', error);
      throw error;
    }
  }

  async updateInvoicePenagihan(id, updateData) {
    try {
      const response = await this.api.put(`/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating invoice penagihan:', error);
      throw error;
    }
  }

  async deleteInvoicePenagihan(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice penagihan:', error);
      throw error;
    }
  }

  async generateTandaTerimaFaktur(id, overrides = {}) {
    try {
      const response = await this.api.post(
        `/${id}/generate-tanda-terima-faktur`,
        overrides
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error generating tanda terima faktur from invoice penagihan:',
        error
      );
      throw error;
    }
  }

  async cancelInvoicePenagihan(id) {
    try {
      const response = await this.api.post(`/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling invoice penagihan:', error);
      throw error;
    }
  }

  async exportExcelInvoicePenagihan(filters = {}) {
    try {
      const response = await this.api.get('/export-excel', {
        params: filters,
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'Invoice_Penagihan.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error('Error exporting invoice penagihan to Excel:', error);
      throw error;
    }
  }
}

export default new InvoicePenagihanService();
