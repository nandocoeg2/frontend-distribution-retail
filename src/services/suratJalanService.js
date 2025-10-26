import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1';

class SuratJalanService {
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

  // Unified endpoint with support for pagination, sorting, and filtering
  async getSuratJalan(params = {}) {
    try {
      // Support both old (page, limit) and new (params object) signatures
      if (typeof params === 'number') {
        const page = params;
        const limit = typeof arguments[1] !== 'undefined' ? arguments[1] : 10;
        return this.api.get('/surat-jalan', { params: { page, limit } }).then(res => res.data);
      }
      
      // New params object signature with support for sorting and filtering
      const response = await this.api.get('/surat-jalan', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching surat jalan:', error);
      throw error;
    }
  }

  // Legacy method - redirects to getSuratJalan for backward compatibility
  async getAllSuratJalan(page = 1, limit = 10) {
    return this.getSuratJalan({ page, limit });
  }

  async getSuratJalanById(id) {
    try {
      const response = await this.api.get(`/surat-jalan/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching surat jalan:', error);
      throw error;
    }
  }

  // Legacy method - redirects to getSuratJalan for backward compatibility
  async searchSuratJalan(searchParams, page = 1, limit = 10) {
    const params = { page, limit, ...searchParams };
    return this.getSuratJalan(params);
  }

  async createSuratJalan(suratJalanData) {
    try {
      const response = await this.api.post('/surat-jalan', suratJalanData);
      return response.data;
    } catch (error) {
      console.error('Error creating surat jalan:', error);
      throw error;
    }
  }

  async updateSuratJalan(id, updateData) {
    try {
      const response = await this.api.put(`/surat-jalan/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating surat jalan:', error);
      throw error;
    }
  }

  async deleteSuratJalan(id) {
    try {
      const response = await this.api.delete(`/surat-jalan/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting surat jalan:', error);
      throw error;
    }
  }

  async processSuratJalan(data = {}) {
    try {
      const payload = Array.isArray(data)
        ? { ids: data }
        : typeof data === 'object' && data !== null
          ? data
          : { ids: [] };

      const response = await this.api.post('/surat-jalan/process', payload);
      return response.data;
    } catch (error) {
      console.error('Error processing surat jalan:', error);
      throw error;
    }
  }
}

export default new SuratJalanService();
