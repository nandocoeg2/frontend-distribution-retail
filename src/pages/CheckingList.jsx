import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useCheckingListPage from '@/hooks/useCheckingListPage';
import {
  CheckingListTableServerSide,
  CheckingListModal,
  CheckingListDetailModal,
} from '@/components/checkingList';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const resolveChecklistId = (checklist) => {
  if (!checklist || typeof checklist !== 'object') {
    return null;
  }

  return (
    checklist.id ||
    checklist.checklistId ||
    checklist._id ||
    checklist.uuid ||
    null
  );
};

const CheckingList = () => {
  const queryClient = useQueryClient();

  const {
    pagination,
    error,
    createChecklist,
    updateChecklist,
    deleteChecklist: showDeleteChecklistDialog,
    deleteChecklistConfirmation,
    fetchChecklistById,
    handleRetryFetch,
  } = useCheckingListPage();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [detailChecklist, setDetailChecklist] = useState(null);

  const pageSubtitle = useMemo(
    () =>
      'Kelola checklist surat jalan untuk memastikan proses pengecekan sebelum pengiriman berjalan sesuai prosedur.',
    []
  );

  const pageTitle = useMemo(
    () => 'Manajemen Checklist Surat Jalan',
    []
  );

  const openCreateModal = () => {
    setEditingChecklist(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = useCallback((checklist) => {
    if (!checklist) {
      return;
    }
    setEditingChecklist(checklist);
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingChecklist(null);
  };

  const openDetailModal = useCallback(
    async (checklist) => {
      setDetailChecklist(checklist || null);
      setIsDetailModalOpen(true);

      const checklistId = resolveChecklistId(checklist);
      if (!checklistId) {
        return;
      }

      setDetailLoading(true);
      try {
        const response = await fetchChecklistById(checklistId);
        if (response) {
          setDetailChecklist(response);
        }
      } catch (fetchError) {
        console.error('Failed to fetch checklist detail:', fetchError);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchChecklistById]
  );

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailLoading(false);
    setDetailChecklist(null);
  };

  const handleCreateSubmit = useCallback(
    async (payload) => {
      await createChecklist(payload);
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['checkingList'] });
    },
    [createChecklist, queryClient]
  );

  const handleEditSubmit = useCallback(
    async (payload) => {
      const checklistId = resolveChecklistId(editingChecklist);
      if (!checklistId) {
        return;
      }
      await updateChecklist(checklistId, payload);
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['checkingList'] });
    },
    [editingChecklist, updateChecklist, queryClient]
  );

  const handleDeleteChecklist = useCallback(
    (checklistId) => {
      if (!checklistId) {
        return;
      }
      showDeleteChecklistDialog(checklistId);
    },
    [showDeleteChecklistDialog]
  );

  const handleDeleteConfirm = async () => {
    await deleteChecklistConfirmation.confirmDelete();
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['checkingList'] });
  };

  const handleRetry = () => {
    handleRetryFetch();
  };

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>{pageTitle}</h3>
              <p className='text-sm text-gray-500'>{pageSubtitle}</p>
            </div>
            {/* <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah Checklist
              </button>
            </div> */}
          </div>

          {error ? (
            <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
              <p className='mb-3 text-sm text-red-800'>
                Terjadi kesalahan saat memuat checklist: {error}
              </p>
              <button
                type='button'
                onClick={handleRetry}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700'
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <CheckingListTableServerSide
              onView={openDetailModal}
              onEdit={openEditModal}
              onDelete={handleDeleteChecklist}
              deleteLoading={deleteChecklistConfirmation.loading}
              initialPage={pagination?.currentPage || 1}
              initialLimit={pagination?.itemsPerPage || 10}
            />
          )}
        </div>
      </div>

      <CheckingListModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <CheckingListModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        initialValues={editingChecklist}
        isEdit
      />

      <CheckingListDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        checklist={detailChecklist}
        isLoading={detailLoading}
      />

      <ConfirmationDialog
        show={deleteChecklistConfirmation.showConfirm}
        onClose={deleteChecklistConfirmation.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteChecklistConfirmation.title}
        message={deleteChecklistConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteChecklistConfirmation.loading}
      />
    </div>
  );
};

export default CheckingList;
