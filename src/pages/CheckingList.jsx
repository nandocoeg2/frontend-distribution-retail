import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useCheckingListPage from '@/hooks/useCheckingListPage';
import {
  CheckingListTableServerSide,
  CheckingListModal,
  CheckingListDetailCard,
} from '@/components/checkingList';
import { useConfirmationDialog } from '@/components/ui/ConfirmationDialog';
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
    bulkDeleteChecklists,
    fetchChecklistById,
    handleRetryFetch,
  } = useCheckingListPage();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [selectedChecklists, setSelectedChecklists] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    showDialog: showDeleteDialog,
    hideDialog: hideDeleteDialog,
    setLoading: setDeleteDialogLoading,
    ConfirmationDialog: DeleteConfirmationDialog,
  } = useConfirmationDialog();

  const pageTitle = useMemo(
    () => 'Manajemen Checklist Surat Jalan',
    []
  );

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleViewDetail = useCallback(
    async (checklist) => {
      const checklistId = resolveChecklistId(checklist);
      if (!checklistId) {
        return;
      }

      setDetailLoading(true);
      try {
        const response = await fetchChecklistById(checklistId);
        if (response) {
          setSelectedChecklist(response);
        }
      } catch (fetchError) {
        console.error('Failed to fetch checklist detail:', fetchError);
        setSelectedChecklist(checklist);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchChecklistById]
  );

  const handleCloseDetail = () => {
    setSelectedChecklist(null);
    setDetailLoading(false);
  };

  const handleCreateSubmit = useCallback(
    async (payload) => {
      await createChecklist(payload);
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['checkingList'] });
    },
    [createChecklist, queryClient]
  );

  const handleChecklistUpdated = useCallback(async () => {
    // Refresh data after update from Detail Card
    await queryClient.invalidateQueries({ queryKey: ['checkingList'] });
    // Also refresh the detail view if needed
    if (selectedChecklist) {
      const checklistId = resolveChecklistId(selectedChecklist);
      if (checklistId) {
        const response = await fetchChecklistById(checklistId);
        if (response) {
          setSelectedChecklist(response);
        }
      }
    }
  }, [queryClient, selectedChecklist, fetchChecklistById]);

  const handleRetry = () => {
    handleRetryFetch();
  };

  const handleSelectChecklist = useCallback((checklistId, isSelected) => {
    setSelectedChecklists((prev) => {
      if (isSelected) {
        return prev.includes(checklistId) ? prev : [...prev, checklistId];
      } else {
        return prev.filter((id) => id !== checklistId);
      }
    });
  }, []);

  const hasSelectedChecklists = selectedChecklists.length > 0;

  const handleDeleteSelected = useCallback(() => {
    if (!hasSelectedChecklists) {
      return;
    }

    showDeleteDialog({
      title: 'Hapus Checklist Surat Jalan',
      message: `Apakah Anda yakin ingin menghapus ${selectedChecklists.length} checklist surat jalan yang dipilih?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
  }, [hasSelectedChecklists, selectedChecklists.length, showDeleteDialog]);

  const handleConfirmDelete = useCallback(async () => {
    setDeleteDialogLoading(true);
    setIsDeleting(true);

    try {
      const result = await bulkDeleteChecklists(selectedChecklists);

      if (result && Array.isArray(result.failed)) {
        const failedIds = result.failed
          .map((item) => item.id)
          .filter(Boolean);

        setSelectedChecklists(Array.from(new Set(failedIds)));
      } else if (result) {
        setSelectedChecklists([]);
      }

      await queryClient.invalidateQueries({ queryKey: ['checkingList'] });
      hideDeleteDialog();
    } catch (deleteError) {
      console.error('Failed to delete checklist surat jalan:', deleteError);
    } finally {
      setDeleteDialogLoading(false);
      setIsDeleting(false);
    }
  }, [bulkDeleteChecklists, selectedChecklists, hideDeleteDialog, setDeleteDialogLoading, queryClient]);

  return (
    <div className='p-2'>
      <div className='overflow-hidden bg-white rounded-md shadow-sm'>
        <div className='px-3 py-2'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-base font-medium text-gray-900'>{pageTitle}</h3>
            {/* <button
              type='button'
              onClick={openCreateModal}
              className='inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-4 h-4 mr-1' />
              Tambah Checklist
            </button> */}
          </div>

          {error ? (
            <div className='p-2 border border-red-200 rounded bg-red-50'>
              <p className='mb-2 text-xs text-red-800'>
                Terjadi kesalahan saat memuat checklist: {error}
              </p>
              <button
                type='button'
                onClick={handleRetry}
                className='inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700'
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <CheckingListTableServerSide
              onViewDetail={handleViewDetail}
              selectedChecklistId={selectedChecklist?.id}
              initialPage={pagination?.currentPage || 1}
              initialLimit={pagination?.itemsPerPage || 10}
              selectedChecklists={selectedChecklists}
              onSelectChecklist={handleSelectChecklist}
              onDeleteSelected={handleDeleteSelected}
              isDeleting={isDeleting}
              hasSelectedChecklists={hasSelectedChecklists}
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

      {selectedChecklist && (
        <CheckingListDetailCard
          checklist={selectedChecklist}
          onClose={handleCloseDetail}
          isLoading={detailLoading}
          onUpdate={handleChecklistUpdated}
        />
      )}

      <DeleteConfirmationDialog onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default CheckingList;
