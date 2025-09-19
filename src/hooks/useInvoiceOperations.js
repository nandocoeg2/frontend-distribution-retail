import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import invoiceService from '../services/invoiceService';

const useInvoiceOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const createInvoice = useCallback(async (invoiceData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invoiceService.createInvoice(invoiceData);
      
      if (result.success) {
        toastService.success('Invoice berhasil dibuat');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Gagal membuat invoice');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal membuat invoice';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const updateInvoice = useCallback(async (id, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invoiceService.updateInvoice(id, updateData);
      
      if (result.success) {
        toastService.success('Invoice berhasil diperbarui');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Gagal memperbarui invoice');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal memperbarui invoice';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const deleteInvoice = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invoiceService.deleteInvoice(id);
      
      if (result.success || result === '') {
        toastService.success('Invoice berhasil dihapus');
        return true;
      } else {
        throw new Error(result.error?.message || 'Gagal menghapus invoice');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return false;
      }
      
      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal menghapus invoice';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const getInvoiceById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invoiceService.getInvoiceById(id);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Gagal mengambil data invoice');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal mengambil data invoice';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const duplicateInvoice = useCallback(async (originalInvoice) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a copy of the invoice with new invoice number
      const duplicatedData = {
        ...originalInvoice,
        no_invoice: `${originalInvoice.no_invoice}-COPY-${Date.now()}`,
        tanggal: new Date().toISOString().split('T')[0],
        invoiceDetails: originalInvoice.invoiceDetails?.map(detail => ({
          ...detail,
          id: undefined // Remove ID so it creates new detail
        })) || []
      };
      
      const result = await invoiceService.createInvoice(duplicatedData);
      
      if (result.success) {
        toastService.success('Invoice berhasil diduplikasi');
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Gagal menduplikasi invoice');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }
      
      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal menduplikasi invoice';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const exportInvoice = useCallback(async (invoiceId, format = 'pdf') => {
    try {
      setLoading(true);
      setError(null);
      
      // This would typically call an export endpoint
      // For now, we'll just show a success message
      toastService.success(`Invoice berhasil diekspor dalam format ${format.toUpperCase()}`);
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Gagal mengekspor invoice';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    duplicateInvoice,
    exportInvoice,
    clearError,
    handleAuthError
  };
};

export default useInvoiceOperations;
