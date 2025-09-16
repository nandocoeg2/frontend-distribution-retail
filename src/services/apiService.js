import axios from 'axios';
import authService from './authService';

const api = axios.create({
  baseURL: 'http://localhost:5050/api/v1',
});

api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const get = async (url, params) => {
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('API GET Error:', error.response || error.message);
    throw error.response?.data || error;
  }
};

export const post = async (url, data) => {
  try {
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    console.error('API POST Error:', error.response || error.message);
    throw error.response?.data || error;
  }
};

export const put = async (url, data) => {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (error) {
    console.error('API PUT Error:', error.response || error.message);
    throw error.response?.data || error;
  }
};

export const del = async (url) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    console.error('API DELETE Error:', error.response || error.message);
    throw error.response?.data || error;
  }
};

export const groupCustomers = {
  getAll: (params) => get('/group-customers', params),
  getById: (id) => get(`/group-customers/${id}`),
  create: (data) => post('/group-customers', data),
  update: (id, data) => put(`/group-customers/${id}`, data),
  delete: (id) => del(`/group-customers/${id}`),
  search: (query, params) => get(`/group-customers/search/${query}`, params),
};

export default api;
