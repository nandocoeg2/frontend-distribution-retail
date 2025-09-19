import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1';

class CustomerService {
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

  async getAllCustomers(page = 1, limit = 10) {
    try {
      const response = await this.api.get(`/customers?page=${page}&limit=${limit}`);
      return {
        data: response.data.data.customers,
        pagination: response.data.data.pagination
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async searchCustomers(query, page = 1, limit = 10) {
    try {
      const url = `/customers/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`;
      const response = await this.api.get(url);
      return {
        data: response.data.data.customers,
        pagination: response.data.data.pagination,
        searchQuery: response.data.data.searchQuery
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async getCustomerById(id) {
    try {
      const response = await this.api.get(`/customers/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching customer with id ${id}:`, error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async createCustomer(customerData) {
    try {
      const response = await this.api.post('/customers', customerData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async updateCustomer(id, customerData) {
    try {
      const response = await this.api.put(`/customers/${id}`, customerData);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating customer with id ${id}:`, error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async deleteCustomer(id) {
    try {
      const response = await this.api.delete(`/customers/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error deleting customer with id ${id}:`, error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
}

export default new CustomerService();

