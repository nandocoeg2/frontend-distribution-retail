import React, { useState } from 'react';
import { useSuppliersPage as useSuppliers } from '@/hooks/useSuppliers';
import SupplierTable from '@/components/suppliers/SupplierTable';
import SupplierSearch from '@/components/suppliers/SupplierSearch';
import AddSupplierModal from '@/components/suppliers/AddSupplierModal';
import EditSupplierModal from '@/components/suppliers/EditSupplierModal';
import ViewSupplierModal from '@/components/suppliers/ViewSupplierModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Suppliers = () => {
  const {
    suppliers,
    setSuppliers,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteSupplierConfirmation,
    fetchSuppliers,
    handleAuthError
  } = useSuppliers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setEditingSupplier(null);
    setShowEditModal(false);
  };

  const openViewModal = (supplier) => {
    setViewingSupplier(supplier);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setViewingSupplier(null);
    setShowViewModal(false);
  };

  const handleSupplierAdded = (newSupplier) => {
    setSuppliers([...suppliers, newSupplier]);
    closeAddModal();
  };

  const handleSupplierUpdated = (updatedSupplier) => {
    setSuppliers(
      suppliers.map((supplier) =>
        supplier.id === updatedSupplier.id ? updatedSupplier : supplier
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
          onClick={fetchSuppliers}
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
            <h3 className='text-lg font-medium text-gray-900'>Supplier List</h3>
            <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Supplier
            </button>
          </div>

          <SupplierSearch 
            searchQuery={searchQuery} 
            handleSearchChange={handleSearchChange} 
            searchLoading={searchLoading} 
          />

          <SupplierTable 
            suppliers={suppliers} 
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal} 
            onDelete={deleteSupplierConfirmation.showDeleteConfirmation} 
            onView={openViewModal}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <AddSupplierModal 
        show={showAddModal} 
        onClose={closeAddModal} 
        onSupplierAdded={handleSupplierAdded}
        handleAuthError={handleAuthError}
      />

      <EditSupplierModal 
        show={showEditModal} 
        onClose={closeEditModal} 
        supplier={editingSupplier}
        onSupplierUpdated={handleSupplierUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewSupplierModal 
        show={showViewModal} 
        onClose={closeViewModal} 
        supplier={viewingSupplier} 
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        show={deleteSupplierConfirmation.showConfirm}
        onClose={deleteSupplierConfirmation.hideDeleteConfirmation}
        onConfirm={deleteSupplierConfirmation.confirmDelete}
        title={deleteSupplierConfirmation.title}
        message={deleteSupplierConfirmation.message}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        loading={deleteSupplierConfirmation.loading}
      />
    </div>
  );
};

export default Suppliers;
