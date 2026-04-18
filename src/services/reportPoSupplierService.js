import { createApiService } from './apiService';
import authService from './authService';

const baseService = createApiService('report-po-suppliers');
const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1/report-po-suppliers`;

export const reportPoSupplierService = {
  getAll: (page = 1, limit = 10) => baseService.getAll(page, limit),

  getById: (id) => baseService.getById(id),

  updateTagihan: async (id, data) => {
    const { put } = await import('./apiService');
    return put(`/report-po-suppliers/${id}/tagihan`, data);
  },

  searchPo: async (q = '') => {
    const { get } = await import('./apiService');
    const res = await get(`/report-po-suppliers/search-po`, { q });
    return res?.data?.data || res?.data || [];
  },

  getByMovementId: async (movementId) => {
    const { get } = await import('./apiService');
    const res = await get(`/report-po-suppliers/by-movement/${movementId}`);
    return res?.data?.data || res?.data || null;
  },

  exportExcel: async (searchQuery = '') => {
    const token = authService.getToken();
    const url = searchQuery
      ? `${API_BASE_URL}/export-excel?q=${encodeURIComponent(searchQuery)}`
      : `${API_BASE_URL}/export-excel`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: { message: 'Failed to export data' } }));
      throw new Error(errorData.error?.message || 'Failed to export data');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'Report_PO_Suppliers.xlsx';

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
  },
};

export default reportPoSupplierService;
