import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1/tanda-terima-faktur`;

const sanitizeParams = (params = {}) => {
  const sanitized = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        sanitized[key] = trimmed;
      }
      return;
    }

    if (Array.isArray(value)) {
      const filtered = value
        .map((item) => (typeof item === 'string' ? item.trim() : item))
        .filter((item) => {
          if (item === null || item === undefined) {
            return false;
          }

          if (typeof item === 'string') {
            return item.trim() !== '';
          }

          return true;
        });

      if (filtered.length > 0) {
        sanitized[key] = filtered;
      }
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
};

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

  async getAll(pageOrParams = 1, limit = 10, filters = {}) {
    try {
      let params;

      if (typeof pageOrParams === 'object' && pageOrParams !== null) {
        params = { ...pageOrParams };
      } else {
        params = { page: pageOrParams, limit, ...filters };
      }

      if (params.page === undefined || params.page === null) {
        params.page = 1;
      }

      if (params.limit === undefined || params.limit === null) {
        params.limit = limit;
      }

      const response = await this.api.get('/', {
        params: sanitizeParams(params),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tanda terima faktur list:', error);
      throw error;
    }
  }

  async getTandaTerimaFaktur(params = {}) {
    try {
      if (typeof params === 'number') {
        const page = params;
        const limit = typeof arguments[1] !== 'undefined' ? arguments[1] : 10;
        const extra = typeof arguments[2] === 'object' ? arguments[2] : {};
        return this.getAll(page, limit, extra);
      }

      return this.getAll(params);
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
        params = { search: searchParams.trim() };
      }

      const mergedParams = {
        ...(typeof params === 'object' && params !== null ? params : {}),
        page,
        limit,
      };

      return this.getAll(mergedParams);
    } catch (error) {
      console.error('Error searching tanda terima faktur:', error);
      throw error;
    }
  }

  async assignDocuments(id, payload = {}) {
    try {
      const response = await this.api.post(`/${id}/assign-documents`, payload);
      return response.data;
    } catch (error) {
      console.error('Error assigning documents to tanda terima faktur:', error);
      throw error;
    }
  }

  async unassignDocuments(id, payload = {}) {
    try {
      const response = await this.api.post(
        `/${id}/unassign-documents`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error unassigning documents from tanda terima faktur:',
        error
      );
      throw error;
    }
  }

  async getGrouped(params = {}) {
    try {
      const response = await this.api.get('/grouped', {
        params: sanitizeParams(params),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching grouped tanda terima faktur:', error);
      throw error;
    }
  }

  async getGroupedDetail(groupCustomerId, params = {}) {
    try {
      const response = await this.api.get(
        `/grouped/${groupCustomerId}/detail`,
        {
          params: sanitizeParams(params),
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error fetching grouped tanda terima faktur detail:',
        error
      );
      throw error;
    }
  }

  async exportByGroup(params = {}) {
    try {
      const token = authService.getToken();
      const queryParams = new URLSearchParams(sanitizeParams(params)).toString();
      const response = await fetch(
        `${API_BASE_URL}/export?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/html',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error?.message || 'Failed to export tanda terima faktur');
      }

      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error exporting tanda terima faktur by group:', error);
      throw error;
    }
  }

  async bulkUpload(groupCustomerId, file, processingMethod = 'ai') {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = authService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/bulk-upload/${groupCustomerId}?processingMethod=${processingMethod}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.message || 'Failed to upload TTF document');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading TTF document:', error);
      throw error;
    }
  }
}

export default new TandaTerimaFakturService();
