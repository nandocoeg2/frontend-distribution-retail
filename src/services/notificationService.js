import axios from 'axios';

const API_BASE_URL = 'http://localhost:5050/api/v1/notifications';

const notificationService = {
  // Get all notifications
  async getAllNotifications() {
    try {
      const response = await axios.get(`${API_BASE_URL}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread notifications
  async getUnreadNotifications() {
    try {
      const response = await axios.get(`${API_BASE_URL}/unread`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  // Get alerts (low stock alerts)
  async getAlerts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/alerts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  // Mark specific notification as read
  async markAsRead(notificationId) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/${notificationId}/read`
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await axios.patch(`${API_BASE_URL}/read-all`);
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
};

export default notificationService;
