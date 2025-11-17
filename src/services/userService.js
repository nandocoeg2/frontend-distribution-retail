import axios from 'axios';
import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL_LOCAL}api/v1`;

class UserService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
    
    // Add a request interceptor to include the auth token
    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAllUsers(page = 1, limit = 10) {
    try {
      const response = await this.api.get(`/users?page=${page}&limit=${limit}`);
      return {
        data: response.data.data.data, // API mengembalikan data dalam format: {success: true, data: {data: [...], pagination: {...}}}
        pagination: response.data.data.pagination
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async searchUsers(query, page = 1, limit = 10) {
    try {
      const url = `/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      const response = await this.api.get(url);
      return {
        data: response.data.data.data, // API mengembalikan data dalam format: {success: true, data: {data: [...], pagination: {...}}}
        pagination: response.data.data.pagination,
        searchQuery: query
      };
    } catch (error) {
      console.error('Error searching users:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const response = await this.api.get(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const response = await this.api.post('/users', userData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await this.api.put(`/users/${id}`, userData);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const response = await this.api.delete(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error deleting user with id ${id}:`, error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
}

export default new UserService();
