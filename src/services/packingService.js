import { get } from './apiService';

const API_URL = '/packings';

export const getPackings = (page = 1, limit = 10) => {
  return get(API_URL, { page, limit });
};

export const getPackingById = (id) => {
  return get(`${API_URL}/${id}`);
};

export const searchPackingsByStatus = (statusId, page = 1, limit = 10) => {
  return get(`${API_URL}/search`, { page, limit, statusId });
};

