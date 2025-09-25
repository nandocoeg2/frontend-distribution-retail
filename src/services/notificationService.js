import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1/notifications';

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

const notificationService = {
  // Get all notifications
  async getAllNotifications() {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread notifications
  async getUnreadNotifications() {
    try {
      const response = await api.get('/unread');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  // Get alerts (low stock alerts)
  async getAlerts() {
    try {
      const response = await api.get('/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  // Mark specific notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.patch(`/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.patch('/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
};

export default notificationService;
