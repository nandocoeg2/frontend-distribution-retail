import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import authService from '../services/authService';
import toastService from '../services/toastService';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const userData = authService.getUserData();
        const tokenData = authService.getToken();
        
        if (userData && tokenData) {
          setUser(userData);
          setToken(tokenData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        authService.clearUserData();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);
      
      console.log('Login result:', result); // Debug log
      
      if (result.success) {
        // Periksa struktur data dengan aman
        if (result.data && result.data.user && result.data.accessToken) {
          const { user: userData, accessToken } = result.data;
          console.log('User data:', userData); // Debug log
          console.log('Access token:', accessToken); // Debug log
          setUser(userData);
          setToken(accessToken);
          setIsAuthenticated(true);
          toastService.success('Login berhasil');
          return { success: true, data: result.data };
        } else {
          console.error('Invalid data structure:', result.data);
          toastService.error('Data response tidak valid');
          return { success: false, error: 'Data response tidak valid' };
        }
      } else {
        toastService.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Terjadi kesalahan saat login';
      toastService.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const result = await authService.register(userData);
      
      if (result.success) {
        toastService.success('Registrasi berhasil. Silakan login.');
        return { success: true, data: result.data };
      } else {
        toastService.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Terjadi kesalahan saat registrasi';
      toastService.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      toastService.success('Logout berhasil');
      // Navigate will be handled by the component using this hook
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is authenticated
  const checkAuth = useCallback(() => {
    const isAuth = authService.isAuthenticated();
    if (!isAuth && isAuthenticated) {
      // Token expired or invalid
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      toastService.error('Session expired. Silakan login kembali.');
    }
    return isAuth;
  }, [isAuthenticated]);

  // Handle auth errors
  const handleAuthError = useCallback((error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      logout();
      return true;
    }
    return false;
  }, [logout]);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    checkAuth,
    handleAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
