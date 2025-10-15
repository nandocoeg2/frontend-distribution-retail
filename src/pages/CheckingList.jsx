import React, { useCallback, useMemo, useState } from 'react';
import useCheckingListPage from '@/hooks/useCheckingListPage';
import {
  CheckingListSearch,
  CheckingListTable,
  CheckingListModal,
  CheckingListDetailModal,
} from '@/components/checkingList';
import {
  ConfirmationDialog,
  useConfirmationDialog,
} from '@/components/ui/ConfirmationDialog';
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
  const {
    checklists,
    pagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange,
    createChecklist,
    updateChecklist,
    deleteChecklist: showDeleteChecklistDialog,
    deleteChecklistConfirmation,
    fetchChecklists,
    fetchChecklistById,
  } = useCheckingListPage();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [detailChecklist, setDetailChecklist] = useState(null);

  const {
    showDialog: showRefreshDialog,
    hideDialog: hideRefreshDialog,
    ConfirmationDialog: RefreshConfirmationDialog,
    setLoading: setRefreshDialogLoading,
    dialogState: refreshDialogState,
  } = useConfirmationDialog();

  const pageSubtitle = useMemo(
    () =>
      'Kelola checklist surat jalan untuk memastikan proses pengecekan sebelum pengiriman berjalan sesuai prosedur.',
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
    },
    [createChecklist]
  );

  const handleEditSubmit = useCallback(
    async (payload) => {
      const checklistId = resolveChecklistId(editingChecklist);
      if (!checklistId) {
        return;
      }
      await updateChecklist(checklistId, payload);
    },
    [editingChecklist, updateChecklist]
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

  const handleDeleteConfirm = () => {
    deleteChecklistConfirmation.confirmDelete();
  };

  const handleRetry = () => {
    fetchChecklists();
  };

  const handleRefreshTable = () => {
    showRefreshDialog({
      title: 'Muat Ulang Checklist',
      message:
        'Perbaharui data checklist surat jalan terbaru dari server? Perubahan yang belum disimpan akan hilang.',
      confirmText: 'Muat Ulang',
      cancelText: 'Batal',
      type: 'info',
      onConfirm: async () => {
        try {
          setRefreshDialogLoading(true);
          await fetchChecklists();
        } finally {
          setRefreshDialogLoading(false);
          hideRefreshDialog();
        }
      },
    });
  };

  return (
    <div className='p-6'>
      <div className='overflow-hidden rounded-2xl bg-white shadow-lg'>
        <div className='border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white/15'>
                <HeroIcon name='check-circle' className='h-6 w-6' />
              </div>
              <div>
                <h1 className='text-2xl font-semibold'>Checking List</h1>
                <p className='text-sm text-white/80'>{pageSubtitle}</p>
              </div>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <button
                type='button'
                onClick={handleRefreshTable}
                className='inline-flex items-center justify-center rounded-md border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20'
              >
                <HeroIcon name='arrow-path' className='mr-2 h-4 w-4' />
                Muat Ulang
              </button>
              <button
                type='button'
                onClick={openCreateModal}
                className='inline-flex items-center justify-center rounded-md bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50'
              >
                <HeroIcon name='plus' className='mr-2 h-4 w-4' />
                Tambah Checklist
              </button>
            </div>
          </div>
        </div>

        <div className='px-6 py-6'>
          <CheckingListSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChange}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
          />

          {error ? (
            <div className='rounded-xl border border-red-200 bg-red-50 p-4'>
              <p className='text-sm text-red-700'>
                Terjadi kesalahan saat memuat checklist: {error}
              </p>
              <div className='mt-3 flex items-center gap-3'>
                <button
                  type='button'
                  onClick={handleRetry}
                  className='inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-700'
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          ) : (
            <CheckingListTable
              checklists={checklists}
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onEdit={openEditModal}
              onDelete={handleDeleteChecklist}
              onView={openDetailModal}
              loading={loading}
              searchQuery={searchQuery}
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

      <RefreshConfirmationDialog
        onConfirm={() => refreshDialogState?.onConfirm?.()}
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
