import React, { useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SuratJalanTableServerSide } from '@/components/suratJalan';
import {
  ConfirmationDialog as BaseConfirmationDialog,
  useConfirmationDialog,
} from '@/components/ui/ConfirmationDialog';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import SuratJalanDetailCard from '../components/suratJalan/SuratJalanDetailCard';
import suratJalanService from '../services/suratJalanService';
import toastService from '../services/toastService';
import { useNavigate } from 'react-router-dom';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const SuratJalan = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedSuratJalanForDetail, setSelectedSuratJalanForDetail] = useState(null);
  const [selectedSuratJalan, setSelectedSuratJalan] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUnprocessing, setIsUnprocessing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const tableFiltersRef = useRef({});

  // Process dialog state
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processFormData, setProcessFormData] = useState({
    checker: '',
    driver: '',
    mobil: '',
    kota: '',
  });
  const [itemsToProcess, setItemsToProcess] = useState([]);

  const {
    showDialog: showDeleteDialog,
    hideDialog: hideDeleteDialog,
    setLoading: setDeleteDialogLoading,
    ConfirmationDialog: DeleteConfirmationDialog,
  } = useConfirmationDialog();


  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const handleViewDetail = async (suratJalanItem) => {
    if (!suratJalanItem?.id) {
      toastService.error('Surat jalan tidak valid');
      return;
    }

    // Toggle detail card: if clicking the same row, close it
    if (selectedSuratJalanForDetail?.id === suratJalanItem.id) {
      setSelectedSuratJalanForDetail(null);
      return;
    }

    try {
      setDetailLoading(true);
      const response = await suratJalanService.getSuratJalanById(suratJalanItem.id);
      const detailData = response?.data?.data ?? response?.data;

      if (response?.success === false || !detailData) {
        toastService.error(response?.message || 'Gagal memuat detail surat jalan');
        return;
      }

      setSelectedSuratJalanForDetail(detailData);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }
      console.error('Error fetching surat jalan detail:', err);
      toastService.error('Gagal memuat detail surat jalan');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSuratJalanForDetail(null);
  };

  const handleDelete = useCallback((id) => {
    showDeleteDialog({
      title: 'Hapus Surat Jalan',
      message: 'Apakah Anda yakin ingin menghapus surat jalan ini?',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: async () => {
        setDeleteDialogLoading(true);
        try {
          await suratJalanService.deleteSuratJalan(id);
          toastService.success('Surat jalan berhasil dihapus');
          // Invalidate queries to refresh data
          await queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
          hideDeleteDialog();
        } catch (err) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            handleAuthError();
            return;
          }
          const message =
            err?.response?.data?.error?.message ||
            err?.message ||
            'Gagal menghapus surat jalan';
          toastService.error(message);
        } finally {
          setDeleteDialogLoading(false);
        }
      },
    });
  }, [showDeleteDialog, hideDeleteDialog, setDeleteDialogLoading, handleAuthError, queryClient]);

  const handleSelectSuratJalan = useCallback((suratJalanItem) => {
    setSelectedSuratJalan((prevSelected) => {
      const itemId = typeof suratJalanItem === 'string' ? suratJalanItem : suratJalanItem?.id;
      if (prevSelected.some(item => (typeof item === 'string' ? item : item?.id) === itemId)) {
        return prevSelected.filter((item) => (typeof item === 'string' ? item : item?.id) !== itemId);
      }
      return [...prevSelected, suratJalanItem];
    });
  }, []);

  const handleSelectAllSuratJalan = useCallback((items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
      setSelectedSuratJalan([]);
      return;
    }

    const validItems = items.filter(item => item && item.id);

    setSelectedSuratJalan((prevSelected) => {
      if (validItems.length === 0) {
        return [];
      }

      const prevIds = prevSelected.map(item => typeof item === 'string' ? item : item?.id);
      const isAllSelected = validItems.every((item) => prevIds.includes(item.id));
      return isAllSelected ? [] : validItems;
    });
  }, []);

  const handleProcessSelected = useCallback(() => {
    // Filter only unprocessed items
    const unprocessedItems = selectedSuratJalan.filter(item => !item?.checklistSuratJalanId);

    if (unprocessedItems.length === 0) {
      toastService.error('Pilih minimal satu surat jalan yang belum diproses');
      return;
    }

    // Store items to process and show dialog
    setItemsToProcess(unprocessedItems);
    setProcessFormData({ checker: '', driver: '', mobil: '', kota: '' });
    setShowProcessDialog(true);
  }, [selectedSuratJalan]);

  const handleProcessConfirm = useCallback(async () => {
    if (itemsToProcess.length === 0) return;

    setIsProcessing(true);
    try {
      const selectedIds = itemsToProcess.map(item => typeof item === 'string' ? item : item?.id).filter(Boolean);
      const requestBody = {
        ids: selectedIds,
        checklist: {
          status_code: 'PENDING CHECKLIST SURAT JALAN',
          tanggal: new Date().toISOString(),
          checker: processFormData.checker || undefined,
          driver: processFormData.driver || undefined,
          mobil: processFormData.mobil || undefined,
          kota: processFormData.kota || undefined,
        },
      };

      const response = await suratJalanService.processSuratJalan(requestBody);

      if (response?.success === false) {
        const errorMessage =
          response?.message ||
          response?.error?.message ||
          'Gagal memproses surat jalan';
        toastService.error(errorMessage);
        return;
      }

      const successMessage =
        response?.data?.message ||
        `Surat jalan berhasil diproses (${itemsToProcess.length})`;
      toastService.success(successMessage);

      setSelectedSuratJalan([]);
      setShowProcessDialog(false);
      setItemsToProcess([]);

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Gagal memproses surat jalan';
      toastService.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [itemsToProcess, processFormData, handleAuthError, queryClient]);

  const handleUnprocessSelected = useCallback(() => {
    // Filter only processed items
    const processedItems = selectedSuratJalan.filter(item => item?.checklistSuratJalanId);

    if (processedItems.length === 0) {
      toastService.error('Pilih minimal satu surat jalan yang sudah diproses');
      return;
    }

    const selectedSummary = processedItems
      .map((item) => {
        if (!item) return null;
        return {
          id: item.id,
          display: item.no_surat_jalan || '(No. Surat Jalan tidak tersedia)',
          subtitle: item.deliver_to || item.deliverTo || undefined,
        };
      })
      .filter((item) => item !== null);

    const summaryList = selectedSummary
      .map((item) => `• ${item.display}${item.subtitle ? ` - ${item.subtitle}` : ''}`)
      .join('\n');

    showDeleteDialog({
      title: 'Unprocess Surat Jalan',
      message: `Anda akan menghapus ${processedItems.length} surat jalan dari checklist:\n\n${summaryList}\n\nStok akan dikembalikan. Lanjutkan?`,
      confirmText: 'Unprocess',
      cancelText: 'Batal',
      type: 'warning',
      onConfirm: async () => {
        setDeleteDialogLoading(true);
        setIsUnprocessing(true);
        try {
          const selectedIds = processedItems.map(item => typeof item === 'string' ? item : item?.id).filter(Boolean);

          const response = await suratJalanService.unprocessSuratJalan(selectedIds);

          if (response?.success === false) {
            const errorMessage =
              response?.message ||
              response?.error?.message ||
              'Gagal unprocess surat jalan';
            toastService.error(errorMessage);
            return;
          }

          const successMessage =
            response?.data?.message ||
            `${processedItems.length} surat jalan berhasil di-unprocess`;
          toastService.success(successMessage);

          setSelectedSuratJalan([]);
          hideDeleteDialog();

          // Invalidate queries to refresh data
          await queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
          await queryClient.invalidateQueries({ queryKey: ['checklist-surat-jalan'] });
        } catch (err) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            handleAuthError();
            return;
          }
          const message =
            err?.response?.data?.error?.message ||
            err?.message ||
            'Gagal unprocess surat jalan';
          toastService.error(message);
        } finally {
          setDeleteDialogLoading(false);
          setIsUnprocessing(false);
        }
      },
    });
  }, [selectedSuratJalan, showDeleteDialog, hideDeleteDialog, setDeleteDialogLoading, handleAuthError, queryClient]);

  const handleCancel = useCallback((id, noSuratJalan) => {
    showDeleteDialog({
      title: 'Cancel Surat Jalan',
      message: `Apakah Anda yakin ingin membatalkan surat jalan "${noSuratJalan}"?\n\nPO, Invoice Pengiriman, dan Packing yang terkait juga akan dibatalkan.\nStok akan dikembalikan jika sudah diproses.`,
      confirmText: 'Cancel',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: async () => {
        setDeleteDialogLoading(true);
        setCancelLoading(true);
        try {
          const response = await suratJalanService.cancelSuratJalan(id);

          if (response?.success === false) {
            const errorMessage =
              response?.message ||
              response?.error?.message ||
              'Gagal membatalkan surat jalan';
            toastService.error(errorMessage);
            return;
          }

          toastService.success(response?.data?.message || 'Surat jalan berhasil dibatalkan');
          hideDeleteDialog();

          // Invalidate queries to refresh data
          await queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
          await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          await queryClient.invalidateQueries({ queryKey: ['invoice-pengiriman'] });
          await queryClient.invalidateQueries({ queryKey: ['packing'] });
        } catch (err) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            handleAuthError();
            return;
          }
          const message =
            err?.response?.data?.error?.message ||
            err?.message ||
            'Gagal membatalkan surat jalan';
          toastService.error(message);
        } finally {
          setDeleteDialogLoading(false);
          setCancelLoading(false);
        }
      },
    });
  }, [showDeleteDialog, hideDeleteDialog, setDeleteDialogLoading, handleAuthError, queryClient]);





  const handleSuratJalanUpdated = useCallback(() => {
    // Refresh data after update from Detail Card
    queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
    // We might want to refresh the detail view as well if it's open, 
    // but SuratJalanDetailCard handles its own internal state update via onUpdate callback if we pass it correctly?
    // Actually, if we invalidate queries, the table updates. 
    // For the detail card, if we want it to reflect changes immediately, we might need to re-fetch or update local state.
    // But let's see how Companies.jsx does it.
    // Companies.jsx: fetchCompanies(pagination.currentPage, pagination.itemsPerPage); handleViewDetail(selectedCompanyForDetail);

    if (selectedSuratJalanForDetail) {
      // Re-fetch detail to ensure consistency
      handleViewDetail(selectedSuratJalanForDetail);
    }
  }, [queryClient, selectedSuratJalanForDetail]);

  const handleFiltersChange = useCallback((filters) => {
    tableFiltersRef.current = filters;
  }, []);

  const handleExportExcel = () => {
    setShowExportConfirmation(true);
  };

  const confirmExportExcel = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);
      await suratJalanService.exportExcel(tableFiltersRef.current);
      toastService.success('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      toastService.error(err.message || 'Gagal mengexport data');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className='p-3 space-y-3'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-3 py-3'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-semibold text-gray-900'>Manajemen Surat Jalan</h3>
            <button
              onClick={handleExportExcel}
              disabled={exportLoading}
              className="inline-flex items-center px-2.5 py-1.5 text-xs bg-green-600 text-white font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                  Export Excel
                </>
              )}
            </button>
          </div>

          <SuratJalanTableServerSide
            onDelete={handleDelete}
            onCancel={handleCancel}
            deleteLoading={deleteLoading}
            cancelLoading={cancelLoading}
            selectedSuratJalan={selectedSuratJalan}
            onSelectSuratJalan={handleSelectSuratJalan}
            onSelectAllSuratJalan={handleSelectAllSuratJalan}
            onProcessSelected={handleProcessSelected}
            onUnprocessSelected={handleUnprocessSelected}
            isProcessing={isProcessing}
            isUnprocessing={isUnprocessing}
            hasSelectedSuratJalan={selectedSuratJalan.length > 0}
            onRowClick={handleViewDetail}
            selectedSuratJalanId={selectedSuratJalanForDetail?.id}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      </div>

      <DeleteConfirmationDialog />

      {selectedSuratJalanForDetail && (
        <SuratJalanDetailCard suratJalan={selectedSuratJalanForDetail} onClose={handleCloseDetail} loading={detailLoading} onUpdate={handleSuratJalanUpdated} />
      )}

      {/* Export Confirmation Dialog */}
      <ConfirmationDialog
        show={showExportConfirmation}
        onClose={() => setShowExportConfirmation(false)}
        onConfirm={confirmExportExcel}
        title="Konfirmasi Export"
        message="Apakah Anda yakin ingin mengexport data ini ke Excel?"
        type="info"
        confirmText="Ya, Export"
        cancelText="Batal"
        loading={exportLoading}
      />

      {/* Process Surat Jalan Dialog with Form Fields */}
      {showProcessDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => !isProcessing && setShowProcessDialog(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Proses Surat Jalan</h3>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-4">
              {/* Summary of selected items */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Akan memproses {itemsToProcess.length} surat jalan:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 max-h-32 overflow-y-auto">
                  {itemsToProcess.map((item) => (
                    <li key={item.id}>
                      • {item.no_surat_jalan || '(No. Surat Jalan tidak tersedia)'}
                      {(item.deliver_to || item.deliverTo) && ` - ${item.deliver_to || item.deliverTo}`}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="process-checker" className="block text-sm font-medium text-gray-700 mb-1">
                    Checker
                  </label>
                  <input
                    id="process-checker"
                    type="text"
                    value={processFormData.checker}
                    onChange={(e) => setProcessFormData(prev => ({ ...prev, checker: e.target.value }))}
                    placeholder="Nama checker..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label htmlFor="process-driver" className="block text-sm font-medium text-gray-700 mb-1">
                    Driver
                  </label>
                  <input
                    id="process-driver"
                    type="text"
                    value={processFormData.driver}
                    onChange={(e) => setProcessFormData(prev => ({ ...prev, driver: e.target.value }))}
                    placeholder="Nama driver..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label htmlFor="process-mobil" className="block text-sm font-medium text-gray-700 mb-1">
                    Kendaraan
                  </label>
                  <input
                    id="process-mobil"
                    type="text"
                    value={processFormData.mobil}
                    onChange={(e) => setProcessFormData(prev => ({ ...prev, mobil: e.target.value }))}
                    placeholder="Nomor plat / jenis kendaraan..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label htmlFor="process-kota" className="block text-sm font-medium text-gray-700 mb-1">
                    Kota
                  </label>
                  <input
                    id="process-kota"
                    type="text"
                    value={processFormData.kota}
                    onChange={(e) => setProcessFormData(prev => ({ ...prev, kota: e.target.value }))}
                    placeholder="Kota tujuan..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                * Tanggal checklist akan diisi dengan tanggal sekarang
              </p>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProcessDialog(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessConfirm}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  'Proses'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuratJalan;
