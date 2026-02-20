import { get, post, put, del } from './apiService';

const API_URL = '/packings';

// Get all packings with pagination and optional filters
export const getPackings = function (params = {}) {
  // Support both old (page, limit) and new (params object) signatures
  if (typeof params === 'number') {
    const page = params;
    const limit = typeof arguments[1] !== 'undefined' ? arguments[1] : 10;
    return get(API_URL, { page, limit });
  }

  // New params object signature
  // If params is empty or only has page/limit, use it directly
  // Otherwise, it's a filter object
  return get(API_URL, params);
};

// Get packing by ID
export const getPackingById = (id) => {
  return get(`${API_URL}/${id}`);
};

// Create new packing
export const createPacking = (packingData) => {
  return post(API_URL, packingData);
};

// Update packing by ID
export const updatePacking = (id, packingData) => {
  return put(`${API_URL}/${id}`, packingData);
};

// Delete packing by ID
export const deletePacking = (id) => {
  return del(`${API_URL}/${id}`);
};

// Search packings by status
export const searchPackingsByStatus = (statusId, page = 1, limit = 10) => {
  return get(`${API_URL}/search`, { page, limit, statusId });
};

// Enhanced search function that supports multiple search fields
export const searchPackings = (query, field, page = 1, limit = 10) => {
  const params = { page, limit };
  params[field] = query;
  return get(`${API_URL}/search`, params);
};

// Advanced search with multiple filters
export const searchPackingsAdvanced = (filters = {}, page = 1, limit = 10) => {
  const params = { page, limit, ...filters };
  return get(`${API_URL}/search`, params);
};

// Process packing - change status from PENDING PACKING to PROCESSING PACKING
export const processPackings = (ids) => {
  return post(`${API_URL}/process`, { ids });
};

// Complete packing - change status from PROCESSING PACKING to COMPLETED PACKING
export const completePackings = (ids) => {
  return post(`${API_URL}/complete`, { ids });
};

// Bulk update tanggal packing
export const bulkUpdateTanggalPacking = (ids, tanggal_packing) => {
  return post(`${API_URL}/bulk-update-tanggal`, { ids, tanggal_packing });
};

// Export packings to Excel
export const exportExcel = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');

    // Convert object filters to URLSearchParams
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(value => params.append(key, value));
        } else {
          params.append(key, filters[key]);
        }
      }
    });

    const queryString = params.toString();
    const url = `${process.env.BACKEND_BASE_URL}api/v1${API_URL}/export?${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to export data');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'Packings.xlsx';

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
    console.error('Error exporting packings:', error);
    throw error;
  }
};

// Export packing sticker to HTML for printing
export const exportPackingSticker = async (packingId, companyId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.BACKEND_BASE_URL}api/v1${API_URL}/${packingId}/export-sticker?companyId=${companyId}`,
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
      throw new Error(errorData.error?.message || 'Failed to export sticker');
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error exporting packing sticker:', error);
    throw error;
  }
};

// Export bulk packing sticker to HTML for printing
export const exportPackingStickerBulk = async (ids, companyId, printerType = 'type1') => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.BACKEND_BASE_URL}api/v1${API_URL}/export-sticker/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/html',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ ids, companyId, printerType }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to export sticker bulk');
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error exporting bulk packing sticker:', error);
    throw error;
  }
};

// Export packing tanda terima to HTML for printing
export const exportPackingTandaTerima = async (packingId, companyId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.BACKEND_BASE_URL}api/v1${API_URL}/${packingId}/export-tanda-terima?companyId=${companyId}`,
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
      throw new Error(errorData.error?.message || 'Failed to export tanda terima');
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error exporting packing tanda terima:', error);
    throw error;
  }
};

// Export bulk packing tanda terima to HTML for printing
export const exportPackingTandaTerimaBulk = async (ids, companyId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.BACKEND_BASE_URL}api/v1${API_URL}/export-tanda-terima/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/html',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ ids, companyId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to export tanda terima bulk');
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error exporting bulk packing tanda terima:', error);
    throw error;
  }
};

// Export packing tanda terima grouped to HTML for printing
export const exportPackingTandaTerimaGrouped = async (packingId, companyId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.BACKEND_BASE_URL}api/v1${API_URL}/${packingId}/export-tanda-terima-grouped?companyId=${companyId}`,
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
      throw new Error(errorData.error?.message || 'Failed to export tanda terima grouped');
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error exporting packing tanda terima grouped:', error);
    throw error;
  }
};

// Export bulk packing tanda terima grouped to HTML for printing
export const exportPackingTandaTerimaGroupedBulk = async (ids, companyId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.BACKEND_BASE_URL}api/v1${API_URL}/export-tanda-terima-grouped/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/html',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ ids, companyId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to export tanda terima grouped bulk');
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error exporting bulk packing tanda terima grouped:', error);
    throw error;
  }
};

export default {
  getPackings,
  getPackingById,
  createPacking,
  updatePacking,
  deletePacking,
  searchPackingsByStatus,
  searchPackings,
  searchPackingsAdvanced,
  processPackings,
  completePackings,
  bulkUpdateTanggalPacking,
  exportPackingSticker,
  exportPackingStickerBulk,
  exportPackingTandaTerima,
  exportPackingTandaTerimaBulk,
  exportPackingTandaTerimaGrouped,
  exportPackingTandaTerimaGroupedBulk,
  exportExcel,
};
