import { useCallback, useEffect, useState } from 'react';
import {
  getReturnById,
  classifyReturn as classifyReturnRequest,
  deleteReturn as deleteReturnRequest,
} from '@/services/returnsService';
import toastService from '@/services/toastService';

const useReturnDetail = (returnId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!returnId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getReturnById(returnId);
      const detail =
        response?.data ||
        response?.return ||
        response?.result ||
        response;

      setData(detail || null);
    } catch (err) {
      const message = err.message || 'Gagal memuat detail retur.';
      setError(message);
      setData(null);
      toastService.error(message);
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const classify = useCallback(
    async (action) => {
      if (!returnId) {
        return false;
      }

      setClassifyLoading(true);

      try {
        await classifyReturnRequest(returnId, action);
        toastService.success(
          action === 'restock'
            ? 'Retur berhasil diklasifikasikan sebagai stok ulang.'
            : 'Retur berhasil diklasifikasikan sebagai ditolak.'
        );
        await fetchDetail();
        return true;
      } catch (err) {
        toastService.error(err.message || 'Gagal mengklasifikasikan retur.');
        return false;
      } finally {
        setClassifyLoading(false);
      }
    },
    [fetchDetail, returnId]
  );

  const deleteReturn = useCallback(async () => {
    if (!returnId) {
      return false;
    }

    setDeleteLoading(true);

    try {
      await deleteReturnRequest(returnId);
      toastService.success('Retur berhasil dihapus.');
      setData(null);
      return true;
    } catch (err) {
      toastService.error(err.message || 'Gagal menghapus retur.');
      return false;
    } finally {
      setDeleteLoading(false);
    }
  }, [returnId]);

  return {
    data,
    loading,
    error,
    classifyLoading,
    deleteLoading,
    fetchDetail,
    classify,
    deleteReturn,
  };
};

export default useReturnDetail;
