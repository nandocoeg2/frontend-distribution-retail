import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useFakturPajakPage from '@/hooks/useFakturPajakPage';
import {
  FakturPajakTableServerSide,
  FakturPajakModal,
  FakturPajakDetailCard,
  FakturPajakExportModal,
} from '@/components/fakturPajak';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';

const FakturPajakPage = () => {
  const queryClient = useQueryClient();
  
  const {
    createFakturPajak,
    updateFakturPajak,
    deleteFakturPajak: triggerDeleteFakturPajak,
    deleteFakturPajakConfirmation,
    fetchFakturPajakById,
  } = useFakturPajakPage();

  const [selectedFakturPajakForDetail, setSelectedFakturPajakForDetail] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteFakturPajakConfirmation.confirmDelete();
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['fakturPajak'] });
  }, [deleteFakturPajakConfirmation, queryClient]);

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openExportModal = () => {
    setIsExportModalOpen(true);
  };

  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  const handleViewDetail = useCallback(
    async (fakturPajak) => {
      if (!fakturPajak?.id) {
        return;
      }
      setDetailLoading(true);
      try {
        const detail = await fetchFakturPajakById(fakturPajak.id);
        setSelectedFakturPajakForDetail(detail || fakturPajak);
      } catch (err) {
        console.warn('Failed to fetch faktur pajak details, using list data:', err.message);
        setSelectedFakturPajakForDetail(fakturPajak);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchFakturPajakById]
  );

  const handleCloseDetail = () => {
    setSelectedFakturPajakForDetail(null);
    setDetailLoading(false);
  };

  const handleCreateSubmit = async (payload) => {
    const result = await createFakturPajak(payload);
    if (result) {
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['fakturPajak'] });
      setIsCreateModalOpen(false);
    }
  };

  const handleDetailUpdate = useCallback(async () => {
    // Invalidate queries and refresh detail
    await queryClient.invalidateQueries({ queryKey: ['fakturPajak'] });
    if (selectedFakturPajakForDetail?.id) {
      try {
        const refreshedDetail = await fetchFakturPajakById(selectedFakturPajakForDetail.id);
        setSelectedFakturPajakForDetail(refreshedDetail);
      } catch (error) {
        console.warn('Failed to refresh faktur pajak detail:', error);
      }
    }
  }, [queryClient, selectedFakturPajakForDetail, fetchFakturPajakById]);

  const handleDelete = (fakturPajak) => {
    if (!fakturPajak?.id) {
      return;
    }
    triggerDeleteFakturPajak(fakturPajak.id);
  };

  return (
    <div className='p-3 space-y-3'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-3 py-3'>
          <div className='mb-2 flex justify-between items-center'>
            <h3 className='text-sm font-semibold text-gray-900'>Faktur Pajak</h3>
            <button
              onClick={openExportModal}
              className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700'
            >
              <ArchiveBoxIcon className='w-3.5 h-3.5 mr-1' />
              Export e-Faktur
            </button>
          </div>

          <FakturPajakTableServerSide
            onView={handleViewDetail}
            onDelete={handleDelete}
            deleteLoading={deleteFakturPajakConfirmation.loading}
            initialPage={1}
            initialLimit={10}
            selectedFakturPajakId={selectedFakturPajakForDetail?.id}
          />
        </div>
      </div>

      <FakturPajakModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <FakturPajakExportModal
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
      />

      <ConfirmationDialog
        show={deleteFakturPajakConfirmation.showConfirm}
        onClose={deleteFakturPajakConfirmation.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteFakturPajakConfirmation.title}
        message={deleteFakturPajakConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteFakturPajakConfirmation.loading}
      />

      {/* Faktur Pajak Detail Card */}
      {selectedFakturPajakForDetail && (
        <FakturPajakDetailCard
          fakturPajak={selectedFakturPajakForDetail}
          onClose={handleCloseDetail}
          loading={detailLoading}
          updateFakturPajak={updateFakturPajak}
          onUpdate={handleDetailUpdate}
        />
      )}
    </div>
  );
};

export default FakturPajakPage;
