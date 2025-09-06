import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1';

class SupplierService {
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

  async getAllSuppliers(page = 1, limit = 10) {
    try {
      const response = await this.api.get(`/suppliers?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  async searchSuppliers(query, page = 1, limit = 10) {
    try {
      const response = await this.api.get(`/suppliers/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error searching suppliers:', error);
      throw error;
    }
  }
}

export default new SupplierService();
