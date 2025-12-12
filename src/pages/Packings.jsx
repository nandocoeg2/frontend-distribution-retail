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
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

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
  const tableRef = React.useRef(null);

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

  const handleExportExcel = useCallback(() => {
    if (tableRef.current) {
      tableRef.current.openExportDialog();
    }
  }, []);

  return (
    <div className='p-3 space-y-3'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-3 py-3'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-semibold text-gray-900'>Manajemen Packing</h3>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-2.5 py-1.5 text-xs bg-green-600 text-white font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
              Export Excel
            </button>
          </div>
          {error ? (
            <div className='p-2 border border-red-200 rounded bg-red-50'>
              <p className='mb-2 text-xs text-red-800'>Error: {error}</p>
              <button onClick={handleRetry} className='px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700'>Coba Lagi</button>
            </div>
          ) : (
            <>
              {tableLoading && (
                <div className='flex items-center mb-2 text-xs text-gray-500'>
                  <div className='w-3 h-3 mr-1 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                  Memuat...
                </div>
              )}
              <div className='space-y-2'>
                <PackingTableServerSide
                  ref={tableRef}
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
                  onRowClick={handleViewDetail}
                  selectedPackingId={selectedPackingForDetail?.id}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {selectedPackingForDetail && (
        <PackingDetailCard packing={selectedPackingForDetail} onClose={handleCloseDetail} loading={detailLoading} />
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
