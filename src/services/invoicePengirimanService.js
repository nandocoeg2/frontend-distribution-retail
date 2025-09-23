import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1/invoice-pengiriman';

class InvoicePengirimanService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAllInvoicePengiriman(page = 1, limit = 10) {
    try {
      const response = await this.api.get('/', {
        params: { page, limit }
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

  async deleteInvoicePengiriman(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice pengiriman:', error);
      throw error;
    }
  }
}

export default new InvoicePengirimanService();
