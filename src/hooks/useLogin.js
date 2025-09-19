import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import toastService from '../services/toastService';

/**
 * Hook untuk menangani proses login
 * @returns {Object} Object berisi state dan fungsi untuk login
 */
const useLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Validasi form
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validasi email
    if (!formData.email) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    // Validasi password
    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirect to dashboard or intended page
        const intendedPath = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
        navigate(intendedPath, { replace: true });
      } else {
        // Handle specific error cases
        if (result.error.includes('Invalid email or password')) {
          setErrors({
            general: 'Email atau password salah'
          });
        } else if (result.error.includes('Validation error')) {
          setErrors({
            general: 'Data yang dimasukkan tidak valid'
          });
        } else {
          setErrors({
            general: result.error
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: 'Terjadi kesalahan saat login. Silakan coba lagi.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, login, navigate]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      password: ''
    });
    setErrors({});
  }, []);

  // Clear specific error
  const clearError = useCallback((field) => {
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  }, []);

  return {
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleSubmit,
    resetForm,
    clearError,
    validateForm
  };
};

export default useLogin;
