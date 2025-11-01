import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mutasiBankService from '../services/mutasiBankService';
import toastService from '../services/toastService';

const resolveErrorMessage = (error, fallbackMessage) => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage ||
    'Terjadi kesalahan saat memproses permintaan.'
  );
};

const useMutasiBankPage = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const handleAuthError = useCallback(
    (error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        localStorage.clear();
        navigate('/login', { replace: true });
        toastService.error('Sesi Anda telah berakhir. Silakan login kembali.');
        return true;
      }

      return false;
    },
    [navigate]
  );

  const uploadMutationFile = useCallback(
    async (file) => {
      if (!file) {
        toastService.error('Silakan pilih file mutasi bank yang akan diunggah.');
        return null;
      }

      setUploading(true);
      try {
        const response = await mutasiBankService.uploadMutationFile({ file });
        toastService.success('File mutasi bank berhasil diunggah.');
        return response;
      } catch (error) {
        if (!handleAuthError(error)) {
          toastService.error(
            resolveErrorMessage(error, 'Gagal mengunggah file mutasi bank.')
          );
        }
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [handleAuthError]
  );

  const fetchMutationDetail = useCallback(
    async (id) => {
      if (!id) {
        toastService.error('ID mutasi bank tidak valid.');
        return null;
      }

      setDetailLoading(true);
      try {
        const response = await mutasiBankService.getMutationById(id);
        return response;
      } catch (error) {
        if (!handleAuthError(error)) {
          toastService.error(
            resolveErrorMessage(error, 'Gagal memuat detail mutasi bank.')
          );
        }
        throw error;
      } finally {
        setDetailLoading(false);
      }
    },
    [handleAuthError]
  );

  const validateMutation = useCallback(
    async (id, payload) => {
      if (!id) {
        toastService.error('ID mutasi bank tidak valid.');
        return null;
      }

      if (!payload?.status) {
        toastService.error('Status validasi wajib dipilih.');
        return null;
      }

      setValidating(true);
      try {
        const response = await mutasiBankService.validateMutation(id, payload);
        toastService.success('Status mutasi bank berhasil diperbarui.');
        return response;
      } catch (error) {
        if (!handleAuthError(error)) {
          toastService.error(
            resolveErrorMessage(error, 'Gagal memvalidasi mutasi bank.')
          );
        }
        throw error;
      } finally {
        setValidating(false);
      }
    },
    [handleAuthError]
  );

  return {
    uploadMutationFile,
    uploading,
    fetchMutationDetail,
    detailLoading,
    validateMutation,
    validating,
    handleAuthError,
  };
};

export default useMutasiBankPage;
