import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import suratJalanService from '../services/suratJalanService';

const useSuratJalanOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const createSuratJalan = useCallback(async (suratJalanData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await suratJalanService.createSuratJalan(suratJalanData);
      
      if (result.success) {
        toastService.success('Surat jalan berhasil dibuat');
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to create surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      if (err.response?.status === 400) {
        const errorMessage = err.response.data?.message || 'Validation error';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else if (err.response?.status === 409) {
        const errorMessage = err.response.data?.message || 'Nomor surat jalan sudah ada';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else if (err.response?.status === 422) {
        const errorMessage = err.response.data?.message || 'Invoice ID tidak valid';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else {
        const errorMessage = err.message || 'Gagal membuat surat jalan';
        setError(errorMessage);
        toastService.error(errorMessage);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const updateSuratJalan = useCallback(async (id, updateData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await suratJalanService.updateSuratJalan(id, updateData);
      
      if (result.success) {
        toastService.success('Surat jalan berhasil diperbarui');
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to update surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      if (err.response?.status === 400) {
        const errorMessage = err.response.data?.message || 'Validation error';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else if (err.response?.status === 404) {
        const errorMessage = err.response.data?.message || 'Surat jalan tidak ditemukan';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else if (err.response?.status === 409) {
        const errorMessage = err.response.data?.message || 'Nomor surat jalan sudah ada';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else {
        const errorMessage = err.message || 'Gagal memperbarui surat jalan';
        setError(errorMessage);
        toastService.error(errorMessage);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const deleteSuratJalan = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await suratJalanService.deleteSuratJalan(id);
      
      if (result.success) {
        toastService.success('Surat jalan berhasil dihapus');
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return false;
      }
      
      if (err.response?.status === 404) {
        const errorMessage = err.response.data?.message || 'Surat jalan tidak ditemukan';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else if (err.response?.status === 409) {
        const errorMessage = err.response.data?.message || 'Surat jalan tidak dapat dihapus karena sudah dalam status SHIPPED atau DELIVERED';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else {
        const errorMessage = err.message || 'Gagal menghapus surat jalan';
        setError(errorMessage);
        toastService.error(errorMessage);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const getSuratJalanById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const result = await suratJalanService.getSuratJalanById(id);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      if (err.response?.status === 404) {
        const errorMessage = err.response.data?.message || 'Surat jalan tidak ditemukan';
        setError(errorMessage);
        toastService.error(errorMessage);
      } else {
        const errorMessage = err.message || 'Gagal memuat data surat jalan';
        setError(errorMessage);
        toastService.error(errorMessage);
      }
      return null;
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
    createSuratJalan,
    updateSuratJalan,
    deleteSuratJalan,
    getSuratJalanById,
    clearError
  };
};

export default useSuratJalanOperations;
