import { get, post, del } from './apiService';

const API_URL = '/returns';

export const getReturns = (params = {}) => {
  return get(API_URL, params);
};

export const getReturnById = (id) => {
  return get(`${API_URL}/${id}`);
};

export const createReturn = (data) => {
  return post(API_URL, data);
};

export const classifyReturn = (id, action) => {
  return post(`${API_URL}/${id}/classify`, { action });
};

export const deleteReturn = (id) => {
  return del(`${API_URL}/${id}`);
};

export default {
  getReturns,
  getReturnById,
  createReturn,
  classifyReturn,
  deleteReturn,
};
