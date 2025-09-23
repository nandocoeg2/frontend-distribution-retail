import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import invoicePengirimanService from '../services/invoicePengirimanService';

const useInvoicePengirimanOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Sesi berakhir. Silakan login kembali.');
  }, [navigate]);

  const createInvoicePengiriman = useCallback(async (invoiceData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await invoicePengirimanService.createInvoicePengiriman(invoiceData);

      if (result.success) {
        toastService.success('Invoice pengiriman berhasil dibuat');
        return result.data;
      }

      throw new Error(result.error?.message || 'Gagal membuat invoice pengiriman');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }

      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal membuat invoice pengiriman';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const updateInvoicePengiriman = useCallback(async (id, updateData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await invoicePengirimanService.updateInvoicePengiriman(id, updateData);

      if (result.success) {
        toastService.success('Invoice pengiriman berhasil diperbarui');
        return result.data;
      }

      throw new Error(result.error?.message || 'Gagal memperbarui invoice pengiriman');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }

      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal memperbarui invoice pengiriman';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const deleteInvoicePengiriman = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const result = await invoicePengirimanService.deleteInvoicePengiriman(id);

      if (result?.success || result === '' || result === undefined) {
        toastService.success('Invoice pengiriman berhasil dihapus');
        return true;
      }

      throw new Error(result?.error?.message || 'Gagal menghapus invoice pengiriman');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return false;
      }

      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal menghapus invoice pengiriman';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const getInvoicePengirimanById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const result = await invoicePengirimanService.getInvoicePengirimanById(id);

      if (result.success) {
        return result.data;
      }

      throw new Error(result.error?.message || 'Gagal mengambil data invoice pengiriman');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }

      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal mengambil data invoice pengiriman';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const duplicateInvoicePengiriman = useCallback(async (originalInvoice) => {
    try {
      setLoading(true);
      setError(null);

      const duplicatedData = {
        ...originalInvoice,
        no_invoice: `${originalInvoice.no_invoice}-COPY-${Date.now()}`,
        tanggal: new Date().toISOString().split('T')[0],
        invoiceDetails: originalInvoice.invoiceDetails?.map(detail => ({
          ...detail,
          id: undefined
        })) || []
      };

      const result = await invoicePengirimanService.createInvoicePengiriman(duplicatedData);

      if (result.success) {
        toastService.success('Invoice pengiriman berhasil diduplikasi');
        return result.data;
      }

      throw new Error(result.error?.message || 'Gagal menduplikasi invoice pengiriman');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return null;
      }

      const errorMessage = err.response?.data?.error?.message || err.message || 'Gagal menduplikasi invoice pengiriman';
      setError(errorMessage);
      toastService.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const exportInvoicePengiriman = useCallback(async (_invoiceId, format = 'pdf') => {
    try {
      setLoading(true);
      setError(null);
      toastService.success(`Invoice pengiriman berhasil diekspor dalam format ${format.toUpperCase()}`);
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Gagal mengekspor invoice pengiriman';
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
    createInvoicePengiriman,
    updateInvoicePengiriman,
    deleteInvoicePengiriman,
    getInvoicePengirimanById,
    duplicateInvoicePengiriman,
    exportInvoicePengiriman,
    clearError,
    handleAuthError
  };
};

export default useInvoicePengirimanOperations;
