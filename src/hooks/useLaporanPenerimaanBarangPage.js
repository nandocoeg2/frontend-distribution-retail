import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import laporanPenerimaanBarangService from '../services/laporanPenerimaanBarangService';

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  fallback;

const isAuthError = (error) =>
  error?.response?.status === 401 || error?.response?.status === 403;

const useLaporanPenerimaanBarangPage = () => {
  const navigate = useNavigate();

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const createReport = useCallback(
    async (reportData) => {
      try {
        const result =
          await laporanPenerimaanBarangService.createReport(reportData);

        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to create laporan penerimaan barang'
          );
        }

        toastService.success('Laporan penerimaan barang created successfully');
        return result?.data;
      } catch (error) {
        if (isAuthError(error)) {
          handleAuthRedirect();
          return undefined;
        }

        toastService.error(
          getErrorMessage(
            error,
            'Failed to create laporan penerimaan barang'
          )
        );
        throw error;
      }
    },
    [handleAuthRedirect]
  );

  const uploadBulkReports = useCallback(
    async ({ files, prompt } = {}) => {
      try {
        const result =
          await laporanPenerimaanBarangService.uploadBulkReports({
            files,
            prompt,
          });

        if (result?.success === false) {
          throw new Error(
            result?.message ||
              result?.error?.message ||
              'Failed to upload bulk laporan penerimaan barang files'
          );
        }

        toastService.success(
          result?.message ||
            'Bulk upload laporan penerimaan barang berhasil dikirim ke background.'
        );
        return result?.data || result;
      } catch (error) {
        if (isAuthError(error)) {
          handleAuthRedirect();
          return undefined;
        }

        toastService.error(
          getErrorMessage(
            error,
            'Failed to upload bulk laporan penerimaan barang files'
          )
        );
        throw error;
      }
    },
    [handleAuthRedirect]
  );

  const uploadBulkReportsTextExtraction = useCallback(
    async ({ files } = {}) => {
      try {
        const result =
          await laporanPenerimaanBarangService.uploadBulkReportsTextExtraction(
            {
              files,
            }
          );

        if (result?.success === false) {
          throw new Error(
            result?.message ||
              result?.error?.message ||
              'Failed to upload bulk LPB files with text extraction'
          );
        }

        toastService.success(
          result?.message || 'Bulk upload LPB dengan Text Extraction berhasil.'
        );
        return result?.data || result;
      } catch (error) {
        if (isAuthError(error)) {
          handleAuthRedirect();
          return undefined;
        }

        toastService.error(
          getErrorMessage(
            error,
            'Failed to upload bulk LPB files with text extraction'
          )
        );
        throw error;
      }
    },
    [handleAuthRedirect]
  );

  const updateReport = useCallback(
    async (id, reportData) => {
      try {
        const result =
          await laporanPenerimaanBarangService.updateReport(id, reportData);

        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to update laporan penerimaan barang'
          );
        }

        toastService.success('Laporan penerimaan barang updated successfully');
        return result?.data;
      } catch (error) {
        if (isAuthError(error)) {
          handleAuthRedirect();
          return undefined;
        }

        toastService.error(
          getErrorMessage(
            error,
            'Failed to update laporan penerimaan barang'
          )
        );
        throw error;
      }
    },
    [handleAuthRedirect]
  );

  const bulkDeleteReports = useCallback(
    async (ids = []) => {
      const payloadIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

      if (!payloadIds.length) {
        toastService.warning(
          'Pilih minimal satu laporan penerimaan barang untuk dihapus.'
        );
        return null;
      }

      try {
        const result =
          await laporanPenerimaanBarangService.bulkDeleteReports(payloadIds);

        if (result?.success === false) {
          throw new Error(
            result?.message ||
              result?.error?.message ||
              'Failed to delete laporan penerimaan barang'
          );
        }

        const responseData = result?.data || result || {};
        const successItems = Array.isArray(responseData?.success)
          ? responseData.success
          : [];
        const failedItems = Array.isArray(responseData?.failed)
          ? responseData.failed
          : [];

        if (successItems.length > 0) {
          const baseMessage = `Berhasil menghapus ${successItems.length} laporan penerimaan barang.`;
          if (failedItems.length > 0) {
            toastService.success(
              `${baseMessage} ${failedItems.length} laporan gagal dihapus.`
            );
          } else {
            toastService.success(baseMessage);
          }
        }

        if (!successItems.length && failedItems.length > 0) {
          toastService.warning(
            `${failedItems.length} laporan gagal dihapus.`
          );
        }

        return { success: successItems, failed: failedItems };
      } catch (error) {
        if (isAuthError(error)) {
          handleAuthRedirect();
          return null;
        }

        toastService.error(
          getErrorMessage(
            error,
            'Failed to delete laporan penerimaan barang'
          )
        );
        throw error;
      }
    },
    [handleAuthRedirect]
  );

  const completeReports = useCallback(
    async (ids = []) => {
      const payloadIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

      if (!payloadIds.length) {
        toastService.warning(
          'Pilih minimal satu laporan penerimaan barang untuk diselesaikan.'
        );
        return null;
      }

      try {
        const result =
          await laporanPenerimaanBarangService.completeReports(payloadIds);

        if (result?.success === false) {
          throw new Error(
            result?.message ||
              result?.error?.message ||
              'Failed to complete laporan penerimaan barang'
          );
        }

        const responseData = result?.data || result || {};
        const successItems = Array.isArray(responseData?.success)
          ? responseData.success
          : [];
        const failedItems = Array.isArray(responseData?.failed)
          ? responseData.failed
          : [];

        if (successItems.length > 0) {
          const baseMessage = `Berhasil menyelesaikan ${successItems.length} laporan penerimaan barang.`;
          if (failedItems.length > 0) {
            toastService.success(
              `${baseMessage} ${failedItems.length} laporan gagal diselesaikan.`
            );
          } else {
            toastService.success(baseMessage);
          }
        }

        if (!successItems.length && failedItems.length > 0) {
          toastService.warning(
            `${failedItems.length} laporan gagal diselesaikan.`
          );
        }

        return { success: successItems, failed: failedItems };
      } catch (error) {
        if (isAuthError(error)) {
          handleAuthRedirect();
          return null;
        }

        toastService.error(
          getErrorMessage(
            error,
            'Failed to complete laporan penerimaan barang'
          )
        );
        throw error;
      }
    },
    [handleAuthRedirect]
  );

  const fetchReportById = useCallback(
    async (id) => {
      if (!id) {
        return null;
      }

      try {
        const result = await laporanPenerimaanBarangService.getReportById(id);

        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to fetch laporan penerimaan barang detail'
          );
        }

        return result?.data || result;
      } catch (error) {
        if (isAuthError(error)) {
          handleAuthRedirect();
          return null;
        }

        toastService.error(
          getErrorMessage(
            error,
            'Failed to fetch laporan penerimaan barang detail'
          )
        );
        throw error;
      }
    },
    [handleAuthRedirect]
  );

  return {
    createReport,
    uploadBulkReports,
    uploadBulkReportsTextExtraction,
    updateReport,
    bulkDeleteReports,
    completeReports,
    fetchReportById,
  };
};

export default useLaporanPenerimaanBarangPage;
