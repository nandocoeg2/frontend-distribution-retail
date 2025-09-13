import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1';

class InvoiceService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Add a request interceptor to include the auth token
    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAllInvoices(page = 1, limit = 10) {
    try {
      const response = await this.api.get(`/invoices?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async getInvoiceById(id) {
    try {
      const response = await this.api.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  async searchInvoices(searchParams, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams(searchParams);
      params.append('page', page);
      params.append('limit', limit);
      const response = await this.api.get(`/invoices/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching invoices:', error);
      throw error;
    }
  }

  async updateInvoice(id, updateData) {
    try {
      const response = await this.api.put(`/invoices/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id) {
    try {
      const response = await this.api.delete(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }
}

export default new InvoiceService();
