import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useCheckingListPage from '@/hooks/useCheckingListPage';
import {
  CheckingListTableServerSide,
  CheckingListDetailCard,
  CheckingListModal,
} from '@/components/checkingList';
import { useConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import checkingListService from '@/services/checkingListService';
import toastService from '@/services/toastService';

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
    error,
    bulkDeleteChecklists,
    fetchChecklistById,
    handleRetryFetch,
  } = useCheckingListPage();

  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [selectedChecklists, setSelectedChecklists] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);

  const {
    showDialog: showDeleteDialog,
    hideDialog: hideDeleteDialog,
    setLoading: setDeleteDialogLoading,
    ConfirmationDialog: DeleteConfirmationDialog,
  } = useConfirmationDialog();

  const openEditModal = useCallback(async (checklist) => {
    const checklistId = resolveChecklistId(checklist);
    if (!checklistId) return;

    try {
      const detail = await fetchChecklistById(checklistId);
      setEditingChecklist(detail || checklist);
    } catch (err) {
      console.warn('Failed to fetch full checklist detail for edit, falling back to row data:', err);
      setEditingChecklist(checklist);
    } finally {
      setIsEditModalOpen(true);
    }
  }, [fetchChecklistById]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingChecklist(null);
  }, []);

  const handleModalSuccess = useCallback(
    async (formData) => {
      const checklistId = resolveChecklistId(editingChecklist);
      if (!checklistId) return;

      try {
        const response = await checkingListService.updateChecklist(checklistId, formData);
        const updatedData = response?.data || response;
        toastService.success('Checklist berhasil diperbarui');

        // Immediately update selectedChecklist if currently open
        if (resolveChecklistId(selectedChecklist) === checklistId) {
          setSelectedChecklist(updatedData);
        }

        await queryClient.invalidateQueries({ queryKey: ['checkingList'] });

        // Background refresh detail with audit trails
        if (resolveChecklistId(selectedChecklist) === checklistId) {
          try {
            const refreshed = await fetchChecklistById(checklistId);
            if (refreshed) {
              setSelectedChecklist(refreshed);
            }
          } catch (fetchErr) {
            console.error('Failed to refresh checklist detail:', fetchErr);
          }
        }

        closeEditModal();
      } catch (updateError) {
        console.error('Failed to update checklist:', updateError);
        toastService.error(updateError.message || 'Gagal memperbarui checklist');
      }
    },
    [editingChecklist, selectedChecklist, fetchChecklistById, queryClient, closeEditModal]
  );

  const handleViewDetail = useCallback(
    async (checklist) => {
      const checklistId = resolveChecklistId(checklist);
      if (!checklistId) {
        return;
      }

      // Toggle detail card if same item clicked
      if (resolveChecklistId(selectedChecklist) === checklistId) {
        setSelectedChecklist(null);
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
    [fetchChecklistById, selectedChecklist]
  );

  const handleCloseDetail = () => {
    setSelectedChecklist(null);
    setDetailLoading(false);
  };

  const handleChecklistUpdated = useCallback(
    async (updatedData) => {
      // 1. Instantly update selectedChecklist with direct response
      if (updatedData) {
        const directData = updatedData?.data || updatedData;
        setSelectedChecklist(directData);
      }

      // 2. Invalidate table query to refresh the list in background
      await queryClient.invalidateQueries({ queryKey: ['checkingList'] });

      // 3. Fetch fresh detail with audit trails
      const checklistId =
        resolveChecklistId(updatedData?.data || updatedData) ||
        resolveChecklistId(selectedChecklist);

      if (checklistId) {
        try {
          const response = await fetchChecklistById(checklistId);
          if (response) {
            setSelectedChecklist(response);
          }
        } catch (fetchError) {
          console.error('Failed to refresh checklist detail after update:', fetchError);
        }
      }
    },
    [queryClient, selectedChecklist, fetchChecklistById]
  );

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
    <div>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-3 py-3 space-y-2'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900'>Manajemen Checklist Surat Jalan</h3>
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
              onEdit={openEditModal}
              selectedChecklistId={selectedChecklist?.id}
              selectedChecklists={selectedChecklists}
              onSelectChecklist={handleSelectChecklist}
              onDeleteSelected={handleDeleteSelected}
              isDeleting={isDeleting}
              hasSelectedChecklists={hasSelectedChecklists}
            />
          )}
        </div>
      </div>

      {selectedChecklist && (
        <CheckingListDetailCard
          checklist={selectedChecklist}
          onClose={handleCloseDetail}
          isLoading={detailLoading}
          onUpdate={handleChecklistUpdated}
        />
      )}

      {/* Edit Modal */}
      <CheckingListModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        initialData={editingChecklist}
        onSuccess={handleModalSuccess}
      />

      <DeleteConfirmationDialog onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default CheckingList;
