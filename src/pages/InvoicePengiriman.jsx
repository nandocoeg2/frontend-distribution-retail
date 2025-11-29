import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useInvoicePengiriman from '@/hooks/useInvoicePengirimanPage';
import { InvoicePengirimanTableServerSide } from '@/components/invoicePengiriman';
import AddInvoicePengirimanModal from '@/components/invoicePengiriman/AddInvoicePengirimanModal';
import ViewInvoicePengirimanModal from '@/components/invoicePengiriman/ViewInvoicePengirimanModal';
import InvoicePengirimanDetailCard from '@/components/invoicePengiriman/InvoicePengirimanDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import invoicePengirimanService from '@/services/invoicePengirimanService';

const INITIAL_TAB_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const InvoicePengirimanPage = () => {
  const queryClient = useQueryClient();

  const {
    invoicePengiriman,
    setInvoicePengiriman,
    pagination,
    loading,
    error,
    handlePageChange,
    handleLimitChange,
    deleteInvoiceConfirmation,
    handleAuthError,
  } = useInvoicePengiriman();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [viewModalError, setViewModalError] = useState(null);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const fetchInvoiceDetail = useCallback(
    async (id) => {
      try {
        const response =
          await invoicePengirimanService.getInvoicePengirimanById(id);
        if (response?.success === false) {
          throw new Error(
            response?.error?.message || 'Gagal memuat detail invoice pengiriman'
          );
        }
        return response?.data ?? response;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return null;
        }
        throw err;
      }
    },
    [handleAuthError]
  );

  const loadInvoiceIntoState = useCallback(
    async (id, setInvoice, setLoadingState, setErrorState) => {
      if (!id) {
        return;
      }
      setLoadingState(true);
      setErrorState(null);
      try {
        const detail = await fetchInvoiceDetail(id);
        if (detail) {
          setInvoice(detail);
        }
      } catch (err) {
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Gagal memuat detail invoice pengiriman';
        setErrorState(message);
      } finally {
        setLoadingState(false);
      }
    },
    [fetchInvoiceDetail]
  );

  const handleTablePageChange = useCallback(
    (page) => {
      handlePageChange(page);
    },
    [handlePageChange]
  );

  const handleTableLimitChange = useCallback(
    (limit) => {
      handleLimitChange(limit);
    },
    [handleLimitChange]
  );

  const refreshActiveTab = useCallback(() => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    handlePageChange(currentPage);
  }, [handlePageChange, pagination]);

  const handleInvoicePenagihanToggle = useCallback((invoice) => {
    // Functionality removed - no longer needed
  }, []);

  const closeCreatePenagihanDialog = useCallback(() => {
    // Functionality removed - no longer needed
  }, []);

  const confirmCreateInvoicePenagihan = useCallback(async () => {
    // Functionality removed - no longer needed
  }, []);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);



  const openViewModal = useCallback(
    (invoice) => {
      if (!invoice?.id) {
        console.error('Invoice ID tidak ditemukan untuk modal view');
        return;
      }
      setViewingInvoiceId(invoice.id);
      setViewingInvoice(invoice);
      setShowViewModal(true);
      loadInvoiceIntoState(
        invoice.id,
        setViewingInvoice,
        setViewModalLoading,
        setViewModalError
      );
    },
    [loadInvoiceIntoState]
  );

  const closeViewModal = useCallback(() => {
    setViewingInvoice(null);
    setViewingInvoiceId(null);
    setViewModalError(null);
    setViewModalLoading(false);
    setShowViewModal(false);
  }, []);

  const reloadViewingInvoice = useCallback(() => {
    if (!viewingInvoiceId) {
      return;
    }
    loadInvoiceIntoState(
      viewingInvoiceId,
      setViewingInvoice,
      setViewModalLoading,
      setViewModalError
    );
  }, [loadInvoiceIntoState, viewingInvoiceId]);

  const handleViewDetail = useCallback(
    async (invoice) => {
      if (!invoice?.id) {
        console.error('Invoice ID tidak ditemukan untuk detail view');
        return;
      }

      setDetailLoading(true);
      try {
        // Fetch detail data using GET /:id endpoint
        const detailData = await fetchInvoiceDetail(invoice.id);
        setSelectedInvoiceForDetail(detailData);
      } catch (err) {
        // If fetch fails, fallback to list data
        console.warn('Failed to fetch invoice details, using list data:', err.message);
        setSelectedInvoiceForDetail(invoice);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchInvoiceDetail]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedInvoiceForDetail(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['invoicePengiriman'] });
    refreshActiveTab();
    closeAddModal();
  }, [closeAddModal, refreshActiveTab, queryClient]);

  const handleInvoiceAdded = (newInvoice) => {
    if (!newInvoice) {
      return;
    }
    setInvoicePengiriman((prev) => [...prev, newInvoice]);
    closeAddModal();
    handleModalSuccess();
  };

  const handleInvoiceUpdated = useCallback(() => {
    handleModalSuccess();
    // Update selected detail if it's the one being edited
    if (selectedInvoiceForDetail) {
      // We can re-fetch the detail or let the user do it. 
      // Since we have onUpdate in DetailCard which calls this, we might want to re-fetch detail here or in DetailCard.
      // Actually DetailCard calls onUpdate after successful save.
      // We should probably re-fetch the selected detail here if we want it to update immediately without closing.
      // But DetailCard handles its own form submission.
      // Let's just refresh the list for now.
      fetchInvoiceDetail(selectedInvoiceForDetail.id).then(updatedDetail => {
        if (updatedDetail) {
          setSelectedInvoiceForDetail(updatedDetail);
        }
      });
    }
  }, [handleModalSuccess, selectedInvoiceForDetail, fetchInvoiceDetail]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteInvoiceConfirmation.confirmDelete();
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['invoicePengiriman'] });
    } finally {
      refreshActiveTab();
    }
  }, [deleteInvoiceConfirmation, refreshActiveTab, queryClient]);

  const handleSelectInvoice = useCallback((invoiceId) => {
    setSelectedInvoices((prev) => {
      if (prev.includes(invoiceId)) {
        return prev.filter((id) => id !== invoiceId);
      }
      return [...prev, invoiceId];
    });
  }, []);

  const handleSelectAllInvoices = useCallback((currentInvoices) => {
    if (selectedInvoices.length === currentInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(currentInvoices.map((invoice) => invoice.id));
    }
  }, [selectedInvoices.length]);

  const hasSelectedInvoices = selectedInvoices.length > 0;

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
        <p className='text-red-800'>Terjadi kesalahan: {error}</p>
        <p className='mt-2 text-sm text-red-600'>
          Halaman akan otomatis mencoba lagi. Jika masalah berlanjut, silakan
          refresh halaman.
        </p>
      </div>
    );
  }

  const resolvedPagination = pagination || INITIAL_TAB_PAGINATION;

  return (
    <div className='p-3 space-y-3'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-3 py-3'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-semibold text-gray-900'>Invoice Pengiriman</h3>
          </div>

          <InvoicePengirimanTableServerSide
            onView={openViewModal}
            onDelete={deleteInvoiceConfirmation.showDeleteConfirmation}
            deleteLoading={deleteInvoiceConfirmation.loading}
            selectedInvoices={selectedInvoices}
            onSelectInvoice={handleSelectInvoice}
            onSelectAllInvoices={handleSelectAllInvoices}
            hasSelectedInvoices={hasSelectedInvoices}
            initialPage={resolvedPagination.currentPage}
            initialLimit={resolvedPagination.itemsPerPage}
            onViewDetail={handleViewDetail}
            selectedInvoiceId={selectedInvoiceForDetail?.id}
          />
        </div>
      </div>

      {selectedInvoiceForDetail && (
        <InvoicePengirimanDetailCard invoice={selectedInvoiceForDetail} onClose={handleCloseDetail} loading={detailLoading} onUpdate={handleInvoiceUpdated} />
      )}

      <AddInvoicePengirimanModal
        show={showAddModal}
        onClose={closeAddModal}
        onInvoiceAdded={handleInvoiceAdded}
        handleAuthError={handleAuthError}
      />

      <ViewInvoicePengirimanModal
        show={showViewModal}
        onClose={closeViewModal}
        invoice={viewingInvoice}
        loading={viewModalLoading}
        error={viewModalError}
        onRetry={reloadViewingInvoice}
      />

      <ConfirmationDialog
        show={deleteInvoiceConfirmation.showConfirm}
        onClose={deleteInvoiceConfirmation.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteInvoiceConfirmation.title}
        message={deleteInvoiceConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteInvoiceConfirmation.loading}
      />
    </div>
  );
};

export default InvoicePengirimanPage;
