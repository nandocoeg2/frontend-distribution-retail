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
  const [matching, setMatching] = useState(false);
  const [unmatching, setUnmatching] = useState(false);
  const [validating, setValidating] = useState(false);
  const [bulkValidating, setBulkValidating] = useState(false);
  const [batchSummaryLoading, setBatchSummaryLoading] = useState(false);

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

  const fetchMatchSuggestions = useCallback(
    async (id) => {
      if (!id) {
        toastService.error('ID mutasi bank tidak valid.');
        return null;
      }

      try {
        const response = await mutasiBankService.getMatchSuggestions(id);
        return response;
      } catch (error) {
        if (!handleAuthError(error)) {
          toastService.error(
            resolveErrorMessage(error, 'Gagal memuat saran dokumen.')
          );
        }
        throw error;
      }
    },
    [handleAuthError]
  );

  const matchMutation = useCallback(
    async (id, payload) => {
      if (!id) {
        toastService.error('ID mutasi bank tidak valid.');
        return null;
      }

      setMatching(true);
      try {
        const response = await mutasiBankService.matchMutation(id, payload);
        toastService.success('Mutasi bank berhasil dihubungkan ke dokumen.');
        return response;
      } catch (error) {
        if (!handleAuthError(error)) {
          toastService.error(
            resolveErrorMessage(error, 'Gagal melakukan pencocokan mutasi bank.')
          );
        }
        throw error;
      } finally {
        setMatching(false);
      }
    },
    [handleAuthError]
  );

  const unmatchMutation = useCallback(
    async (id) => {
      if (!id) {
        toastService.error('ID mutasi bank tidak valid.');
        return null;
      }

      setUnmatching(true);
      try {
        const response = await mutasiBankService.unmatchMutation(id);
        toastService.success('Relasi mutasi bank berhasil dilepas.');
        return response;
      } catch (error) {
        if (!handleAuthError(error)) {
          toastService.error(
            resolveErrorMessage(error, 'Gagal melepas pencocokan mutasi bank.')
          );
        }
        throw error;
      } finally {
        setUnmatching(false);
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

  const bulkValidateMutations = useCallback(
    async ({ mutationIds, status, notes }) => {
      if (!Array.isArray(mutationIds) || mutationIds.length === 0) {
        toastService.error('Silakan pilih mutasi bank yang akan divalidasi.');
        return null;
      }

      if (!status) {
        toastService.error('Status validasi wajib dipilih.');
        return null;
      }

      setBulkValidating(true);
      try {
        const response = await mutasiBankService.bulkValidate({
          mutationIds,
          status,
          notes,
        });
        toastService.success('Validasi massal mutasi bank berhasil diproses.');
        return response;
      } catch (error) {
        if (!handleAuthError(error)) {
          toastService.error(
            resolveErrorMessage(error, 'Gagal melakukan validasi massal.')
          );
        }
        throw error;
      } finally {
        setBulkValidating(false);
      }
    },
    [handleAuthError]
  );

  const fetchBatchSummary = useCallback(
    async (batchNumber) => {
      if (!batchNumber) {
        toastService.error('Nomor batch wajib diisi.');
        return null;
      }

      setBatchSummaryLoading(true);
      try {
        const response = await mutasiBankService.getBatchSummary(batchNumber);
        return response;
      } catch (error) {
        if (!handleAuthError(error)) {
          toastService.error(
            resolveErrorMessage(error, 'Gagal memuat ringkasan batch.')
          );
        }
        throw error;
      } finally {
        setBatchSummaryLoading(false);
      }
    },
    [handleAuthError]
  );

  return {
    uploadMutationFile,
    uploading,
    fetchMutationDetail,
    detailLoading,
    fetchMatchSuggestions,
    matchMutation,
    matching,
    unmatchMutation,
    unmatching,
    validateMutation,
    validating,
    bulkValidateMutations,
    bulkValidating,
    fetchBatchSummary,
    batchSummaryLoading,
    handleAuthError,
  };
};

export default useMutasiBankPage;
