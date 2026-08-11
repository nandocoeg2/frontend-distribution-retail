import React, { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useInvoicePenagihan from '@/hooks/useInvoicePenagihanPage';
import InvoicePenagihanTableServerSide from '@/components/invoicePenagihan/InvoicePenagihanTableServerSide';
import AddInvoicePenagihanModal from '@/components/invoicePenagihan/AddInvoicePenagihanModal';
import InvoicePenagihanDetailCard from '@/components/invoicePenagihan/InvoicePenagihanDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import toastService from '@/services/toastService';
import invoicePenagihanService from '@/services/invoicePenagihanService';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const InvoicePenagihanPage = () => {
  const queryClient = useQueryClient();

  const {
    setInvoicePenagihan,
    deleteInvoiceConfirmation,
    cancelInvoiceConfirmation,
    createInvoice,
    updateInvoice,
    handleAuthError,
  } = useInvoicePenagihan();

  const {
    showConfirm: showDeleteDialog,
    hideDeleteConfirmation,
    confirmDelete,
    showDeleteConfirmation,
    title: deleteDialogTitle,
    message: deleteDialogMessage,
    loading: deleteDialogLoading,
  } = deleteInvoiceConfirmation;

  const {
    showConfirm: showCancelDialog,
    hideDeleteConfirmation: hideCancelConfirmation,
    confirmDelete: confirmCancel,
    showDeleteConfirmation: showCancelConfirmation,
    title: cancelDialogTitle,
    message: cancelDialogMessage,
    loading: cancelDialogLoading,
  } = cancelInvoiceConfirmation;

  const viewDetailRequestRef = useRef(null);
  const tableRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);

  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [bulkCancelling, setBulkCancelling] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkCancelDialog, setShowBulkCancelDialog] = useState(false);

  const handleSelectionChange = useCallback((id, isSelected) => {
    setSelectedInvoices((prev) => {
      if (isSelected) {
        return [...prev, id];
      } else {
        return prev.filter((item) => item !== id);
      }
    });
  }, []);

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['invoicePenagihan'] });
  }, [queryClient]);

  const handleBulkCancel = useCallback(() => {
    if (selectedInvoices.length === 0) {
      toastService.warning('Pilih minimal satu invoice penagihan untuk dibatalkan.');
      return;
    }
    setShowBulkCancelDialog(true);
  }, [selectedInvoices]);

  const confirmBulkCancel = async () => {
    setBulkCancelling(true);
    try {
      const idsSnapshot = [...selectedInvoices];
      const result = await invoicePenagihanService.bulkCancelInvoicePenagihan(idsSnapshot);
      const resultData = result?.data || result;

      setShowBulkCancelDialog(false);
      
      const successCount = resultData?.successCount || 0;
      const failedCount = resultData?.failedIds?.length || 0;

      if (successCount > 0 && failedCount === 0) {
        toastService.success(`Berhasil membatalkan ${successCount} invoice penagihan.`);
      } else if (successCount > 0 && failedCount > 0) {
        toastService.warning(`Berhasil membatalkan ${successCount} invoice penagihan. ${failedCount} gagal dibatalkan.`);
      } else {
        toastService.error(`Gagal membatalkan invoice penagihan.`);
      }

      await refreshData();
      setSelectedInvoices([]);
      if (viewingInvoice && idsSnapshot.includes(viewingInvoice.id)) {
        setViewingInvoice(null);
      }
    } catch (err) {
      toastService.error(err.message || 'Gagal membatalkan invoice penagihan.');
    } finally {
      setBulkCancelling(false);
    }
  };

  const handleBulkDelete = useCallback(() => {
    if (selectedInvoices.length === 0) {
      toastService.warning('Pilih minimal satu invoice penagihan untuk dihapus.');
      return;
    }
    setShowBulkDeleteDialog(true);
  }, [selectedInvoices]);

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const idsSnapshot = [...selectedInvoices];
      const result = await invoicePenagihanService.bulkDeleteInvoicePenagihan(idsSnapshot);
      const resultData = result?.data || result;

      setShowBulkDeleteDialog(false);

      const successCount = resultData?.successCount || 0;
      const failedCount = resultData?.failedIds?.length || 0;

      if (successCount > 0 && failedCount === 0) {
        toastService.success(`Berhasil menghapus ${successCount} invoice penagihan.`);
      } else if (successCount > 0 && failedCount > 0) {
        toastService.warning(`Berhasil menghapus ${successCount} invoice penagihan. ${failedCount} gagal dihapus.`);
      } else {
        toastService.error(`Gagal menghapus invoice penagihan.`);
      }

      await refreshData();
      setSelectedInvoices([]);
      if (viewingInvoice && idsSnapshot.includes(viewingInvoice.id)) {
        setViewingInvoice(null);
      }
    } catch (err) {
      toastService.error(err.message || 'Gagal menghapus invoice penagihan.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const handleExportExcel = () => {
    setShowExportConfirmation(true);
  };

  const confirmExportExcel = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);

      // Get current filters from table
      const filters = tableRef.current?.getFilters?.() || {};

      await invoicePenagihanService.exportExcelInvoicePenagihan(filters);
      toastService.success('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
      } else {
        toastService.error(err.message || 'Gagal mengexport data');
      }
    } finally {
      setExportLoading(false);
    }
  };

  const handleViewDetail = useCallback(
    async (selectedInvoice) => {
      if (!selectedInvoice) {
        return;
      }

      // If clicking the same invoice, close it
      if (viewingInvoice && viewingInvoice.id === selectedInvoice.id) {
        setViewingInvoice(null);
        return;
      }

      setViewingInvoice(selectedInvoice);

      const invoiceId = selectedInvoice.id;
      if (!invoiceId) {
        return;
      }

      setViewDetailLoading(true);
      try {
        viewDetailRequestRef.current = invoiceId;
        const response = await invoicePenagihanService.getInvoicePenagihanById(
          invoiceId
        );
        const detailPayload = response?.data ?? response;
        const detailedInvoice =
          detailPayload?.data && !Array.isArray(detailPayload.data)
            ? detailPayload.data
            : detailPayload;

        if (detailedInvoice) {
          setViewingInvoice((prev) => {
            if (viewDetailRequestRef.current !== invoiceId) {
              return prev;
            }
            if (!prev) {
              return prev;
            }
            if (invoiceId && prev.id && prev.id !== invoiceId) {
              return prev;
            }
            return detailedInvoice;
          });
        }
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
        } else {
          const message =
            err?.response?.data?.error?.message ||
            err?.message ||
            'Gagal memuat detail invoice penagihan.';
          toastService.error(message);
        }
        console.error('Failed to fetch invoice penagihan detail:', err);
      } finally {
        if (viewDetailRequestRef.current === invoiceId) {
          viewDetailRequestRef.current = null;
          setViewDetailLoading(false);
        }
      }
    },
    [handleAuthError, viewingInvoice]
  );

  const handleCloseDetail = useCallback(() => {
    viewDetailRequestRef.current = null;
    setViewingInvoice(null);
    setViewDetailLoading(false);
  }, []);

  const handleInvoiceCreated = useCallback(
    async (payload) => {
      const createdInvoice = await createInvoice(payload);
      if (createdInvoice) {
        setInvoicePenagihan((prev) => {
          const previous = Array.isArray(prev) ? prev : [];
          const exists = previous.some((item) => item.id === createdInvoice.id);
          if (exists) {
            return previous.map((item) =>
              item.id === createdInvoice.id ? createdInvoice : item
            );
          }
          return [...previous, createdInvoice];
        });
        await refreshData();
      }
      return createdInvoice;
    },
    [createInvoice, setInvoicePenagihan, refreshData]
  );

  const handleInvoiceUpdated = useCallback(
    async (id, payload) => {
      const updatedInvoice = await updateInvoice(id, payload);
      if (updatedInvoice) {
        setInvoicePenagihan((prev) => {
          const previous = Array.isArray(prev) ? prev : [];
          return previous.map((invoice) =>
            invoice.id === updatedInvoice.id ? updatedInvoice : invoice
          );
        });
        await refreshData();
      }
      return updatedInvoice;
    },
    [setInvoicePenagihan, updateInvoice, refreshData]
  );

  const handleDeleteConfirm = useCallback(async () => {
    await confirmDelete();
    await refreshData();
  }, [confirmDelete, refreshData]);

  const handleCancelConfirm = useCallback(async () => {
    await confirmCancel();
    await refreshData();
    // Close detail card if viewing cancelled invoice
    if (viewingInvoice) {
      setViewingInvoice(null);
    }
  }, [confirmCancel, refreshData, viewingInvoice]);

  return (
    <div>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-3 py-3 space-y-2'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900'>
              Invoice Penagihan
            </h3>
            <div className='flex flex-wrap gap-2'>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {exportLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5'></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className='h-4 w-4 mr-1.5' />
                    Export Excel
                  </>
                )}
              </button>
            </div>
          </div>

          <InvoicePenagihanTableServerSide
            ref={tableRef}
            selectedInvoices={selectedInvoices}
            onSelectionChange={handleSelectionChange}
            onBulkCancel={handleBulkCancel}
            onBulkDelete={handleBulkDelete}
            isCancelling={bulkCancelling}
            isDeleting={bulkDeleting}
            hasSelectedInvoices={selectedInvoices.length > 0}
            selectedInvoiceId={viewingInvoice?.id}
            onRowClick={handleViewDetail}
          />
        </div>
      </div>

      <AddInvoicePenagihanModal
        show={showAddModal}
        onClose={closeAddModal}
        onCreate={handleInvoiceCreated}
      />


      {viewingInvoice && (
        <InvoicePenagihanDetailCard
          invoice={viewingInvoice}
          onClose={handleCloseDetail}
          onUpdate={handleInvoiceUpdated}
          isLoading={viewDetailLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        show={showDeleteDialog}
        onClose={hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteDialogTitle}
        message={deleteDialogMessage}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteDialogLoading}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        show={showCancelDialog}
        onClose={hideCancelConfirmation}
        onConfirm={handleCancelConfirm}
        title={cancelDialogTitle}
        message={cancelDialogMessage}
        type='warning'
        confirmText='Ya, Batalkan'
        cancelText='Tidak'
        loading={cancelDialogLoading}
      />

      {/* Export Confirmation Dialog */}
      <ConfirmationDialog
        show={showExportConfirmation}
        onClose={() => setShowExportConfirmation(false)}
        onConfirm={confirmExportExcel}
        title='Konfirmasi Export'
        message='Apakah Anda yakin ingin mengexport data ini ke Excel?'
        type='info'
        confirmText='Ya, Export'
        cancelText='Batal'
        loading={exportLoading}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        show={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={confirmBulkDelete}
        title="Hapus Invoice Penagihan"
        message={`Apakah Anda yakin ingin menghapus ${selectedInvoices.length} invoice penagihan yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={bulkDeleting}
      />

      {/* Bulk Cancel Confirmation Dialog */}
      <ConfirmationDialog
        show={showBulkCancelDialog}
        onClose={() => setShowBulkCancelDialog(false)}
        onConfirm={confirmBulkCancel}
        title="Batalkan Invoice Penagihan"
        message={`Apakah Anda yakin ingin membatalkan ${selectedInvoices.length} invoice penagihan yang dipilih?\n\nTindakan ini akan:\n• Mengubah status menjadi CANCELLED\n• Menghapus Kwitansi terkait\n• Menghapus referensi Faktur Pajak`}
        type='warning'
        confirmText='Ya, Batalkan'
        cancelText='Tidak'
        loading={bulkCancelling}
      />
    </div>
  );
};

export default InvoicePenagihanPage;
