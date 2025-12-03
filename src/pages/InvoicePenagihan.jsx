import React, { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useInvoicePenagihan from '@/hooks/useInvoicePenagihanPage';
import InvoicePenagihanTableServerSide from '@/components/invoicePenagihan/InvoicePenagihanTableServerSide';
import AddInvoicePenagihanModal from '@/components/invoicePenagihan/AddInvoicePenagihanModal';
import InvoicePenagihanDetailCard from '@/components/invoicePenagihan/InvoicePenagihanDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

const InvoicePenagihanPage = () => {
  const queryClient = useQueryClient();
  
  const {
    setInvoicePenagihan,
    deleteInvoiceConfirmation,
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

  const viewDetailRequestRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['invoicePenagihan'] });
  }, [queryClient]);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);


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

  return (
    <div className='p-3 space-y-3'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-3 py-3'>
          <div className='mb-2 flex justify-between items-center'>
            <h3 className='text-sm font-semibold text-gray-900'>
              Invoice Penagihan
            </h3>
          </div>

          <InvoicePenagihanTableServerSide
            onDelete={showDeleteConfirmation}
            deleteLoading={deleteDialogLoading}
            initialPage={1}
            initialLimit={10}
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
    </div>
  );
};

export default InvoicePenagihanPage;
