import React, { useState } from 'react';
import useInvoicePenagihan from '@/hooks/useInvoicePenagihanPage';
import InvoicePenagihanTable from '@/components/invoicePenagihan/InvoicePenagihanTable';
import InvoicePenagihanSearch from '@/components/invoicePenagihan/InvoicePenagihanSearch';
import AddInvoicePenagihanModal from '@/components/invoicePenagihan/AddInvoicePenagihanModal';
import EditInvoicePenagihanModal from '@/components/invoicePenagihan/EditInvoicePenagihanModal';
import ViewInvoicePenagihanModal from '@/components/invoicePenagihan/ViewInvoicePenagihanModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

const InvoicePenagihanPage = () => {
  const {
    invoicePenagihan,
    setInvoicePenagihan,
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
    fetchInvoicePenagihan,
    createInvoice,
    updateInvoice,
  } = useInvoicePenagihan();

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

  const handleInvoiceCreated = async (payload) => {
    const createdInvoice = await createInvoice(payload);
    if (createdInvoice) {
      setInvoicePenagihan((prev) => {
        if (!Array.isArray(prev)) {
          return [createdInvoice];
        }
        const exists = prev.some((item) => item.id === createdInvoice.id);
        if (exists) {
          return prev.map((item) =>
            item.id === createdInvoice.id ? createdInvoice : item
          );
        }
        return [...prev, createdInvoice];
      });
    }
    return createdInvoice;
  };

  const handleInvoiceUpdated = async (id, payload) => {
    const updatedInvoice = await updateInvoice(id, payload);
    if (updatedInvoice) {
      setInvoicePenagihan((prev) =>
        prev.map((invoice) =>
          invoice.id === updatedInvoice.id ? updatedInvoice : invoice
        )
      );
    }
    return updatedInvoice;
  };

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
        <button
          onClick={() => fetchInvoicePenagihan()}
          className='px-4 py-2 mt-2 text-white bg-red-600 rounded hover:bg-red-700'
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Daftar Invoice Penagihan
              </h3>
              <p className='text-sm text-gray-500'>
                Kelola invoice penagihan termasuk informasi pelanggan, status,
                serta rincian pembayaran.
              </p>
            </div>
            {/* <div className='flex justify-end'>
              <button
                onClick={openAddModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                Tambah Invoice Penagihan
              </button>
            </div> */}
          </div>

          <InvoicePenagihanSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChange}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
          />

          <InvoicePenagihanTable
            invoices={invoicePenagihan}
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

      <AddInvoicePenagihanModal
        show={showAddModal}
        onClose={closeAddModal}
        onCreate={handleInvoiceCreated}
      />

      <EditInvoicePenagihanModal
        show={showEditModal}
        onClose={closeEditModal}
        invoice={editingInvoice}
        onUpdate={handleInvoiceUpdated}
      />

      <ViewInvoicePenagihanModal
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

export default InvoicePenagihanPage;
