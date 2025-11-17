import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL_LOCAL}api/v1/faktur-pajak`;

class FakturPajakService {
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

  /**
   * Get all faktur pajak with unified filtering, sorting, and pagination
   * Supports all parameters: page, limit, sortBy, sortOrder, filters, and global search
   * This replaces the deprecated /search endpoint
   */
  async getAllFakturPajak(params = {}) {
    try {
      // Normalize parameters
      const normalizedParams = { ...params };

      // Ensure page and limit have default values
      if (!normalizedParams.page) normalizedParams.page = 1;
      if (!normalizedParams.limit) normalizedParams.limit = 10;

      const response = await this.api.get('/', {
        params: normalizedParams,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching faktur pajak:', error);
      throw error;
    }
  }

  /**
   * @deprecated Use getAllFakturPajak() instead. The /search endpoint is deprecated.
   * This method is kept for backward compatibility but now calls getAllFakturPajak.
   */
  async searchFakturPajak(searchParams = {}, page = 1, limit = 10) {
    console.warn(
      'searchFakturPajak is deprecated. Use getAllFakturPajak with parameters instead.'
    );

    try {
      let params = searchParams;
      if (typeof searchParams === 'string' && searchParams.trim()) {
        params = { no_pajak: searchParams.trim() };
      }

      // Use unified endpoint instead of deprecated /search
      return await this.getAllFakturPajak({
        ...params,
        page,
        limit,
      });
    } catch (error) {
      console.error('Error searching faktur pajak:', error);
      throw error;
    }
  }

  async getFakturPajakById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching faktur pajak detail:', error);
      throw error;
    }
  }

  async createFakturPajak(payload) {
    try {
      const response = await this.api.post('/', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating faktur pajak:', error);
      throw error;
    }
  }

  async updateFakturPajak(id, payload) {
    try {
      const response = await this.api.put(`/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating faktur pajak:', error);
      throw error;
    }
  }

  async deleteFakturPajak(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting faktur pajak:', error);
      throw error;
    }
  }

  async exportFakturPajak(params = {}) {
    try {
      const sanitizedParams = Object.entries(params || {}).reduce(
        (acc, [key, value]) => {
          if (value === null || value === undefined) {
            return acc;
          }

          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed !== '') {
              acc[key] = trimmed;
            }
            return acc;
          }

          acc[key] = value;
          return acc;
        },
        {}
      );

      const format =
        typeof sanitizedParams.format === 'string' &&
        sanitizedParams.format.trim().length > 0
          ? sanitizedParams.format.trim().toLowerCase()
          : 'json';

      sanitizedParams.format = format;

      const response = await this.api.get('/export', {
        params: sanitizedParams,
        headers: {
          Accept: format === 'xml' ? 'application/xml' : 'application/json',
        },
        responseType: 'blob',
      });

      return response;
    } catch (error) {
      console.error('Error exporting faktur pajak:', error);
      throw error;
    }
  }
}

export default new FakturPajakService();
