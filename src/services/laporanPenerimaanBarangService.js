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
        config.headers.Authorization = 'Bearer ' + token;
      }
      return config;
    });
  }

  async getAllReports(page = 1, limit = 10) {
    try {
      const response = await this.api.get(
        '/laporan-penerimaan-barang?page=' + page + '&limit=' + limit
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching laporan penerimaan barang:', error);
      throw error;
    }
  }

  async getReportById(id) {
    try {
      const response = await this.api.get('/laporan-penerimaan-barang/' + id);
      return response.data;
    } catch (error) {
      console.error('Error fetching laporan penerimaan barang detail:', error);
      throw error;
    }
  }

  async createReport(reportData) {
    try {
      const response = await this.api.post(
        '/laporan-penerimaan-barang',
        reportData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating laporan penerimaan barang:', error);
      throw error;
    }
  }

  async updateReport(id, reportData) {
    try {
      const response = await this.api.put(
        '/laporan-penerimaan-barang/' + id,
        reportData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating laporan penerimaan barang:', error);
      throw error;
    }
  }

  async deleteReport(id) {
    try {
      const response = await this.api.delete('/laporan-penerimaan-barang/' + id);
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
      const response = await this.api.get(
        '/laporan-penerimaan-barang/search?' + params.toString()
      );
      return response.data;
    } catch (error) {
      console.error('Error searching laporan penerimaan barang:', error);
      throw error;
    }
  }

  async uploadFromFile({ file, prompt } = {}) {
    try {
      if (!file) {
        throw new Error('File is required');
      }

      const formData = new FormData();
      formData.append('file', file);

      if (prompt) {
        formData.append('prompt', prompt);
      }

      const response = await this.api.post(
        '/laporan-penerimaan-barang/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading laporan penerimaan barang file:', error);
      throw error;
    }
  }

  async uploadBulkReports({ files, prompt } = {}) {
    try {
      const fileList = Array.isArray(files)
        ? files
        : files && typeof files.length === 'number'
        ? Array.from(files)
        : [];

      if (!fileList.length) {
        throw new Error('Files are required');
      }

      const formData = new FormData();
      fileList.forEach((file) => {
        if (file) {
          formData.append('files', file);
        }
      });

      if (prompt) {
        formData.append('prompt', prompt);
      }

      const response = await this.api.post(
        '/laporan-penerimaan-barang/bulk',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        'Error uploading laporan penerimaan barang bulk files:',
        error
      );
      throw error;
    }
  }

  async getBulkStatus(bulkId) {
    try {
      if (!bulkId) {
        throw new Error('Bulk ID is required');
      }

      const response = await this.api.get(
        '/laporan-penerimaan-barang/bulk-status/' + bulkId
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching laporan penerimaan barang bulk status:', error);
      throw error;
    }
  }

  async getBulkFiles({ status } = {}) {
    try {
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }
      const query = params.toString();
      const url = '/laporan-penerimaan-barang/bulk-files' + (query ? '?' + query : '');
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching laporan penerimaan barang bulk files:', error);
      throw error;
    }
  }
  async processReports(ids = []) {
    try {
      const payloadIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
      if (!payloadIds.length) {
        throw new Error('Minimal satu ID laporan diperlukan untuk diproses');
      }

      const response = await this.api.patch(
        '/laporan-penerimaan-barang/process',
        { ids: payloadIds }
      );
      return response.data;
    } catch (error) {
      console.error('Error processing laporan penerimaan barang:', error);
      throw error;
    }
  }

}

export default new LaporanPenerimaanBarangService();
