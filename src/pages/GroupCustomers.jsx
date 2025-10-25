import React, { useState } from 'react';
import useGroupCustomersPage from '@/hooks/useGroupCustomersPage';
import useGroupCustomerOperations from '@/hooks/useGroupCustomerOperations';
import GroupCustomerTable from '@/components/groupCustomers/GroupCustomerTable';
import GroupCustomerSearch from '@/components/groupCustomers/GroupCustomerSearch';
import AddGroupCustomerModal from '@/components/groupCustomers/AddGroupCustomerModal';
import EditGroupCustomerModal from '@/components/groupCustomers/EditGroupCustomerModal';
import ViewGroupCustomerModal from '@/components/groupCustomers/ViewGroupCustomerModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const GroupCustomers = () => {
  const {
    groupCustomers,
    setGroupCustomers,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteGroupCustomerConfirmation,
    fetchGroupCustomers,
    handleAuthError
  } = useGroupCustomersPage();

  const { getGroupCustomerById, loading: detailLoading } = useGroupCustomerOperations();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingGroupCustomer, setEditingGroupCustomer] = useState(null);
  const [viewingGroupCustomer, setViewingGroupCustomer] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (groupCustomer) => {
    setEditingGroupCustomer(groupCustomer);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setEditingGroupCustomer(null);
    setShowEditModal(false);
  };

  const openViewModal = async (groupCustomer) => {
    try {
      // Fetch detail data using GET /:id endpoint
      const detailData = await getGroupCustomerById(groupCustomer.id);
      setViewingGroupCustomer(detailData);
      setShowViewModal(true);
    } catch (err) {
      // If fetch fails, fallback to list data
      console.warn('Failed to fetch group customer details, using list data:', err.message);
      setViewingGroupCustomer(groupCustomer);
      setShowViewModal(true);
    }
  };

  const closeViewModal = () => {
    setViewingGroupCustomer(null);
    setShowViewModal(false);
  };

  const handleGroupCustomerAdded = (newGroupCustomer) => {
    setGroupCustomers([newGroupCustomer, ...groupCustomers]);
    closeAddModal();
  };

  const handleGroupCustomerUpdated = (updatedGroupCustomer) => {
    setGroupCustomers(
      groupCustomers.map((gc) =>
        gc.id === updatedGroupCustomer.id ? updatedGroupCustomer : gc
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
          onClick={fetchGroupCustomers}
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
            <h3 className='text-lg font-medium text-gray-900'>Group Customer List</h3>
            <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Group Customer
            </button>
          </div>

          <GroupCustomerSearch 
            searchQuery={searchQuery} 
            handleSearchChange={handleSearchChange} 
            searchLoading={searchLoading} 
          />

          <GroupCustomerTable 
            groupCustomers={groupCustomers} 
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal} 
            onDelete={deleteGroupCustomerConfirmation.showDeleteConfirmation} 
            onView={openViewModal}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <AddGroupCustomerModal 
        show={showAddModal} 
        onClose={closeAddModal} 
        onGroupCustomerAdded={handleGroupCustomerAdded}
        handleAuthError={handleAuthError}
      />

      <EditGroupCustomerModal 
        show={showEditModal} 
        onClose={closeEditModal} 
        groupCustomer={editingGroupCustomer}
        onGroupCustomerUpdated={handleGroupCustomerUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewGroupCustomerModal
        show={showViewModal}
        onClose={closeViewModal}
        groupCustomer={viewingGroupCustomer}
        loading={detailLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        show={deleteGroupCustomerConfirmation.showConfirm}
        onClose={deleteGroupCustomerConfirmation.hideDeleteConfirmation}
        onConfirm={deleteGroupCustomerConfirmation.confirmDelete}
        title={deleteGroupCustomerConfirmation.title}
        message={deleteGroupCustomerConfirmation.message}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        loading={deleteGroupCustomerConfirmation.loading}
      />
    </div>
  );
};

export default GroupCustomers;

