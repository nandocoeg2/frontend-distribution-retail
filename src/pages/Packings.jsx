import React, { useState, useCallback } from 'react';
import usePackingsPage from '../hooks/usePackingsPage';
import {
  PackingTable,
  PackingSearch,
  PackingModal,
  ViewPackingModal,
} from '../components/packings';
import Pagination from '../components/common/Pagination';
import {
  useConfirmationDialog,
  ConfirmationDialog as BaseConfirmationDialog,
} from '../components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '../components/ui/Tabs';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: { label: 'Pending', statusCode: 'PENDING PACKING' },
  processing: { label: 'Processing', statusCode: 'PROCESSING PACKING' },
  completed: { label: 'Completed', statusCode: 'COMPLETED PACKING' },
  failed: { label: 'Failed', statusCode: 'FAILED PACKING' },
};

const TAB_ORDER = ['all', 'pending', 'processing', 'completed', 'failed'];

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const Packings = () => {
  const {
    packings,
    pagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    viewingPacking,
    isViewModalOpen,
    searchFilters,
    selectedPackings,
    isProcessing,
    hasSelectedPackings,
    deletePacking,
    deletePackingConfirmation,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange,
    openViewModal,
    closeViewModal,
    handleProcessPackings,
    handleFilterChange,
    clearFilters,
    handleSelectPacking,
    handleSelectAllPackings,
    fetchPackings,
    searchPackingsWithFilters,
    refreshPackings,
    setSelectedPackings,
  } = usePackingsPage();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPacking, setEditingPacking] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const {
    showDialog,
    hideDialog,
    setLoading: setProcessDialogLoading,
    ConfirmationDialog: ProcessConfirmationDialog,
  } = useConfirmationDialog();

  const resolvedPagination = pagination || INITIAL_PAGINATION;
  const activeTabBadge =
    resolvedPagination?.totalItems ?? resolvedPagination?.total ?? 0;

  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      setSelectedPackings([]);

      const statusCode = TAB_STATUS_CONFIG[tabId]?.statusCode;

      if (!statusCode) {
        fetchPackings(1);
        return;
      }

      searchPackingsWithFilters({ status_code: statusCode }, 1);
    },
    [fetchPackings, searchPackingsWithFilters, setSelectedPackings]
  );

  const handleSearchChangeWithReset = useCallback(
    (event) => {
      if (activeTab !== 'all') {
        setActiveTab('all');
      }
      setSelectedPackings([]);
      handleSearchChange(event);
    },
    [activeTab, handleSearchChange, setSelectedPackings]
  );

  const handleFilterChangeWithReset = useCallback(
    (filters) => {
      if (activeTab !== 'all') {
        setActiveTab('all');
      }
      setSelectedPackings([]);
      handleFilterChange(filters);
    },
    [activeTab, handleFilterChange, setSelectedPackings]
  );

  const handleClearFilters = useCallback(() => {
    if (activeTab !== 'all') {
      setActiveTab('all');
    }
    setSelectedPackings([]);
    clearFilters();
  }, [activeTab, clearFilters, setSelectedPackings]);

  const handleEditPacking = (packing) => {
    setEditingPacking(packing);
    setIsEditModalOpen(true);
  };

  const handleModalSuccess = () => {
    setSelectedPackings([]);
    refreshPackings();
  };

  const handleProcessSelected = () => {
    if (!hasSelectedPackings) {
      return;
    }

    showDialog({
      title: 'Konfirmasi Proses Packing',
      message: `Apakah Anda yakin ingin memproses ${selectedPackings.length} packing yang dipilih? Status akan berubah dari "PENDING PACKING" menjadi "PROCESSING PACKING".`,
      confirmText: 'Ya, Proses',
      cancelText: 'Batal',
      type: 'warning',
    });
  };

  const handleConfirmProcess = async () => {
    setProcessDialogLoading(true);
    try {
      await handleProcessPackings();
      hideDialog();
    } catch (processError) {
      console.error('Error processing packings:', processError);
    } finally {
      setProcessDialogLoading(false);
    }
  };

  return (
    <div className='min-h-screen p-6 bg-gray-100'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-bold text-gray-800'>
            Packing Management
          </h1>
          {/* <button
            onClick={() => setIsCreateModalOpen(true)}
            className='px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            Tambah Packing
          </button> */}
        </div>

        <div className='p-6 bg-white rounded-lg shadow-md'>
          <PackingSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChangeWithReset}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
            searchFilters={searchFilters}
            handleFilterChange={handleFilterChangeWithReset}
            clearFilters={handleClearFilters}
          />

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
                  badge={activeTab === tabId ? activeTabBadge : null}
                />
              ))}
            </TabContainer>
          </div>

          {error ? (
            <p className='text-center text-red-500'>Error: {error}</p>
          ) : (
            <>
              {loading ? (
                <p className='text-center text-gray-500'>Loading...</p>
              ) : (
                <>
                  <PackingTable
                    packings={packings}
                    onViewById={openViewModal}
                    onEdit={handleEditPacking}
                    onDelete={deletePacking}
                    deleteLoading={deletePackingConfirmation.loading}
                    selectedPackings={selectedPackings}
                    onSelectPacking={handleSelectPacking}
                    onSelectAllPackings={handleSelectAllPackings}
                    onProcessSelected={handleProcessSelected}
                    isProcessing={isProcessing}
                    hasSelectedPackings={hasSelectedPackings}
                  />
                  <Pagination
                    pagination={resolvedPagination}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                  />
                </>
              )}
            </>
          )}
        </div>

        {isViewModalOpen && (
          <ViewPackingModal packing={viewingPacking} onClose={closeViewModal} />
        )}

        {isCreateModalOpen && (
          <PackingModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
        )}

        {isEditModalOpen && (
          <PackingModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingPacking(null);
            }}
            initialData={editingPacking}
            onSuccess={handleModalSuccess}
          />
        )}

        <ProcessConfirmationDialog onConfirm={handleConfirmProcess} />

        <BaseConfirmationDialog
          show={deletePackingConfirmation.showConfirm}
          onClose={deletePackingConfirmation.hideDeleteConfirmation}
          onConfirm={deletePackingConfirmation.confirmDelete}
          title={deletePackingConfirmation.title}
          message={deletePackingConfirmation.message}
          type='danger'
          confirmText='Hapus'
          cancelText='Batal'
          loading={deletePackingConfirmation.loading}
        />
      </div>
    </div>
  );
};

export default Packings;
