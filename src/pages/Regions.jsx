import React, { useState } from 'react';
import useRegionsPage from '@/hooks/useRegionsPage';
import RegionTable from '@/components/regions/RegionTable';
import RegionSearch from '@/components/regions/RegionSearch';
import AddRegionModal from '@/components/regions/AddRegionModal';
import RegionDetailCard from '@/components/regions/RegionDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Regions = () => {
  const {
    regions,
    setRegions,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteRegionConfirmation,
    fetchRegions,
    handleAuthError
  } = useRegionsPage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRegionForDetail, setSelectedRegionForDetail] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => {
    setShowAddModal(false);
    fetchRegions(pagination.page, pagination.limit);
  };

  const handleViewDetail = (region) => {
    setSelectedRegionForDetail(region);
  };

  const handleCloseDetail = () => {
    setSelectedRegionForDetail(null);
  };

  const handleRegionAdded = (newRegion) => {
    fetchRegions(1, pagination.limit); // Refetch from the first page
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
          onClick={() => fetchRegions(pagination.page, pagination.limit)}
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
            <h3 className='text-lg font-medium text-gray-900'>Region List</h3>
            <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Region
            </button>
          </div>

          <RegionSearch 
            searchQuery={searchQuery} 
            handleSearchChange={handleSearchChange} 
            searchLoading={searchLoading} 
          />

          <RegionTable 
            regions={regions} 
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onDelete={deleteRegionConfirmation.showDeleteConfirmation} 
            onViewDetail={handleViewDetail}
            selectedRegionId={selectedRegionForDetail?.id}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <AddRegionModal 
        show={showAddModal} 
        onClose={closeAddModal} 
        onRegionAdded={handleRegionAdded}
        handleAuthError={handleAuthError}
      />

      {/* Region Detail Card */}
      {selectedRegionForDetail && (
        <RegionDetailCard
          region={selectedRegionForDetail}
          onClose={handleCloseDetail}
          handleAuthError={handleAuthError}
          onUpdate={() => {
            fetchRegions(pagination.page, pagination.limit);
            handleViewDetail(selectedRegionForDetail);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        show={deleteRegionConfirmation.showConfirm}
        onClose={deleteRegionConfirmation.hideDeleteConfirmation}
        onConfirm={deleteRegionConfirmation.confirmDelete}
        title={deleteRegionConfirmation.title}
        message={deleteRegionConfirmation.message}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        loading={deleteRegionConfirmation.loading}
      />
    </div>
  );
};

export default Regions;

