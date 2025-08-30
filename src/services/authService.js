import axios from 'axios';

const API_BASE_URL = 'http://localhost:5050/api/v1';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable credentials for CORS
    });
  }

  // Save user data to localStorage
  saveUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData.user));
    localStorage.setItem('token', userData.user.accessToken);
    localStorage.setItem('menus', JSON.stringify(userData.user.menus));
  }

  // Get user data from localStorage
  getUserData() {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Get menus from localStorage
  getMenus() {
    try {
      const menus = localStorage.getItem('menus');
      return menus ? JSON.parse(menus) : [];
    } catch (error) {
      console.error('Error parsing menus:', error);
      return [];
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Clear all user data from localStorage
  clearUserData() {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('menus');
  }

  // Login API call
  async login(email, password) {
    try {
      const response = await this.api.post('/auth/login', {
        email,
        password,
      });

      if (response.data) {
        this.saveUserData(response.data);
        return { success: true, data: response.data };
      }
      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  }

  // Register API call
  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
      });

      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  }

  // Logout API call
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await this.api.post(
          '/auth/logout',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      this.clearUserData();
      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local data
      this.clearUserData();
      console.error('Logout error:', error);
      return { success: true }; // Still consider it successful locally
    }
  }
}

export default new AuthService();
