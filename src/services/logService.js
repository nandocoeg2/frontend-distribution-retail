import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1/logs`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const logService = {
  /**
   * Ambil log aplikasi (terbaru lebih dulu).
   * @param {Object} params - { file, level, q, startDate, endDate, page, limit }
   */
  async getLogs(params = {}) {
    const query = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query[key] = value;
      }
    });

    const response = await api.get('/', { params: query });
    return response.data?.data;
  },
};

export default logService;
