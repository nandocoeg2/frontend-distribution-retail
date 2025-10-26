import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1/tanda-terima-faktur';

class TandaTerimaFakturService {
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

  async getAll(page = 1, limit = 10) {
    try {
      const response = await this.api.get('/', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tanda terima faktur list:', error);
      throw error;
    }
  }

  async getTandaTerimaFaktur(params = {}) {
    try {
      // Support both old (page, limit) and new (params object) signatures
      if (typeof params === 'number') {
        const page = params;
        const limit = typeof arguments[1] !== 'undefined' ? arguments[1] : 10;
        return this.getAll(page, limit);
      }

      // Check if we need to use search endpoint (has filters other than page/limit)
      const { page = 1, limit = 10, ...otherParams } = params;
      const hasFilters = Object.keys(otherParams).length > 0;

      if (hasFilters) {
        // Use search endpoint for filtering
        return this.search(otherParams, page, limit);
      }

      // Use regular getAll for simple pagination
      return this.getAll(page, limit);
    } catch (error) {
      console.error('Error fetching tanda terima faktur:', error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tanda terima faktur detail:', error);
      throw error;
    }
  }

  async create(payload) {
    try {
      const response = await this.api.post('/', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating tanda terima faktur:', error);
      throw error;
    }
  }

  async update(id, payload) {
    try {
      const response = await this.api.put(`/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating tanda terima faktur:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting tanda terima faktur:', error);
      throw error;
    }
  }

  async search(searchParams = {}, page = 1, limit = 10) {
    try {
      let params = searchParams;

      if (typeof searchParams === 'string' && searchParams.trim()) {
        params = { code_supplier: searchParams.trim() };
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
      console.error('Error searching tanda terima faktur:', error);
      throw error;
    }
  }
}

export default new TandaTerimaFakturService();
