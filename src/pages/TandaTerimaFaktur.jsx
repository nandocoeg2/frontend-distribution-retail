import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useTandaTerimaFakturPage from '@/hooks/useTandaTerimaFakturPage';
import {
  TandaTerimaFakturTableServerSide,
  TandaTerimaFakturModal,
  TandaTerimaFakturDetailCard,
  PrintTandaTerimaFakturByGroupModal,
  UploadTTF2Modal,
} from '@/components/tandaTerimaFaktur';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PrinterIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const TandaTerimaFakturPage = () => {
  const queryClient = useQueryClient();

  const {
    createTandaTerimaFaktur,
    updateTandaTerimaFaktur,
    deleteTandaTerimaFaktur: triggerDeleteTandaTerimaFaktur,
    deleteTandaTerimaFakturConfirmation,
    fetchTandaTerimaFakturById,
  } = useTandaTerimaFakturPage();

  const [selectedTTFForDetail, setSelectedTTFForDetail] = useState(null);
  const [selectedTTFForEdit, setSelectedTTFForEdit] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteTandaTerimaFakturConfirmation.confirmDelete();
    await queryClient.invalidateQueries({ queryKey: ['tandaTerimaFaktur'] });
  }, [deleteTandaTerimaFakturConfirmation, queryClient]);

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const openPrintModal = () => setIsPrintModalOpen(true);
  const closePrintModal = () => setIsPrintModalOpen(false);

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const handleViewDetail = useCallback(
    async (ttf) => {
      if (!ttf?.id) return;
      // If already selected, just fetch details but don't toggle off.
      // Or toggle? Usually clicking row selects it. If same row clicked, maybe deselect?
      // For now, assume selection always selects.
      if (selectedTTFForDetail?.id === ttf.id) {
        // ensure detail is up to date or just return
      }

      setDetailLoading(true);
      try {
        const detail = await fetchTandaTerimaFakturById(ttf.id);
        setSelectedTTFForDetail(detail || ttf);
      } catch (err) {
        console.warn('Failed to fetch TTF details:', err.message);
        setSelectedTTFForDetail(ttf);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchTandaTerimaFakturById, selectedTTFForDetail]
  );

  const handleCloseDetail = () => {
    setSelectedTTFForDetail(null);
    setDetailLoading(false);
  };

  const handleEdit = useCallback(
    async (ttf) => {
      if (!ttf?.id) return;
      try {
        const detail = await fetchTandaTerimaFakturById(ttf.id);
        setSelectedTTFForEdit(detail || ttf);
      } catch (err) {
        console.warn('Failed to fetch TTF for edit:', err.message);
        setSelectedTTFForEdit(ttf);
      }
    },
    [fetchTandaTerimaFakturById]
  );

  const closeEditModal = () => setSelectedTTFForEdit(null);

  const handleCreateSubmit = async (payload) => {
    const result = await createTandaTerimaFaktur(payload);
    if (result) {
      await queryClient.invalidateQueries({ queryKey: ['tandaTerimaFaktur'] });
      setIsCreateModalOpen(false);
    }
  };

  const handleEditSubmit = async (payload) => {
    if (!selectedTTFForEdit?.id) return;
    const result = await updateTandaTerimaFaktur(selectedTTFForEdit.id, payload);
    if (result) {
      await queryClient.invalidateQueries({ queryKey: ['tandaTerimaFaktur'] });
      setSelectedTTFForEdit(null);
    }
  };

  const handleDelete = (id) => {
    if (!id) return;
    triggerDeleteTandaTerimaFaktur(id);
  };

  return (
    <div>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-3 py-3 space-y-2'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900'>Tanda Terima Faktur</h3>
            <div className='flex flex-wrap gap-2'>
              <button
                onClick={openPrintModal}
                className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700'
              >
                <PrinterIcon className='w-4 h-4 mr-1.5' />
                Print TTF 1
              </button>
              <button
                onClick={openUploadModal}
                className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs text-white bg-emerald-600 rounded hover:bg-emerald-700'
              >
                <ArrowUpTrayIcon className='w-4 h-4 mr-1.5' />
                Upload TTF 2
              </button>
            </div>
          </div>

          <TandaTerimaFakturTableServerSide
            onView={handleViewDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleteLoading={deleteTandaTerimaFakturConfirmation.loading}
            initialPage={1}
            initialLimit={10}
            selectedTTFId={selectedTTFForDetail?.id}
          />
        </div>
      </div>

      {/* Detail Card - Replaces Modal */}
      {selectedTTFForDetail && (
        <TandaTerimaFakturDetailCard
          tandaTerimaFaktur={selectedTTFForDetail}
          onClose={handleCloseDetail}
          onEdit={handleEdit}
          loading={detailLoading}
        />
      )}

      {/* Create Modal */}
      <TandaTerimaFakturModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      {/* Edit Modal */}
      <TandaTerimaFakturModal
        isOpen={Boolean(selectedTTFForEdit)}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        initialValues={selectedTTFForEdit}
        isEdit={true}
      />


      {/* Print Modal */}
      <PrintTandaTerimaFakturByGroupModal
        isOpen={isPrintModalOpen}
        onClose={closePrintModal}
      />

      {/* Upload TTF2 Modal */}
      <UploadTTF2Modal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        show={deleteTandaTerimaFakturConfirmation.showConfirm}
        onClose={deleteTandaTerimaFakturConfirmation.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteTandaTerimaFakturConfirmation.title}
        message={deleteTandaTerimaFakturConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteTandaTerimaFakturConfirmation.loading}
      />
    </div>
  );
};

export default TandaTerimaFakturPage;
