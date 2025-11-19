import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1/faktur-pajak`;

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
   * 
   * API Documentation:
   * - Endpoint: GET /api/v1/faktur-pajak
   * - Response: { success: true, data: { data: [...], pagination: {...}, meta: {...} } }
   * - invoicePenagihan is returned as an array (one-to-many relationship)
   * - Field names: ppnRupiah (not ppn_rp), dasar_pengenaan_pajak
   * 
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.sortBy - Sort field (default: 'createdAt')
   * @param {string} params.sortOrder - Sort order 'asc'|'desc' (default: 'desc')
   * @param {string} params.search - Global search (searches no_pajak and customer name)
   * @param {string} params.no_pajak - Filter by faktur number (partial match)
   * @param {string} params.customerId - Filter by customer ID (exact match)
   * @param {string} params.customer - Filter by customer name (partial match)
   * @param {string} params.statusId - Filter by status ID (exact match)
   * @param {string} params.tanggal_invoice - Filter by specific date (YYYY-MM-DD)
   * @param {string} params.tanggal_start - Filter by date range start (YYYY-MM-DD)
   * @param {string} params.tanggal_end - Filter by date range end (YYYY-MM-DD)
   * @returns {Promise} Response with data and pagination
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
      // API returns 204 No Content, return success indicator
      return { success: true, status: response.status };
    } catch (error) {
      console.error('Error deleting faktur pajak:', error);
      throw error;
    }
  }

  /**
   * Upload e-Faktur DJP Evidence (PDF)
   * Upload PDF evidence file from CoreTax DJP after e-Faktur validation
   * 
   * API Documentation:
   * - Endpoint: POST /api/v1/faktur-pajak/:id/upload-evidence
   * - Content-Type: multipart/form-data
   * - File must be PDF format only
   * - Response: { success: true, data: { filename, path, size, ... } }
   * 
   * @param {string} id - Faktur Pajak ID
   * @param {File} file - PDF file from CoreTax DJP
   * @returns {Promise} Upload result with file metadata
   */
  async uploadEvidencePdf(id, file) {
    try {
      // Validate file type
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed for e-Faktur DJP evidence');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post(`/${id}/upload-evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading e-Faktur evidence:', error);
      throw error;
    }
  }

  /**
   * Export e-Faktur DJP (XML format)
   * Exports faktur pajak data in DJP-compliant XML format for tax reporting
   * 
   * API Documentation:
   * - Endpoint: GET /api/v1/faktur-pajak/export
   * - Response Type: XML (application/xml) or JSON (application/json)
   * - XML format follows DJP TaxInvoice.xsd schema
   * 
   * @param {Object} params - Export parameters
   * @param {string} params.companyId - Filter by company ID (optional)
   * @param {string} params.customerId - Filter by customer ID (optional)
   * @param {string} params.statusId - Filter by status ID (optional)
   * @param {string} params.tanggal_start - Start date (YYYY-MM-DD) (optional)
   * @param {string} params.tanggal_end - End date (YYYY-MM-DD) (optional)
   * @param {string} params.format - Export format: 'xml' or 'json' (default: 'json')
   * @returns {Promise} Blob response for download
   */
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
