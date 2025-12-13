import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1/kwitansi`;

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

  async exportKwitansi(kwitansiId, companyId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/${kwitansiId}/export?companyId=${companyId}`,
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
        throw new Error(errorData.error?.message || 'Failed to export kwitansi');
      }

      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error exporting kwitansi:', error);
      throw error;
    }
  }

  async exportKwitansiPaket(kwitansiId, companyId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/${kwitansiId}/export-paket?companyId=${companyId}`,
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
        throw new Error(errorData.error?.message || 'Failed to export kwitansi paket');
      }

      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error exporting kwitansi paket:', error);
      throw error;
    }
  }

  async exportKwitansiPaketBulk(ids, companyId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/export/paket/bulk`,
        {
          method: 'POST',
          headers: {
            'Accept': 'text/html',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ ids, companyId }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to export bulk kwitansi paket');
      }

      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error exporting bulk kwitansi paket:', error);
      throw error;
    }
  }

  async exportKwitansiBulk(ids, companyId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/export/bulk`,
        {
          method: 'POST',
          headers: {
            'Accept': 'text/html',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ ids, companyId }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to export bulk kwitansi');
      }

      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error exporting bulk kwitansi:', error);
      throw error;
    }
  }

  /**
   * Export kwitansi to Excel
   * @param {Object} filters - Optional filter parameters from the table
   */
  async exportExcel(filters = {}) {
    try {
      const token = localStorage.getItem('token');

      // Build query string from filters
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(`${key}[]`, v));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      const queryString = queryParams.toString();
      const url = queryString
        ? `${API_BASE_URL}/export-excel?${queryString}`
        : `${API_BASE_URL}/export-excel`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to export data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (e) {
          // Response is not JSON
        }
        throw new Error(errorMessage);
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Kwitansi.xlsx';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      return { success: true, filename };
    } catch (error) {
      console.error('Error exporting kwitansi to Excel:', error);
      throw error;
    }
  }
}

export default new KwitansiService();

