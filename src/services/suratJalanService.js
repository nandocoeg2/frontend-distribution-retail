import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1`;

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

  async exportSuratJalan(suratJalanId, companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/surat-jalan/${suratJalanId}/export?companyId=${companyId}`,
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
        throw new Error(errorData.message || 'Failed to export surat jalan');
      }

      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error exporting surat jalan:', error);
      throw error;
    }
  }

  async exportSuratJalanPaket(suratJalanId, companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/surat-jalan/${suratJalanId}/export-paket?companyId=${companyId}`,
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
        throw new Error(errorData.message || 'Failed to export surat jalan paket');
      }

      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Error exporting surat jalan paket:', error);
      throw error;
    }
  }

  async unprocessSuratJalan(ids) {
    try {
      const response = await this.api.post('/surat-jalan/unprocess', { ids });
      return response.data;
    } catch (error) {
      console.error('Error unprocessing surat jalan:', error);
      throw error;
    }
  }

  async cancelSuratJalan(id) {
    try {
      const response = await this.api.post(`/surat-jalan/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling surat jalan:', error);
      throw error;
    }
  }

  /**
   * Export surat jalan to Excel
   * @param {Object} filters - Optional filters matching table filters
   */
  async exportExcel(filters = {}) {
    try {
      const token = authService.getToken();
      const params = new URLSearchParams();

      // Add filters to query params
      if (filters.no_surat_jalan) params.append('no_surat_jalan', filters.no_surat_jalan);
      if (filters.po_number) params.append('po_number', filters.po_number);
      if (filters.no_invoice) params.append('no_invoice', filters.no_invoice);
      if (filters.deliver_to) params.append('deliver_to', filters.deliver_to);
      if (filters.status_code) params.append('status_code', filters.status_code);
      if (filters.is_printed !== undefined && filters.is_printed !== '') {
        params.append('is_printed', filters.is_printed);
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_BASE_URL}/surat-jalan/export-excel?${queryString}`
        : `${API_BASE_URL}/surat-jalan/export-excel`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to export data');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Surat_Jalan.xlsx';

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
      console.error('Error exporting surat jalan to Excel:', error);
      throw error;
    }
  }
}

export default new SuratJalanService();

