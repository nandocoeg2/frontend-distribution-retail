import { createApiService, get, post, put, del } from './apiService';
import authService from './authService';

const baseService = createApiService('item-price-schedules');
const API_URL = `${process.env.BACKEND_BASE_URL}api/v1/item-price-schedules`;

const parseErrorMessage = async (response, fallback) => {
  try {
    const data = await response.json();
    return data.message || data.error || fallback;
  } catch {
    return fallback;
  }
};

const scheduledPriceService = {
  ...baseService,

  // Get all schedules with pagination and filters
  getAllSchedules: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.itemPriceId) searchParams.set('itemPriceId', params.itemPriceId);
    if (params.effectiveDateFrom) searchParams.set('effectiveDateFrom', params.effectiveDateFrom);
    if (params.effectiveDateTo) searchParams.set('effectiveDateTo', params.effectiveDateTo);

    return get(`/item-price-schedules?${searchParams.toString()}`);
  },

  // Search schedules
  searchSchedules: (query, page = 1, limit = 10, filters = {}) => {
    return post('/item-price-schedules/search', {
      query,
      page,
      limit,
      filters
    });
  },

  // Get schedule by ID
  getScheduleById: (id) => {
    return baseService.getById(id);
  },

  // Create new schedule
  createSchedule: (data) => {
    return baseService.create(data);
  },

  // Update schedule
  updateSchedule: (id, data) => {
    return baseService.update(id, data);
  },

  // Delete schedule
  deleteSchedule: (id) => {
    return baseService.delete(id);
  },

  // Cancel schedule
  cancelSchedule: (id, reason) => {
    return patch(`/item-price-schedules/${id}/cancel`, { reason });
  },

  // Get schedules by ItemPrice ID
  getSchedulesByItemPrice: (itemPriceId) => {
    return get(`/item-price-schedules/item-price/${itemPriceId}`);
  },

  // Get effective price for a specific date and item
  getEffectivePrice: (itemId, date) => {
    const dateStr = date instanceof Date ? date.toISOString() : date;
    return get('/item-price-schedules/effective-price', {
      itemId,
      date: dateStr
    });
  },

  // ==================== BULK UPLOAD METHODS ====================

  // Download bulk template
  downloadBulkTemplate: async () => {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/bulk/template`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to download template');
      throw new Error(errorMessage);
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'Scheduled_Price_Template.xlsx';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Convert response to blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, filename };
  },

  // Upload bulk scheduled prices
  uploadBulkSchedules: async (file) => {
    const token = authService.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/bulk/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to upload file');
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Get bulk upload status
  getBulkUploadStatus: async (bulkId) => {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/bulk/status/${bulkId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to get upload status');
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Get all bulk files
  getAllBulkFiles: async (status) => {
    const token = authService.getToken();
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`${API_URL}/bulk/files${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to get bulk files');
      throw new Error(errorMessage);
    }

    return response.json();
  }
};

export default scheduledPriceService;
