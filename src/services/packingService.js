import { get, post, put, del } from './apiService';

const API_URL = '/packings';

// Get all packings with pagination and optional filters
export const getPackings = function(params = {}) {
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

// Export packing sticker to HTML for printing
export const exportPackingSticker = async (packingId, companyId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.BACKEND_BASE_URL_LOCAL}api/v1${API_URL}/${packingId}/export-sticker?companyId=${companyId}`,
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

// Export packing tanda terima to HTML for printing
export const exportPackingTandaTerima = async (packingId, companyId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.BACKEND_BASE_URL_LOCAL}api/v1${API_URL}/${packingId}/export-tanda-terima?companyId=${companyId}`,
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
  exportPackingSticker,
  exportPackingTandaTerima,
};
