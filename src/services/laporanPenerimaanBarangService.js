import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1`;

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

  async searchReports(criteria = '', page = 1, limit = 10) {
    try {
      const params = new URLSearchParams();
      const isObjectCriteria =
        criteria && typeof criteria === 'object' && !Array.isArray(criteria);

      if (isObjectCriteria) {
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

          params.append(key, value);
        });
      } else if (typeof criteria === 'string' && criteria.trim()) {
        params.append('q', criteria.trim());
      }

      params.set('page', page);
      params.set('limit', limit);
      const queryString = params.toString();
      const response = await this.api.get(
        '/laporan-penerimaan-barang/search' + (queryString ? '?' + queryString : '')
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

  async completeReports(ids = []) {
    try {
      const payloadIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
      if (!payloadIds.length) {
        throw new Error('Minimal satu ID laporan diperlukan untuk diselesaikan');
      }

      const response = await this.api.patch(
        '/laporan-penerimaan-barang/complete',
        { ids: payloadIds }
      );
      return response.data;
    } catch (error) {
      console.error('Error completing laporan penerimaan barang:', error);
      throw error;
    }
  }

  async assignPurchaseOrder(lpbId, purchaseOrderId) {
    try {
      if (!lpbId) {
        throw new Error('ID laporan penerimaan barang diperlukan');
      }
      if (!purchaseOrderId) {
        throw new Error('ID purchase order diperlukan');
      }

      const response = await this.api.patch(
        '/laporan-penerimaan-barang/' + lpbId + '/assign-purchase-order',
        { purchaseOrderId }
      );
      return response.data;
    } catch (error) {
      console.error('Error assigning purchase order to LPB:', error);
      throw error;
    }
  }

  async unassignPurchaseOrder(lpbId) {
    try {
      if (!lpbId) {
        throw new Error('ID laporan penerimaan barang diperlukan');
      }

      const response = await this.api.patch(
        '/laporan-penerimaan-barang/' + lpbId + '/unassign-purchase-order'
      );
      return response.data;
    } catch (error) {
      console.error('Error unassigning purchase order from LPB:', error);
      throw error;
    }
  }

  async exportLPB(lpbId) {
    try {
      if (!lpbId) {
        throw new Error('ID laporan penerimaan barang diperlukan');
      }

      const response = await this.api.get(
        '/laporan-penerimaan-barang/' + lpbId + '/export',
        {
          responseType: 'blob',
        }
      );

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'lpb-file.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      return {
        blob: response.data,
        filename: filename,
        contentType: response.headers['content-type'],
      };
    } catch (error) {
      console.error('Error exporting LPB file:', error);
      throw error;
    }
  }

  /**
   * Upload bulk LPB files using Text Extraction (alternative to AI conversion)
   * @param {Object} params - Upload parameters
   * @param {File[]|FileList} params.files - Files to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadBulkReportsTextExtraction({ files } = {}) {
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

      const response = await this.api.post(
        '/laporan-penerimaan-barang/bulk-text-extraction',
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
        'Error uploading LPB bulk files with text extraction:',
        error
      );
      throw error;
    }
  }

  /**
   * Retry a failed LPB file using Text Extraction
   * @param {string} fileId - ID of the file to retry
   * @returns {Promise<Object>} Retry result
   */
  async retryFileTextExtraction(fileId) {
    try {
      if (!fileId) {
        throw new Error('File ID is required');
      }

      const response = await this.api.post(
        '/laporan-penerimaan-barang/retry-file-text-extraction/' + fileId
      );
      return response.data;
    } catch (error) {
      console.error('Error retrying LPB file with text extraction:', error);
      throw error;
    }
  }

  /**
   * Retry a failed LPB file using AI conversion
   * @param {string} fileId - ID of the file to retry
   * @returns {Promise<Object>} Retry result
   */
  async retryFile(fileId) {
    try {
      if (!fileId) {
        throw new Error('File ID is required');
      }

      const response = await this.api.post(
        '/laporan-penerimaan-barang/retry-file-ai/' + fileId
      );
      return response.data;
    } catch (error) {
      console.error('Error retrying LPB file:', error);
      throw error;
    }
  }

  /**
   * Get bulk file by ID
   * @param {string} fileId - ID of the file to fetch
   * @returns {Promise<Object>} File details
   */
  async getFileById(fileId) {
    try {
      if (!fileId) {
        throw new Error('File ID is required');
      }

      const response = await this.api.get(
        '/laporan-penerimaan-barang/bulk-file/' + fileId
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching LPB bulk file:', error);
      throw error;
    }
  }

}

export default new LaporanPenerimaanBarangService();
