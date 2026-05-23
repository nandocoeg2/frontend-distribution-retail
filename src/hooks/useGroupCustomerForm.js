import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { groupCustomerService } from '../services/groupCustomerService';
import { parentGroupCustomerService } from '../services/parentGroupCustomerService';

const useGroupCustomerForm = (initialData = null) => {
  const [formData, setFormData] = useState({
    kode_group: '',
    nama_group: '',
    alamat: '',
    npwp: '',
    parentGroupCustomerId: '',
    ...initialData
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [parentGroupOptions, setParentGroupOptions] = useState([]);
  const [loadingParentGroups, setLoadingParentGroups] = useState(false);
  const navigate = useNavigate();

  // Fetch parent group options on mount
  useEffect(() => {
    const fetchParentGroups = async () => {
      try {
        setLoadingParentGroups(true);
        const result = await parentGroupCustomerService.getAllForDropdown();
        if (result.success && result.data?.data) {
          setParentGroupOptions(result.data.data);
        }
      } catch (error) {
        console.error('Error fetching parent groups:', error);
      } finally {
        setLoadingParentGroups(false);
      }
    };
    fetchParentGroups();
  }, []);

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Sesi telah berakhir. Silakan login kembali.');
  }, [navigate]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.kode_group.trim()) {
      newErrors.kode_group = 'Kode group customer wajib diisi';
    }

    if (!formData.nama_group.trim()) {
      newErrors.nama_group = 'Nama group customer wajib diisi';
    }

    // Optional validation for NPWP format if provided (accept 15 or 16 digits)
    if (formData.npwp && formData.npwp.trim()) {
      const cleanNpwp = formData.npwp.replace(/\D/g, '');
      if (cleanNpwp.length < 15 || cleanNpwp.length > 16) {
        newErrors.npwp = 'Format NPWP tidak valid (harus 15 atau 16 digit)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toastService.error('Mohon perbaiki error pada form');
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const submitData = {
        kode_group: formData.kode_group.trim(),
        nama_group: formData.nama_group.trim(),
        alamat: formData.alamat.trim() || null,
        npwp: (() => {
          const raw = formData.npwp.trim();
          if (!raw) return null;
          const clean = raw.replace(/\D/g, '');
          // Auto-convert 15 digit to 16 digit by prepending '0'
          if (clean.length === 15) return `0${clean}`;
          return clean;
        })(),
        parentGroupCustomerId: formData.parentGroupCustomerId || null
      };

      let result;
      if (initialData && initialData.id) {
        // Update existing group customer
        result = await groupCustomerService.updateGroupCustomer(initialData.id, submitData);
        toastService.success('Group customer berhasil diperbarui');
      } else {
        // Create new group customer
        result = await groupCustomerService.createGroupCustomer(submitData);
        toastService.success('Group customer berhasil dibuat');
      }

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to save group customer');
      }
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message.includes('401')) {
        handleAuthError();
        return;
      }

      let errorMessage = 'Gagal menyimpan group customer';
      
      if (err.message.includes('400')) {
        errorMessage = 'Data yang dimasukkan tidak valid';
        // Try to parse validation errors from response
        try {
          const errorData = JSON.parse(err.message);
          if (errorData.error && errorData.error.details) {
            setErrors(errorData.error.details);
          }
        } catch (parseError) {
          // If parsing fails, use the general error message
        }
      } else if (err.message.includes('409')) {
        errorMessage = 'Kode group customer sudah digunakan';
        setErrors({ kode_group: 'Kode group customer sudah digunakan' });
      } else if (err.message.includes('404')) {
        errorMessage = 'Group customer tidak ditemukan';
      } else if (err.message.includes('500')) {
        errorMessage = 'Terjadi kesalahan server. Silakan coba lagi.';
      } else if (err.message.includes('Network')) {
        errorMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, initialData, handleAuthError]);

  const resetForm = useCallback(() => {
    setFormData({
      kode_group: '',
      nama_group: '',
      alamat: '',
      npwp: '',
      parentGroupCustomerId: '',
      ...initialData
    });
    setErrors({});
  }, [initialData]);

  const setFieldError = useCallback((field, message) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Auto-format NPWP on blur:
   * - Strip non-digit characters
   * - If 15 digits (old format), prepend '0' to convert to 16-digit format
   */
  const handleNPWPBlur = useCallback((e) => {
    const { value } = e.target;
    if (!value) return;

    const cleanValue = value.replace(/[^0-9]/g, '');

    if (cleanValue.length === 15) {
      setFormData(prev => ({ ...prev, npwp: `0${cleanValue}` }));
    } else if (cleanValue !== value) {
      setFormData(prev => ({ ...prev, npwp: cleanValue }));
    }
  }, []);

  return {
    formData,
    setFormData,
    loading,
    errors,
    handleInputChange,
    handleNPWPBlur,
    handleSubmit,
    resetForm,
    setFieldError,
    clearErrors,
    validateForm,
    parentGroupOptions,
    loadingParentGroups
  };
};

export default useGroupCustomerForm;
