import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { groupCustomerService } from '../services/groupCustomerService';

const useGroupCustomerOperations = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Sesi telah berakhir. Silakan login kembali.');
  }, [navigate]);

  const createGroupCustomer = useCallback(async (groupCustomerData) => {
    try {
      setLoading(true);
      const result = await groupCustomerService.createGroupCustomer(groupCustomerData);
      
      if (result.success) {
        toastService.success('Group customer berhasil dibuat');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create group customer');
      }
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message.includes('401')) {
        handleAuthError();
        return;
      }

      let errorMessage = 'Gagal membuat group customer';
      
      if (err.message.includes('400')) {
        errorMessage = 'Data yang dimasukkan tidak valid';
      } else if (err.message.includes('409')) {
        errorMessage = 'Kode group customer sudah digunakan';
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
  }, [handleAuthError]);

  const updateGroupCustomer = useCallback(async (id, groupCustomerData) => {
    try {
      setLoading(true);
      const result = await groupCustomerService.updateGroupCustomer(id, groupCustomerData);
      
      if (result.success) {
        toastService.success('Group customer berhasil diperbarui');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update group customer');
      }
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message.includes('401')) {
        handleAuthError();
        return;
      }

      let errorMessage = 'Gagal memperbarui group customer';
      
      if (err.message.includes('400')) {
        errorMessage = 'Data yang dimasukkan tidak valid';
      } else if (err.message.includes('404')) {
        errorMessage = 'Group customer tidak ditemukan';
      } else if (err.message.includes('409')) {
        errorMessage = 'Kode group customer sudah digunakan';
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
  }, [handleAuthError]);

  const deleteGroupCustomer = useCallback(async (id) => {
    try {
      setLoading(true);
      const result = await groupCustomerService.deleteGroupCustomer(id);
      
      if (result.success) {
        toastService.success('Group customer berhasil dihapus');
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to delete group customer');
      }
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message.includes('401')) {
        handleAuthError();
        return;
      }

      let errorMessage = 'Gagal menghapus group customer';
      
      if (err.message.includes('404')) {
        errorMessage = 'Group customer tidak ditemukan';
      } else if (err.message.includes('409')) {
        errorMessage = 'Group customer tidak dapat dihapus karena masih digunakan';
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
  }, [handleAuthError]);

  const getGroupCustomerById = useCallback(async (id) => {
    try {
      setLoading(true);
      const result = await groupCustomerService.getGroupCustomerById(id);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to fetch group customer');
      }
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message.includes('401')) {
        handleAuthError();
        return;
      }

      let errorMessage = 'Gagal mengambil data group customer';
      
      if (err.message.includes('404')) {
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
  }, [handleAuthError]);

  return {
    loading,
    createGroupCustomer,
    updateGroupCustomer,
    deleteGroupCustomer,
    getGroupCustomerById
  };
};

export default useGroupCustomerOperations;
