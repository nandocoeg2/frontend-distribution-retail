import { get, post, put, del } from './apiService';

const API_URL = '/packings';

// Get all packings with pagination
export const getPackings = (page = 1, limit = 10) => {
  return get(API_URL, { page, limit });
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

