import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1/kwitansi';

class KwitansiService {
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

  async getAllKwitansi(page = 1, limit = 10) {
    try {
      const response = await this.api.get('/', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching kwitansi:', error);
      throw error;
    }
  }

  async getKwitansiById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching kwitansi by id:', error);
      throw error;
    }
  }

  async createKwitansi(payload) {
    try {
      const response = await this.api.post('/', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating kwitansi:', error);
      throw error;
    }
  }

  async updateKwitansi(id, payload) {
    try {
      const response = await this.api.put(`/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating kwitansi:', error);
      throw error;
    }
  }

  async deleteKwitansi(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting kwitansi:', error);
      throw error;
    }
  }

  async searchKwitansi(searchParams = {}, page = 1, limit = 10) {
    try {
      let params = searchParams;

      if (
        searchParams &&
        typeof searchParams === 'string' &&
        searchParams.trim()
      ) {
        params = { no_kwitansi: searchParams.trim() };
      }

      const response = await this.api.get('/search', {
        params: {
          ...params,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching kwitansi:', error);
      throw error;
    }
  }
}

export default new KwitansiService();
