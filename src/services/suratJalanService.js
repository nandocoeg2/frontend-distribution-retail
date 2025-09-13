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

  async getAllSuratJalan(page = 1, limit = 10) {
    try {
      const response = await this.api.get(`/surat-jalan?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching surat jalan:', error);
      throw error;
    }
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

  async searchSuratJalan(searchParams, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams(searchParams);
      params.append('page', page);
      params.append('limit', limit);
      const response = await this.api.get(`/surat-jalan/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching surat jalan:', error);
      throw error;
    }
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
}

export default new SuratJalanService();
