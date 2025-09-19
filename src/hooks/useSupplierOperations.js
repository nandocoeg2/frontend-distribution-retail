import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import supplierService from '@/services/supplierService';
import toastService from '@/services/toastService';

const useSupplierOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const createSupplier = useCallback(async (supplierData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await supplierService.createSupplier(supplierData);
      if (result.success) {
        toastService.success('Supplier berhasil dibuat');
        return result.data;
      } else {
        throw new Error(result.message || 'Gagal membuat supplier');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat supplier';
      
      // Handle specific error cases
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      
      if (err.response?.status === 409) {
        toastService.error('Kode supplier sudah digunakan');
        setError('Kode supplier sudah digunakan');
        return;
      }
      
      if (err.response?.status === 400) {
        const validationErrors = err.response?.data?.errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          const errorMessages = validationErrors.map(err => err.message).join(', ');
          toastService.error(errorMessages);
          setError(errorMessages);
          return;
        }
      }
      
      toastService.error(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const updateSupplier = useCallback(async (id, supplierData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await supplierService.updateSupplier(id, supplierData);
      if (result.success) {
        toastService.success('Supplier berhasil diperbarui');
        return result.data;
      } else {
        throw new Error(result.message || 'Gagal memperbarui supplier');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui supplier';
      
      // Handle specific error cases
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      
      if (err.response?.status === 404) {
        toastService.error('Supplier tidak ditemukan');
        setError('Supplier tidak ditemukan');
        return;
      }
      
      if (err.response?.status === 409) {
        toastService.error('Kode supplier sudah digunakan');
        setError('Kode supplier sudah digunakan');
        return;
      }
      
      if (err.response?.status === 400) {
        const validationErrors = err.response?.data?.errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          const errorMessages = validationErrors.map(err => err.message).join(', ');
          toastService.error(errorMessages);
          setError(errorMessages);
          return;
        }
      }
      
      toastService.error(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const deleteSupplier = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await supplierService.deleteSupplier(id);
      if (result.success) {
        toastService.success('Supplier berhasil dihapus');
        return true;
      } else {
        throw new Error(result.message || 'Gagal menghapus supplier');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menghapus supplier';
      
      // Handle specific error cases
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      
      if (err.response?.status === 404) {
        toastService.error('Supplier tidak ditemukan');
        setError('Supplier tidak ditemukan');
        return;
      }
      
      if (err.response?.status === 409) {
        toastService.error('Supplier tidak dapat dihapus karena masih memiliki purchase order aktif');
        setError('Supplier tidak dapat dihapus karena masih memiliki purchase order aktif');
        return;
      }
      
      toastService.error(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const getSupplierById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await supplierService.getSupplierById(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Gagal mengambil data supplier');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal mengambil data supplier';
      
      // Handle specific error cases
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      
      if (err.response?.status === 404) {
        toastService.error('Supplier tidak ditemukan');
        setError('Supplier tidak ditemukan');
        return;
      }
      
      toastService.error(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
    clearError,
    handleAuthError
  };
};

export default useSupplierOperations;
