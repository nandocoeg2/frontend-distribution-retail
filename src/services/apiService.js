import axios from 'axios';
import toastService from './toastService';

const API_BASE_URL = 'http://localhost:5050/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    // The individual service calls will handle the specific data structure
    return response.data;
  },
  (error) => {
    let errorMessage = 'An unexpected error occurred.';
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401 || status === 403) {
        localStorage.clear();
        // Use window.location.hash for HashRouter compatibility in Electron
        if (!window.location.hash.includes('#/login')) {
          window.location.hash = '#/login';
          toastService.error('Session expired. Please login again.');
        }
        return Promise.reject(new Error('Unauthorized'));
      }
      errorMessage = data.message || data.error?.message || `Error ${status}`;
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    } else {
      errorMessage = error.message;
    }

    // The hook or component is responsible for showing the toast
    return Promise.reject(new Error(errorMessage));
  }
);

export const createApiService = (resource) => {
  const resourceUrl = `/${resource}`;

  return {
    getAll: (page = 1, limit = 10) =>
      api.get(`${resourceUrl}?page=${page}&limit=${limit}`),

    getById: (id) =>
      api.get(`${resourceUrl}/${id}`),

    create: (data) =>
      api.post(resourceUrl, data),

    update: (id, data) =>
      api.put(`${resourceUrl}/${id}`, data),

    delete: (id) =>
      api.delete(`${resourceUrl}/${id}`),

    search: (query, page = 1, limit = 10) =>
      api.get(`${resourceUrl}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),

    addCustomMethod(name, method) {
      this[name] = method.bind(this);
    }
  };
};

// Export individual HTTP methods for direct use
export const get = (url, params = {}) => {
  return api.get(url, { params });
};

export const post = (url, data = {}) => {
  return api.post(url, data);
};

export const put = (url, data = {}) => {
  return api.put(url, data);
};

export const del = (url) => {
  return api.delete(url);
};

export default api;
