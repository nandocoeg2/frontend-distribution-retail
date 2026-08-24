import React, { useState } from 'react';
import useMasterParametersPage from '@/hooks/useMasterParametersPage';
import MasterParameterTable from '@/components/masterParameters/MasterParameterTable';
import MasterParameterSearch from '@/components/masterParameters/MasterParameterSearch';
import AddMasterParameterModal from '@/components/masterParameters/AddMasterParameterModal';
import MasterParameterDetailCard from '@/components/masterParameters/MasterParameterDetailCard';
import { createMasterParameter, updateMasterParameter } from '@/services/masterParameterService';
import toastService from '@/services/toastService';
import { PlusIcon } from '@heroicons/react/24/outline';

const MasterParameter = () => {
  const {
    masterParameters,
    pagination,
    loading,
    error,
    searchQuery,
    activeSearchQuery,
    searchLoading,
    handleSearchChange,
    handleSearchSubmit,
    handlePageChange,
    handleLimitChange,
    deleteMasterParameter,
    fetchMasterParameters,
    handleAuthError
  } = useMasterParametersPage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParameterForDetail, setSelectedParameterForDetail] = useState(null);

  const closeAddModal = () => setShowAddModal(false);

  const handleViewDetail = (parameter) => {
    setSelectedParameterForDetail(parameter);
  };

  const handleCloseDetail = () => {
    setSelectedParameterForDetail(null);
  };

  const handleParameterAdded = async (parameterData) => {
    try {
      const response = await createMasterParameter(parameterData);
      if (response.success) {
        toastService.success('Master parameter created successfully');
        closeAddModal();
        fetchMasterParameters(1, pagination.itemsPerPage);
      }
    } catch (error) {
      toastService.error(error.message || 'Failed to create master parameter');
    }
  };

  if (loading && !searchLoading) {
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
          onClick={fetchMasterParameters}
          className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        >
          Retry
        </button>
      </div>
    );
  }

  const isDetailOpen = Boolean(selectedParameterForDetail);

  return (
    <div className={isDetailOpen ? 'space-y-3' : 'h-full flex flex-col'}>
      <div className={`max-w-full mx-auto w-full ${isDetailOpen ? '' : 'h-full flex flex-col'}`}>
        <div className={`bg-white shadow rounded-lg overflow-hidden p-3 ${isDetailOpen ? 'space-y-2' : 'flex flex-col flex-1 min-h-0'}`}>
          <div className='mb-2'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <h3 className='text-sm font-semibold text-gray-900'>Master Parameters</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700'
              >
                <PlusIcon className='h-4 w-4 mr-1.5' />
                Add Master Parameter
              </button>
            </div>
          </div>

          <div className='mb-2'>
            <MasterParameterSearch
              searchQuery={searchQuery}
              handleSearchChange={handleSearchChange}
              handleSearchSubmit={handleSearchSubmit}
              searchLoading={searchLoading}
            />
          </div>

          <div className={isDetailOpen ? '' : 'mt-1 flex-1 flex flex-col min-h-0'}>
            <MasterParameterTable
              masterParameters={masterParameters}
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onDelete={deleteMasterParameter}
              onViewDetail={handleViewDetail}
              selectedParameterId={selectedParameterForDetail?.id}
              searchQuery={activeSearchQuery}
              loading={loading}
              isDetailOpen={isDetailOpen}
            />
          </div>
        </div>
      </div>

      <AddMasterParameterModal
        show={showAddModal}
        onClose={closeAddModal}
        onParameterAdded={handleParameterAdded}
        handleAuthError={handleAuthError}
      />

      {/* Master Parameter Detail Card */}
      {selectedParameterForDetail && (
        <MasterParameterDetailCard
          parameter={selectedParameterForDetail}
          onClose={handleCloseDetail}
          updateParameter={updateMasterParameter}
          onUpdate={() => {
            fetchMasterParameters(pagination.currentPage, pagination.itemsPerPage);
            handleViewDetail(selectedParameterForDetail);
          }}
        />
      )}
    </div>
  );
};

export default MasterParameter;
