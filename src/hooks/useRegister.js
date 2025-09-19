import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import toastService from '../services/toastService';

/**
 * Hook untuk menangani proses registrasi
 * @returns {Object} Object berisi state dan fungsi untuk registrasi
 */
const useRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Validasi form
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validasi username
    if (!formData.username) {
      newErrors.username = 'Username harus diisi';
    } else if (formData.username.length < 2) {
      newErrors.username = 'Username minimal 2 karakter';
    }

    // Validasi firstName
    if (!formData.firstName) {
      newErrors.firstName = 'Nama depan harus diisi';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Nama depan minimal 2 karakter';
    }

    // Validasi lastName
    if (!formData.lastName) {
      newErrors.lastName = 'Nama belakang harus diisi';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Nama belakang minimal 2 karakter';
    }

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

    // Validasi confirmPassword
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak sama';
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
      // Prepare data for API (exclude confirmPassword)
      const { confirmPassword, ...registerData } = formData;
      
      const result = await register(registerData);
      
      if (result.success) {
        // Redirect to login page with success message
        navigate('/login', { 
          state: { 
            message: 'Registrasi berhasil! Silakan login dengan akun Anda.' 
          },
          replace: true 
        });
      } else {
        // Handle specific error cases
        if (result.error.includes('Email already exists')) {
          setErrors({
            email: 'Email sudah terdaftar'
          });
        } else if (result.error.includes('Username already exists')) {
          setErrors({
            username: 'Username sudah digunakan'
          });
        } else if (result.error.includes('Validation error')) {
          // Parse validation errors from server
          const errorMessage = result.error.replace('Validation error: ', '');
          if (errorMessage.includes('Username')) {
            setErrors({ username: errorMessage });
          } else if (errorMessage.includes('firstName')) {
            setErrors({ firstName: errorMessage });
          } else if (errorMessage.includes('lastName')) {
            setErrors({ lastName: errorMessage });
          } else if (errorMessage.includes('email')) {
            setErrors({ email: errorMessage });
          } else if (errorMessage.includes('password')) {
            setErrors({ password: errorMessage });
          } else {
            setErrors({ general: errorMessage });
          }
        } else {
          setErrors({
            general: result.error
          });
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      setErrors({
        general: 'Terjadi kesalahan saat registrasi. Silakan coba lagi.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, register, navigate]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
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

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return formData.username.length >= 2 &&
           formData.firstName.length >= 2 &&
           formData.lastName.length >= 2 &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
           formData.password.length >= 6 &&
           formData.password === formData.confirmPassword;
  }, [formData]);

  return {
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleSubmit,
    resetForm,
    clearError,
    validateForm,
    isFormValid
  };
};

export default useRegister;
