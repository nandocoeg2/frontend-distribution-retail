import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import toastService from '../services/toastService';

/**
 * Hook untuk menangani proses logout
 * @returns {Object} Object berisi state dan fungsi untuk logout
 */
const useLogout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const { logout } = useAuth();

  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await logout();
      
      if (result.success) {
        toastService.success('Logout berhasil');
        navigate('/login', { replace: true });
        return { success: true };
      } else {
        setError('Gagal melakukan logout');
        toastService.error('Gagal melakukan logout');
        return { success: false, error: 'Gagal melakukan logout' };
      }
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = error.message || 'Terjadi kesalahan saat logout';
      setError(errorMessage);
      toastService.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [logout, navigate]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    handleLogout,
    clearError,
    reset
  };
};

export default useLogout;
