import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import customerService from '../services/customerService';
import toastService from '../services/toastService';

const useCustomerForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    namaCustomer: '',
    kodeCustomer: '',
    groupCustomerId: '',
    NPWP: '',
    alamatNPWP: '',
    regionId: '',
    alamatPengiriman: '',
    description: '',
    phoneNumber: '',
    email: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const handleAuthError = useCallback((err) => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      localStorage.clear();
      navigate('/login');
      toastService.error('Session expired. Please login again.');
      return true;
    }
    return false;
  }, [navigate]);

  const validateForm = useCallback((data) => {
    const errors = {};
    
    if (!data.namaCustomer?.trim()) {
      errors.namaCustomer = 'Nama customer harus diisi';
    }
    
    if (!data.kodeCustomer?.trim()) {
      errors.kodeCustomer = 'Kode customer harus diisi';
    }
    
    if (!data.groupCustomerId?.trim()) {
      errors.groupCustomerId = 'Group customer harus dipilih';
    }
    
    if (!data.regionId?.trim()) {
      errors.regionId = 'Region harus dipilih';
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Format email tidak valid';
    }
    
    if (data.phoneNumber && !/^[0-9+\-\s()]+$/.test(data.phoneNumber)) {
      errors.phoneNumber = 'Format nomor telepon tidak valid';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [validationErrors]);

  const resetForm = useCallback(() => {
    setFormData({
      namaCustomer: '',
      kodeCustomer: '',
      groupCustomerId: '',
      NPWP: '',
      alamatNPWP: '',
      regionId: '',
      alamatPengiriman: '',
      description: '',
      phoneNumber: '',
      email: ''
    });
    setValidationErrors({});
    setError(null);
  }, []);

  const loadCustomerData = useCallback((customer) => {
    setFormData({
      namaCustomer: customer.namaCustomer || '',
      kodeCustomer: customer.kodeCustomer || '',
      groupCustomerId: customer.groupCustomerId || '',
      NPWP: customer.NPWP || '',
      alamatNPWP: customer.alamatNPWP || '',
      regionId: customer.regionId || '',
      alamatPengiriman: customer.alamatPengiriman || '',
      description: customer.description || '',
      phoneNumber: customer.phoneNumber || '',
      email: customer.email || ''
    });
    setValidationErrors({});
    setError(null);
  }, []);

  const createCustomer = useCallback(async (onSuccess) => {
    if (!validateForm(formData)) {
      toastService.error('Mohon perbaiki error validasi terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await customerService.createCustomer(formData);
      toastService.success('Customer berhasil dibuat');
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      resetForm();
      return result;
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message);
        toastService.error(`Gagal membuat customer: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, handleAuthError, resetForm]);

  const updateCustomer = useCallback(async (customerId, onSuccess) => {
    if (!validateForm(formData)) {
      toastService.error('Mohon perbaiki error validasi terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await customerService.updateCustomer(customerId, formData);
      toastService.success('Customer berhasil diperbarui');
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message);
        toastService.error(`Gagal memperbarui customer: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, handleAuthError]);

  const getCustomerById = useCallback(async (customerId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await customerService.getCustomerById(customerId);
      loadCustomerData(result);
      
      return result;
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message);
        toastService.error(`Gagal memuat data customer: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, loadCustomerData]);

  return {
    formData,
    setFormData,
    loading,
    error,
    validationErrors,
    handleInputChange,
    resetForm,
    loadCustomerData,
    createCustomer,
    updateCustomer,
    getCustomerById,
    validateForm
  };
};

export default useCustomerForm;
