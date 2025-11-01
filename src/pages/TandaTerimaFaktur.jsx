import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useTandaTerimaFakturPage from '@/hooks/useTandaTerimaFakturPage';
import {
  TandaTerimaFakturTableServerSide,
  TandaTerimaFakturModal,
  TandaTerimaFakturDetailModal,
  TandaTerimaFakturDocumentsModal,
} from '@/components/tandaTerimaFaktur';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import toastService from '@/services/toastService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: {
    label: 'Pending',
    statusCode: 'PENDING TANDA TERIMA FAKTUR',
  },
  processing: {
    label: 'Processing',
    statusCode: 'PROCESSING TANDA TERIMA FAKTUR',
  },
  delivered: {
    label: 'Delivered',
    statusCode: 'DELIVERED TANDA TERIMA FAKTUR',
  },
  received: {
    label: 'Received',
    statusCode: 'RECEIVED TANDA TERIMA FAKTUR',
  },
  cancelled: {
    label: 'Cancelled',
    statusCode: 'CANCELLED TANDA TERIMA FAKTUR',
  },
  completed: {
    label: 'Completed',
    statusCode: 'COMPLETED TANDA TERIMA FAKTUR',
  },
};

const TAB_ORDER = [
  'all',
  'pending',
  'processing',
  'delivered',
  'received',
  'cancelled',
  'completed',
];

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const TandaTerimaFakturPage = () => {
  const queryClient = useQueryClient();
  
  const {
    createTandaTerimaFaktur,
    updateTandaTerimaFaktur,
    deleteTandaTerimaFaktur: triggerDeleteTandaTerimaFaktur,
    deleteTandaTerimaFakturConfirmation,
    fetchTandaTerimaFakturById,
    assignDocuments: assignDocumentsToTandaTerimaFaktur,
    unassignDocuments: unassignDocumentsFromTandaTerimaFaktur,
  } = useTandaTerimaFakturPage();

  const [selectedTtf, setSelectedTtf] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [assignModalTarget, setAssignModalTarget] = useState(null);
  const [unassignModalTarget, setUnassignModalTarget] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [assignRequestLoading, setAssignRequestLoading] = useState(false);
  const [unassignRequestLoading, setUnassignRequestLoading] = useState(false);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const openCreateModal = () => {
    setSelectedTtf(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (ttf) => {
    setSelectedTtf(ttf);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTtf(null);
  };

  const openDetailModal = useCallback(
    async (ttf) => {
      if (!ttf?.id) {
        return;
      }
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      try {
        const detail = await fetchTandaTerimaFakturById(ttf.id);
        setSelectedTtf(detail || ttf);
      } catch (err) {
        setSelectedTtf(ttf);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchTandaTerimaFakturById]
  );

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTtf(null);
    setDetailLoading(false);
  };

  const resolveTandaTerimaFakturDetail = useCallback(
    async (ttf) => {
      if (!ttf?.id) {
        return ttf || null;
      }

      try {
        const detail = await fetchTandaTerimaFakturById(ttf.id);
        return detail || ttf;
      } catch (error) {
        console.error('Failed to fetch tanda terima faktur detail:', error);
        return ttf;
      }
    },
    [fetchTandaTerimaFakturById]
  );

  const openAssignDocumentsModal = useCallback(
    (ttf) => {
      if (!ttf) {
        return;
      }

      setAssignModalTarget(ttf);
      setIsAssignModalOpen(true);

      (async () => {
        try {
          const detail = await resolveTandaTerimaFakturDetail(ttf);
          setAssignModalTarget(detail);
        } catch (error) {
          console.error('Failed to prepare assign dokumen modal:', error);
        }
      })();
    },
    [resolveTandaTerimaFakturDetail]
  );

  const openUnassignDocumentsModal = useCallback(
    (ttf) => {
      if (!ttf) {
        return;
      }

      setUnassignModalTarget(ttf);
      setIsUnassignModalOpen(true);

      (async () => {
        try {
          const detail = await resolveTandaTerimaFakturDetail(ttf);
          setUnassignModalTarget(detail);
        } catch (error) {
          console.error('Failed to prepare unassign dokumen modal:', error);
        }
      })();
    },
    [resolveTandaTerimaFakturDetail]
  );

  const closeAssignModal = useCallback(() => {
    setIsAssignModalOpen(false);
    setAssignModalTarget(null);
  }, []);

  const closeUnassignModal = useCallback(() => {
    setIsUnassignModalOpen(false);
    setUnassignModalTarget(null);
  }, []);

  const handleAssignDocumentsSubmit = useCallback(
    async ({ fakturPajakIds, laporanIds }) => {
      if (!assignModalTarget?.id) {
        toastService.error('Data tanda terima faktur tidak ditemukan.');
        return;
      }

      setAssignRequestLoading(true);
      try {
        await assignDocumentsToTandaTerimaFaktur(assignModalTarget.id, {
          fakturPajakIds,
          laporanIds,
        });
        closeAssignModal();
      } catch (error) {
        console.error('Gagal meng-assign dokumen tanda terima faktur:', error);
      } finally {
        setAssignRequestLoading(false);
      }
    },
    [assignModalTarget, assignDocumentsToTandaTerimaFaktur, closeAssignModal]
  );

  const handleUnassignDocumentsSubmit = useCallback(
    async ({ fakturPajakIds, laporanIds }) => {
      if (!unassignModalTarget?.id) {
        toastService.error('Data tanda terima faktur tidak ditemukan.');
        return;
      }

      setUnassignRequestLoading(true);
      try {
        await unassignDocumentsFromTandaTerimaFaktur(unassignModalTarget.id, {
          fakturPajakIds,
          laporanIds,
        });
        closeUnassignModal();
      } catch (error) {
        console.error('Gagal meng-unassign dokumen tanda terima faktur:', error);
      } finally {
        setUnassignRequestLoading(false);
      }
    },
    [
      unassignModalTarget,
      unassignDocumentsFromTandaTerimaFaktur,
      closeUnassignModal,
    ]
  );

  const handleModalSuccess = useCallback(() => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['tandaTerimaFaktur'] });
    closeCreateModal();
    closeEditModal();
  }, [closeCreateModal, closeEditModal, queryClient]);

  const handleCreateSubmit = async (payload) => {
    const result = await createTandaTerimaFaktur(payload);
    if (result) {
      handleModalSuccess();
    }
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedTtf?.id) {
      return;
    }
    const result = await updateTandaTerimaFaktur(selectedTtf.id, payload);
    if (result) {
      handleModalSuccess();
    }
  };

  const handleDelete = (id) => {
    if (!id) {
      return;
    }
    triggerDeleteTandaTerimaFaktur(id);
  };

  const handleDeleteConfirm = useCallback(async () => {
    await deleteTandaTerimaFakturConfirmation.confirmDelete();
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['tandaTerimaFaktur'] });
  }, [deleteTandaTerimaFakturConfirmation, queryClient]);

  const assignActionDisabled =
    assignRequestLoading ||
    unassignRequestLoading ||
    isAssignModalOpen ||
    isUnassignModalOpen;
  const unassignActionDisabled =
    unassignRequestLoading ||
    assignRequestLoading ||
    isAssignModalOpen ||
    isUnassignModalOpen;

  const statusTabs = useMemo(
    () =>
      TAB_ORDER.map((tabId) => ({
        id: tabId,
        label: TAB_STATUS_CONFIG[tabId]?.label || tabId,
      })),
    []
  );

  const deleteConfirmationProps = deleteTandaTerimaFakturConfirmation;

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div className='space-y-1'>
              <h3 className='text-lg font-medium text-gray-900'>
                Tanda Terima Faktur
              </h3>
              <p className='text-sm text-gray-500'>
                Catat dan kelola serah terima dokumen faktur antara supplier
                dan customer.
              </p>
            </div>
            <div className='flex items-center justify-end gap-3'>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah TTF
              </button>
            </div>
          </div>

          <div className='mb-4 overflow-x-auto'>
            <TabContainer
              activeTab={activeTab}
              onTabChange={handleTabChange}
              variant='underline'
            >
              {statusTabs.map((tab) => (
                <Tab
                  key={tab.id}
                  id={tab.id}
                  label={tab.label}
                />
              ))}
            </TabContainer>
          </div>

          <TandaTerimaFakturTableServerSide
            onView={openDetailModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onAssignDocuments={openAssignDocumentsModal}
            onUnassignDocuments={openUnassignDocumentsModal}
            deleteLoading={deleteConfirmationProps.loading}
            assignLoading={assignActionDisabled}
            unassignLoading={unassignActionDisabled}
            initialPage={1}
            initialLimit={10}
            activeTab={activeTab}
          />
        </div>
      </div>

      <TandaTerimaFakturModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <TandaTerimaFakturModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedTtf}
        isEdit
      />

      <TandaTerimaFakturDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        tandaTerimaFaktur={selectedTtf}
        isLoading={detailLoading}
      />

      <TandaTerimaFakturDocumentsModal
        isOpen={isAssignModalOpen}
        onClose={closeAssignModal}
        onSubmit={handleAssignDocumentsSubmit}
        tandaTerimaFaktur={assignModalTarget}
        mode='assign'
        loading={assignRequestLoading}
      />

      <TandaTerimaFakturDocumentsModal
        isOpen={isUnassignModalOpen}
        onClose={closeUnassignModal}
        onSubmit={handleUnassignDocumentsSubmit}
        tandaTerimaFaktur={unassignModalTarget}
        mode='unassign'
        loading={unassignRequestLoading}
      />

      <ConfirmationDialog
        show={deleteConfirmationProps.showConfirm}
        onClose={deleteConfirmationProps.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteConfirmationProps.title}
        message={deleteConfirmationProps.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteConfirmationProps.loading}
      />
    </div>
  );
};

export default TandaTerimaFakturPage;
