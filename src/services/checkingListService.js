import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1';
const RESOURCE_PATH = '/checklist-surat-jalan';

class CheckingListService {
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

  buildSearchParams(criteria = {}, page, limit) {
    const params = new URLSearchParams();

    if (criteria && typeof criteria === 'object') {
      Object.entries(criteria).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          return;
        }

        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '') {
            return;
          }
          params.append(key, trimmed);
          return;
        }

        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== null && item !== undefined) {
              params.append(key, item);
            }
          });
          return;
        }

        params.append(key, value);
      });
    }

    if (typeof page === 'number') {
      params.set('page', page);
    }
    if (typeof limit === 'number') {
      params.set('limit', limit);
    }

    return params;
  }

  async getAllChecklists(page = 1, limit = 10) {
    try {
      const response = await this.api.get(
        `${RESOURCE_PATH}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching checklist surat jalan:', error);
      throw error;
    }
  }

  async searchChecklists(criteria = {}, page = 1, limit = 10) {
    try {
      const params = this.buildSearchParams(criteria, page, limit);
      const queryString = params.toString();
      const response = await this.api.get(
        `${RESOURCE_PATH}/search${queryString ? `?${queryString}` : ''}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching checklist surat jalan:', error);
      throw error;
    }
  }

  async getChecklistById(id) {
    try {
      const response = await this.api.get(`${RESOURCE_PATH}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching checklist surat jalan detail:', error);
      throw error;
    }
  }

  async getChecklistsBySuratJalanId(suratJalanId) {
    try {
      const response = await this.api.get(
        `${RESOURCE_PATH}/by-surat-jalan/${suratJalanId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error fetching checklist surat jalan by surat jalan id:',
        error
      );
      throw error;
    }
  }

  async createChecklist(payload) {
    try {
      const response = await this.api.post(RESOURCE_PATH, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating checklist surat jalan:', error);
      throw error;
    }
  }

  async updateChecklist(id, payload) {
    try {
      const response = await this.api.put(`${RESOURCE_PATH}/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating checklist surat jalan:', error);
      throw error;
    }
  }

  async deleteChecklist(id) {
    try {
      const response = await this.api.delete(`${RESOURCE_PATH}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting checklist surat jalan:', error);
      throw error;
    }
  }

  async exportCheckingList(checklistId, companyId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}${RESOURCE_PATH}/${checklistId}/export?companyId=${companyId}`,
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error?.message || 'Failed to export checklist';
        throw new Error(errorMessage);
      }

      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error exporting checklist surat jalan:', error);
      throw error;
    }
  }

  async exportCheckingListGrouped(checklistId, companyId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}${RESOURCE_PATH}/${checklistId}/export-grouped?companyId=${companyId}`,
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error?.message || 'Failed to export checklist grouped';
        throw new Error(errorMessage);
      }

      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error exporting checklist surat jalan grouped:', error);
      throw error;
    }
  }
}

export default new CheckingListService();
