import React, { useState } from 'react';
import useInvoices from '@/hooks/useInvoicesPage';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import InvoiceSearch from '@/components/invoices/InvoiceSearch';
import AddInvoiceModal from '@/components/invoices/AddInvoiceModal';
import EditInvoiceModal from '@/components/invoices/EditInvoiceModal';
import ViewInvoiceModal from '@/components/invoices/ViewInvoiceModal';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Invoices = () => {
  const {
    invoices,
    setInvoices,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteInvoice,
    fetchInvoices,
    handleAuthError
  } = useInvoices();

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
    setInvoices([...invoices, newInvoice]);
    closeAddModal();
  };

  const handleInvoiceUpdated = (updatedInvoice) => {
    setInvoices(
      invoices.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      )
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
        <p className='text-red-800'>Error: {error}</p>
        <button
          onClick={fetchInvoices}
          className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mb-4 flex justify-between items-center'>
            <h3 className='text-lg font-medium text-gray-900'>Invoice List</h3>
            <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Invoice
            </button>
          </div>

          <InvoiceSearch
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            searchLoading={searchLoading}
          />

          <InvoiceTable
            invoices={invoices}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal}
            onDelete={deleteInvoice}
            onView={openViewModal}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <AddInvoiceModal
        show={showAddModal}
        onClose={closeAddModal}
        onInvoiceAdded={handleInvoiceAdded}
        handleAuthError={handleAuthError}
      />

      <EditInvoiceModal
        show={showEditModal}
        onClose={closeEditModal}
        invoice={editingInvoice}
        onInvoiceUpdated={handleInvoiceUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewInvoiceModal
        show={showViewModal}
        onClose={closeViewModal}
        invoice={viewingInvoice}
      />
    </div>
  );
};

export default Invoices;
