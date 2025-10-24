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
    console.log('Saving user data:', userData); // Debug log
    if (userData.user) {
      localStorage.setItem('userData', JSON.stringify(userData.user));
    }
    if (userData.accessToken) {
      localStorage.setItem('token', userData.accessToken);
    }
    if (userData.company) {
      localStorage.setItem('company', JSON.stringify(userData.company));
    }
    if (userData.user && userData.user.menus) {
      localStorage.setItem('menus', JSON.stringify(userData.user.menus));
    }
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

  getCompanyData() {
    try {
      const companyData = localStorage.getItem('company');
      return companyData ? JSON.parse(companyData) : null;
    } catch (error) {
      console.error('Error parsing company data:', error);
      return null;
    }
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
    localStorage.removeItem('company');
  }

  // Login API call
  async login(username, password, companyId) {
    try {
      const response = await this.api.post('/auth/login', {
        username,
        password,
        companyId,
      });

      if (response.data && response.data.success) {
        console.log('API Response:', response.data); // Debug log
        this.saveUserData(response.data.data);
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data?.error?.message || 'Invalid response format' };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || 
        error.response?.data?.message || 
        error.message || 
        'Login failed';
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

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data?.error?.message || 'Invalid response format' };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || 
        error.response?.data?.message || 
        error.message || 
        'Registration failed';
      return { success: false, error: errorMessage };
    }
  }

  // Logout API call
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        const response = await this.api.post(
          '/auth/logout',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.success) {
          this.clearUserData();
          return { success: true, data: response.data.data };
        }
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
