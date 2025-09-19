import React, { useState } from 'react';
import useTermOfPayments from '@/hooks/useTermOfPayments';
import TermOfPaymentTable from '@/components/termOfPayments/TermOfPaymentTable';
import TermOfPaymentSearch from '@/components/termOfPayments/TermOfPaymentSearch';
import AddTermOfPaymentModal from '@/components/termOfPayments/AddTermOfPaymentModal';
import EditTermOfPaymentModal from '@/components/termOfPayments/EditTermOfPaymentModal';
import ViewTermOfPaymentModal from '@/components/termOfPayments/ViewTermOfPaymentModal';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const TermOfPayments = () => {
  const {
    termOfPayments,
    setTermOfPayments,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    createTermOfPayment,
    updateTermOfPayment,
    getTermOfPaymentById,
    deleteTermOfPayment,
    fetchTermOfPayments,
    handleAuthError
  } = useTermOfPayments();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingTermOfPayment, setEditingTermOfPayment] = useState(null);
  const [viewingTermOfPayment, setViewingTermOfPayment] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (termOfPayment) => {
    setEditingTermOfPayment(termOfPayment);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setEditingTermOfPayment(null);
    setShowEditModal(false);
  };

  const openViewModal = (termOfPayment) => {
    setViewingTermOfPayment(termOfPayment);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setViewingTermOfPayment(null);
    setShowViewModal(false);
  };

  const handleTermOfPaymentAdded = async (formData) => {
    try {
      await createTermOfPayment(formData);
      closeAddModal();
    } catch (error) {
      console.error('Error creating term of payment:', error);
    }
  };

  const handleTermOfPaymentUpdated = async (id, formData) => {
    try {
      await updateTermOfPayment(id, formData);
      closeEditModal();
    } catch (error) {
      console.error('Error updating term of payment:', error);
    }
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
          onClick={fetchTermOfPayments}
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
            <h3 className='text-lg font-medium text-gray-900'>Term of Payment List</h3>
            <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Term of Payment
            </button>
          </div>

          <TermOfPaymentSearch 
            searchQuery={searchQuery} 
            handleSearchChange={handleSearchChange} 
            searchLoading={searchLoading} 
          />

          <TermOfPaymentTable 
            termOfPayments={termOfPayments} 
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal} 
            onDelete={deleteTermOfPayment} 
            onView={openViewModal}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <AddTermOfPaymentModal 
        show={showAddModal} 
        onClose={closeAddModal} 
        onTermOfPaymentAdded={handleTermOfPaymentAdded}
        handleAuthError={handleAuthError}
      />

      <EditTermOfPaymentModal 
        show={showEditModal} 
        onClose={closeEditModal} 
        termOfPayment={editingTermOfPayment}
        onTermOfPaymentUpdated={handleTermOfPaymentUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewTermOfPaymentModal 
        show={showViewModal} 
        onClose={closeViewModal} 
        termOfPayment={viewingTermOfPayment} 
      />
    </div>
  );
};

export default TermOfPayments;
