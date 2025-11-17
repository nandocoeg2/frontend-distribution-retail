import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL_DEV}api/v1/bank-mutation`;

const sanitizeQueryParams = (params = {}) => {
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
        .map((item) => {
          if (item === null || item === undefined) {
            return null;
          }
          if (typeof item === 'string') {
            const trimmedItem = item.trim();
            return trimmedItem === '' ? null : trimmedItem;
          }
          return item;
        })
        .filter((item) => item !== null);

      if (filtered.length > 0) {
        sanitized[key] = filtered;
      }
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
};

const serializeParams = (params = {}) => {
  const sanitized = sanitizeQueryParams(params);
  const searchParams = new URLSearchParams();

  Object.entries(sanitized).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined) {
          searchParams.append(key, item);
        }
      });
      return;
    }

    if (value instanceof Date) {
      searchParams.append(key, value.toISOString());
      return;
    }

    searchParams.append(key, value);
  });

  return searchParams.toString();
};

class MutasiBankService {
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
        config.headers.Authorization = 'Bearer ' + token;
      }
      return config;
    });
  }

  async listMutations(params = {}) {
    try {
      const response = await this.api.get('/', {
        params,
        paramsSerializer: serializeParams,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bank mutations:', error);
      throw error;
    }
  }

  async getMutationById(id) {
    if (!id) {
      throw new Error('Mutation ID is required');
    }

    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank mutation detail:', error);
      throw error;
    }
  }

  async validateMutation(id, payload = {}) {
    if (!id) {
      throw new Error('Mutation ID is required');
    }

    if (!payload.status) {
      throw new Error('Validation status is required');
    }

    try {
      const response = await this.api.post(`/${id}/validate`, payload);
      return response.data;
    } catch (error) {
      console.error('Error validating bank mutation:', error);
      throw error;
    }
  }

  async uploadMutationFile({ file } = {}) {
    if (!file) {
      throw new Error('File is required');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading bank mutation file:', error);
      throw error;
    }
  }

  async assignDocument(id, payload = {}) {
    if (!id) {
      throw new Error('Mutation ID is required');
    }

    if (!payload.invoicePenagihanId) {
      throw new Error('Invoice Penagihan ID is required');
    }

    try {
      const response = await this.api.post(`/${id}/assign-document`, payload);
      return response.data;
    } catch (error) {
      console.error('Error assigning document to bank mutation:', error);
      throw error;
    }
  }

  async unassignDocument(id) {
    if (!id) {
      throw new Error('Mutation ID is required');
    }

    try {
      const response = await this.api.post(`/${id}/unassign-document`);
      return response.data;
    } catch (error) {
      console.error('Error unassigning document from bank mutation:', error);
      throw error;
    }
  }
}

const mutasiBankService = new MutasiBankService();

export default mutasiBankService;
