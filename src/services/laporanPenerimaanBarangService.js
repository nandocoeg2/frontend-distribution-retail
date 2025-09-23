import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1';

class LaporanPenerimaanBarangService {
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

  async getAllReports(page = 1, limit = 10) {
    try {
      const response = await this.api.get(`/laporan-penerimaan-barang?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching laporan penerimaan barang:', error);
      throw error;
    }
  }

  async getReportById(id) {
    try {
      const response = await this.api.get(`/laporan-penerimaan-barang/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching laporan penerimaan barang detail:', error);
      throw error;
    }
  }

  async createReport(reportData) {
    try {
      const response = await this.api.post('/laporan-penerimaan-barang', reportData);
      return response.data;
    } catch (error) {
      console.error('Error creating laporan penerimaan barang:', error);
      throw error;
    }
  }

  async updateReport(id, reportData) {
    try {
      const response = await this.api.put(`/laporan-penerimaan-barang/${id}`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error updating laporan penerimaan barang:', error);
      throw error;
    }
  }

  async deleteReport(id) {
    try {
      const response = await this.api.delete(`/laporan-penerimaan-barang/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting laporan penerimaan barang:', error);
      throw error;
    }
  }

  async searchReports(query, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams();
      if (query) {
        params.append('q', query);
      }
      params.append('page', page);
      params.append('limit', limit);
      const response = await this.api.get(`/laporan-penerimaan-barang/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching laporan penerimaan barang:', error);
      throw error;
    }
  }
}

export default new LaporanPenerimaanBarangService();
