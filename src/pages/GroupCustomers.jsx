import React, { useState } from 'react';
import useGroupCustomersPage from '@/hooks/useGroupCustomersPage';
import useGroupCustomerOperations from '@/hooks/useGroupCustomerOperations';
import GroupCustomerTable from '@/components/groupCustomers/GroupCustomerTable';
import GroupCustomerSearch from '@/components/groupCustomers/GroupCustomerSearch';
import AddGroupCustomerModal from '@/components/groupCustomers/AddGroupCustomerModal';
import GroupCustomerDetailCard from '@/components/groupCustomers/GroupCustomerDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { groupCustomerService } from '../services/groupCustomerService';
import toastService from '../services/toastService';

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
    fetchEntities,
    handleAuthError
  } = useGroupCustomersPage();

  const { getGroupCustomerById, loading: detailLoading } = useGroupCustomerOperations();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroupCustomerForDetail, setSelectedGroupCustomerForDetail] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      await groupCustomerService.exportExcel(searchQuery);
      toastService.success('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      toastService.error(err.message || 'Gagal mengexport data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleViewDetail = async (groupCustomer) => {
    try {
      // Fetch detail data using GET /:id endpoint
      const detailData = await getGroupCustomerById(groupCustomer.id);
      setSelectedGroupCustomerForDetail(detailData);
    } catch (err) {
      // If fetch fails, fallback to list data
      console.warn('Failed to fetch group customer details, using list data:', err.message);
      setSelectedGroupCustomerForDetail(groupCustomer);
    }
  };

  const handleCloseDetail = () => {
    setSelectedGroupCustomerForDetail(null);
  };

  const handleGroupCustomerAdded = (newGroupCustomer) => {
    setGroupCustomers([newGroupCustomer, ...groupCustomers]);
    closeAddModal();
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
          onClick={() => fetchEntities()}
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
            <div className='flex gap-2'>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className='inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {exportLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <HeroIcon name='arrow-down-tray' className='w-5 h-5 mr-2' />
                    Export Excel
                  </>
                )}
              </button>
              <button
                onClick={openAddModal}
                className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Add Group Customer
              </button>
            </div>
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
            onDelete={deleteGroupCustomerConfirmation.showDeleteConfirmation} 
            onViewDetail={handleViewDetail}
            selectedGroupCustomerId={selectedGroupCustomerForDetail?.id}
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

      {/* Group Customer Detail Card */}
      {selectedGroupCustomerForDetail && (
        <GroupCustomerDetailCard
          groupCustomer={selectedGroupCustomerForDetail}
          onClose={handleCloseDetail}
          onUpdate={() => {
            fetchEntities();
            handleViewDetail(selectedGroupCustomerForDetail);
          }}
          loading={detailLoading}
        />
      )}
    </div>
  );
};

export default GroupCustomers;

