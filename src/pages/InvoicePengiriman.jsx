import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useInvoicePengiriman from '@/hooks/useInvoicePengirimanPage';
import { InvoicePengirimanTableServerSide } from '@/components/invoicePengiriman';
import AddInvoicePengirimanModal from '@/components/invoicePengiriman/AddInvoicePengirimanModal';
import EditInvoicePengirimanModal from '@/components/invoicePengiriman/EditInvoicePengirimanModal';
import ViewInvoicePengirimanModal from '@/components/invoicePengiriman/ViewInvoicePengirimanModal';
import InvoicePengirimanDetailCard from '@/components/invoicePengiriman/InvoicePengirimanDetailCard';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import invoicePengirimanService from '@/services/invoicePengirimanService';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED INVOICE' },
  pending: { label: 'Pending', statusCode: 'PENDING INVOICE' },
  paid: { label: 'Paid', statusCode: 'PAID INVOICE' },
  overdue: { label: 'Overdue', statusCode: 'OVERDUE INVOICE' },
};

const TAB_ORDER = ['all', 'cancelled', 'pending', 'paid', 'overdue'];

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editModalError, setEditModalError] = useState(null);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [viewModalError, setViewModalError] = useState(null);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('all');
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

  const getStatusCodeForTab = useCallback(
    (tabId) => TAB_STATUS_CONFIG[tabId]?.statusCode ?? null,
    []
  );

  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    setSelectedInvoices([]); // Clear selection when changing tabs
    // The server-side table will handle filtering automatically based on activeTab
  }, []);

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

  const openEditModal = useCallback(
    (invoice) => {
      if (!invoice?.id) {
        console.error('Invoice ID tidak ditemukan untuk modal edit');
        return;
      }
      setEditingInvoiceId(invoice.id);
      setEditingInvoice(invoice);
      setShowEditModal(true);
      loadInvoiceIntoState(
        invoice.id,
        setEditingInvoice,
        setEditModalLoading,
        setEditModalError
      );
    },
    [loadInvoiceIntoState]
  );

  const closeEditModal = useCallback(() => {
    setEditingInvoice(null);
    setEditingInvoiceId(null);
    setEditModalError(null);
    setEditModalLoading(false);
    setShowEditModal(false);
  }, []);

  const reloadEditingInvoice = useCallback(() => {
    if (!editingInvoiceId) {
      return;
    }
    loadInvoiceIntoState(
      editingInvoiceId,
      setEditingInvoice,
      setEditModalLoading,
      setEditModalError
    );
  }, [editingInvoiceId, loadInvoiceIntoState]);

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
    closeEditModal();
  }, [closeAddModal, closeEditModal, refreshActiveTab, queryClient]);

  const handleInvoiceAdded = (newInvoice) => {
    if (!newInvoice) {
      return;
    }
    setInvoicePengiriman((prev) => [...prev, newInvoice]);
    closeAddModal();
    handleModalSuccess();
  };

  const handleInvoiceUpdated = (updatedInvoice) => {
    if (!updatedInvoice) {
      return;
    }
    setInvoicePengiriman((prev) =>
      prev.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      )
    );
    closeEditModal();
    handleModalSuccess();
  };

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
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Daftar Invoice Pengiriman
              </h3>
              <p className='text-sm text-gray-500'>
                Pantau seluruh invoice pengiriman termasuk informasi pelanggan
                dan status pembayaran.
              </p>
            </div>
          </div>

          <div className='mb-4 overflow-x-auto'>
            <TabContainer
              activeTab={activeTab}
              onTabChange={handleTabChange}
              variant='underline'
            >
              {TAB_ORDER.map((tabId) => (
                <Tab
                  key={tabId}
                  id={tabId}
                  label={TAB_STATUS_CONFIG[tabId].label}
                  badge={
                    activeTab === tabId
                      ? (resolvedPagination?.totalItems ?? 0)
                      : null
                  }
                />
              ))}
            </TabContainer>
          </div>

          <InvoicePengirimanTableServerSide
            onView={openViewModal}
            onEdit={openEditModal}
            onDelete={deleteInvoiceConfirmation.showDeleteConfirmation}
            deleteLoading={deleteInvoiceConfirmation.loading}
            selectedInvoices={selectedInvoices}
            onSelectInvoice={handleSelectInvoice}
            onSelectAllInvoices={handleSelectAllInvoices}
            hasSelectedInvoices={hasSelectedInvoices}
            initialPage={resolvedPagination.currentPage}
            initialLimit={resolvedPagination.itemsPerPage}
            activeTab={activeTab}
            onViewDetail={handleViewDetail}
            selectedInvoiceId={selectedInvoiceForDetail?.id}
          />
        </div>
      </div>

      {/* Invoice Pengiriman Detail Card */}
      {selectedInvoiceForDetail && (
        <InvoicePengirimanDetailCard
          invoice={selectedInvoiceForDetail}
          onClose={handleCloseDetail}
          loading={detailLoading}
        />
      )}

      <AddInvoicePengirimanModal
        show={showAddModal}
        onClose={closeAddModal}
        onInvoiceAdded={handleInvoiceAdded}
        handleAuthError={handleAuthError}
      />

      <EditInvoicePengirimanModal
        show={showEditModal}
        onClose={closeEditModal}
        invoice={editingInvoice}
        onInvoiceUpdated={handleInvoiceUpdated}
        handleAuthError={handleAuthError}
        invoiceLoading={editModalLoading}
        invoiceError={editModalError}
        onRetry={reloadEditingInvoice}
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
