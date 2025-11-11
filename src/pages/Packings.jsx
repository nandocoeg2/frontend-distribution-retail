import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPackingById } from '@/services/packingService';
import usePackingsPage from '@/hooks/usePackingsPage';
import {
  PackingTableServerSide,
  PackingModal,
  PackingDetailCard,
} from '@/components/packings';
import Pagination from '@/components/common/Pagination';
import {
  useConfirmationDialog,
  ConfirmationDialog as BaseConfirmationDialog,
} from '@/components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

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

const PackingsPage = () => {
  const queryClient = useQueryClient();
  
  const {
    packings,
    pagination,
    loading,
    error,
    searchLoading,
    viewingPacking,
    isViewModalOpen,
    searchFilters,
    selectedPackings,
    isProcessing,
    isCompleting,
    hasSelectedPackings,
    deletePacking,
    deletePackingConfirmation,
    handlePageChange,
    handleLimitChange,
    openViewModal,
    closeViewModal,
    handleProcessPackings,
    handleCompletePackings,
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
  const [selectedPackingForDetail, setSelectedPackingForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const {
    showDialog: showProcessDialog,
    hideDialog: hideProcessDialog,
    setLoading: setProcessDialogLoading,
    ConfirmationDialog: ProcessConfirmationDialog,
  } = useConfirmationDialog();

  const {
    showDialog: showCompleteDialog,
    hideDialog: hideCompleteDialog,
    setLoading: setCompleteDialogLoading,
    ConfirmationDialog: CompleteConfirmationDialog,
  } = useConfirmationDialog();

  const resolvedPagination = useMemo(
    () => pagination || INITIAL_PAGINATION,
    [pagination]
  );

  const activeTabBadge = useMemo(
    () =>
      resolvedPagination?.totalItems ??
      resolvedPagination?.total ??
      0,
    [resolvedPagination]
  );

  const packingsList = useMemo(
    () => (Array.isArray(packings) ? packings : []),
    [packings]
  );

  const tableLoading = Boolean(loading && !error);

  const openCreateModal = useCallback(() => {
    setEditingPacking(null);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const openEditModal = useCallback((packing) => {
    setEditingPacking(packing);
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingPacking(null);
  }, []);

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

  const handleModalSuccess = useCallback(() => {
    setSelectedPackings([]);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['packings'] });
    refreshPackings();
    closeCreateModal();
    closeEditModal();
  }, [closeCreateModal, closeEditModal, refreshPackings, setSelectedPackings, queryClient]);

  const handleProcessSelected = useCallback(() => {
    if (!hasSelectedPackings) {
      return;
    }

    showProcessDialog({
      title: 'Konfirmasi Proses Packing',
      message: `Apakah Anda yakin ingin memproses ${selectedPackings.length} packing yang dipilih? Status akan berubah dari "PENDING PACKING" menjadi "PROCESSING PACKING".`,
      confirmText: 'Ya, Proses',
      cancelText: 'Batal',
      type: 'warning',
    });
  }, [hasSelectedPackings, selectedPackings, showProcessDialog]);

  const handleConfirmProcess = useCallback(async () => {
    setProcessDialogLoading(true);
    try {
      await handleProcessPackings();
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['packings'] });
      hideProcessDialog();
    } catch (processError) {
      console.error('Error processing packings:', processError);
    } finally {
      setProcessDialogLoading(false);
    }
  }, [handleProcessPackings, hideProcessDialog, setProcessDialogLoading, queryClient]);

  const handleCompleteSelected = useCallback(() => {
    if (!hasSelectedPackings) {
      return;
    }

    showCompleteDialog({
      title: 'Konfirmasi Selesaikan Packing',
      message: `Apakah Anda yakin ingin menyelesaikan ${selectedPackings.length} packing yang dipilih? Status akan berubah menjadi "COMPLETED PACKING".`,
      confirmText: 'Ya, Selesaikan',
      cancelText: 'Batal',
      type: 'info',
    });
  }, [hasSelectedPackings, selectedPackings, showCompleteDialog]);

  const handleConfirmComplete = useCallback(async () => {
    setCompleteDialogLoading(true);
    try {
      await handleCompletePackings();
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['packings'] });
      hideCompleteDialog();
    } catch (completeError) {
      console.error('Error completing packings:', completeError);
    } finally {
      setCompleteDialogLoading(false);
    }
  }, [handleCompletePackings, hideCompleteDialog, setCompleteDialogLoading, queryClient]);

  const handleRetry = useCallback(() => {
    refreshPackings();
  }, [refreshPackings]);

  const handleViewDetail = useCallback(async (packing) => {
    if (!packing?.id) {
      console.warn('Invalid packing data:', packing);
      return;
    }

    // Toggle detail card: if clicking the same row, close it
    if (selectedPackingForDetail?.id === packing.id) {
      setSelectedPackingForDetail(null);
      return;
    }

    try {
      setDetailLoading(true);
      // Fetch full detail data using GET /:id endpoint
      const response = await getPackingById(packing.id);
      // Unwrap response: handle both { success: true, data: {...} } and direct data formats
      const detailData = response?.success ? response.data : response;
      setSelectedPackingForDetail(detailData);
    } catch (err) {
      // If fetch fails, fallback to list data
      console.warn('Failed to fetch packing details, using list data:', err?.message || err);
      setSelectedPackingForDetail(packing);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedPackingForDetail]);

  const handleCloseDetail = useCallback(() => {
    setSelectedPackingForDetail(null);
  }, []);

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>Manajemen Packing</h3>
              <p className='text-sm text-gray-500'>
                Kelola dan pantau proses packing pesanan pelanggan.
              </p>
            </div>
            {/* <div className='flex items-center gap-2'>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah Packing
              </button>
            </div> */}
          </div>

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
            <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
              <p className='mb-3 text-sm text-red-800'>Terjadi kesalahan: {error}</p>
              <button
                onClick={handleRetry}
                className='px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700'
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {tableLoading && (
                <div className='flex items-center mb-4 text-sm text-gray-500'>
                  <div className='w-4 h-4 mr-2 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                  Memuat data packing...
                </div>
              )}
              <div className='space-y-4'>
                <PackingTableServerSide
                  onViewById={openViewModal}
                  onEdit={openEditModal}
                  onDelete={deletePacking}
                  deleteLoading={deletePackingConfirmation.loading}
                  selectedPackings={selectedPackings}
                  onSelectPacking={handleSelectPacking}
                  onSelectAllPackings={handleSelectAllPackings}
                  onProcessSelected={handleProcessSelected}
                  onCompleteSelected={handleCompleteSelected}
                  isProcessing={isProcessing}
                  isCompleting={isCompleting}
                  hasSelectedPackings={hasSelectedPackings}
                  initialPage={resolvedPagination.currentPage}
                  initialLimit={resolvedPagination.itemsPerPage}
                  activeTab={activeTab}
                  onRowClick={handleViewDetail}
                  selectedPackingId={selectedPackingForDetail?.id}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Packing Detail Card */}
      {selectedPackingForDetail && (
        <PackingDetailCard
          packing={selectedPackingForDetail}
          onClose={handleCloseDetail}
          loading={detailLoading}
        />
      )}

      {/* Modals */}
      <PackingModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSuccess={handleModalSuccess}
      />

      <PackingModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        initialData={editingPacking}
        onSuccess={handleModalSuccess}
      />

      <ProcessConfirmationDialog onConfirm={handleConfirmProcess} />
      <CompleteConfirmationDialog onConfirm={handleConfirmComplete} />

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
  );
};

export default PackingsPage;
