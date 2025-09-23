import React, { useState } from 'react';
import useInvoicePengiriman from '@/hooks/useInvoicePengirimanPage';
import InvoicePengirimanTable from '@/components/invoicePengiriman/InvoicePengirimanTable';
import InvoicePengirimanSearch from '@/components/invoicePengiriman/InvoicePengirimanSearch';
import AddInvoicePengirimanModal from '@/components/invoicePengiriman/AddInvoicePengirimanModal';
import EditInvoicePengirimanModal from '@/components/invoicePengiriman/EditInvoicePengirimanModal';
import ViewInvoicePengirimanModal from '@/components/invoicePengiriman/ViewInvoicePengirimanModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

const InvoicePengirimanPage = () => {
  const {
    invoicePengiriman,
    setInvoicePengiriman,
    pagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange,
    deleteInvoiceConfirmation,
    fetchInvoicePengiriman,
    handleAuthError
  } = useInvoicePengiriman();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setEditingInvoice(null);
    setShowEditModal(false);
  };

  const openViewModal = (invoice) => {
    setViewingInvoice(invoice);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setViewingInvoice(null);
    setShowViewModal(false);
  };

  const handleInvoiceAdded = (newInvoice) => {
    if (!newInvoice) {
      return;
    }
    setInvoicePengiriman((prev) => [...prev, newInvoice]);
    closeAddModal();
  };

  const handleInvoiceUpdated = (updatedInvoice) => {
    if (!updatedInvoice) {
      return;
    }
    setInvoicePengiriman((prev) =>
      prev.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice))
    );
    closeEditModal();
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-800'>Terjadi kesalahan: {error}</p>
        <button
          onClick={fetchInvoicePengiriman}
          className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mb-4 flex justify-between items-center'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>Daftar Invoice Pengiriman</h3>
              <p className='text-sm text-gray-500'>Pantau seluruh invoice pengiriman termasuk informasi pelanggan dan status pembayaran.</p>
            </div>
            {/* <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              Tambah Invoice Pengiriman
            </button> */}
          </div>

          <InvoicePengirimanSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChange}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
          />

          <InvoicePengirimanTable
            invoices={invoicePengiriman}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal}
            onDelete={deleteInvoiceConfirmation.showDeleteConfirmation}
            onView={openViewModal}
            searchQuery={searchQuery}
          />
        </div>
      </div>

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
      />

      <ViewInvoicePengirimanModal
        show={showViewModal}
        onClose={closeViewModal}
        invoice={viewingInvoice}
      />

      <ConfirmationDialog
        show={deleteInvoiceConfirmation.showConfirm}
        onClose={deleteInvoiceConfirmation.hideDeleteConfirmation}
        onConfirm={deleteInvoiceConfirmation.confirmDelete}
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
