import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useFakturPajakPage from '@/hooks/useFakturPajakPage';
import {
  FakturPajakTableServerSide,
  FakturPajakModal,
  FakturPajakDetailModal,
  FakturPajakExportModal,
} from '@/components/fakturPajak';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: {
    label: 'Pending',
    statusCode: 'PENDING FAKTUR PAJAK',
  },
  processing: {
    label: 'Processing',
    statusCode: 'PROCESSING FAKTUR PAJAK',
  },
  issued: {
    label: 'Issued',
    statusCode: 'ISSUED FAKTUR PAJAK',
  },
  cancelled: {
    label: 'Cancelled',
    statusCode: 'CANCELLED FAKTUR PAJAK',
  },
  completed: {
    label: 'Completed',
    statusCode: 'COMPLETED FAKTUR PAJAK',
  },
};

const TAB_ORDER = [
  'all',
  'pending',
  'processing',
  'issued',
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

const FakturPajakPage = () => {
  const queryClient = useQueryClient();
  
  const {
    createFakturPajak,
    updateFakturPajak,
    deleteFakturPajak: triggerDeleteFakturPajak,
    deleteFakturPajakConfirmation,
    fetchFakturPajakById,
  } = useFakturPajakPage();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedFakturPajak, setSelectedFakturPajak] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteFakturPajakConfirmation.confirmDelete();
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['fakturPajak'] });
  }, [deleteFakturPajakConfirmation, queryClient]);

  const openCreateModal = () => {
    setSelectedFakturPajak(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (fakturPajak) => {
    setSelectedFakturPajak(fakturPajak);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedFakturPajak(null);
  };

  const openExportModal = () => {
    setIsExportModalOpen(true);
  };

  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  const openDetailModal = useCallback(
    async (fakturPajak) => {
      if (!fakturPajak?.id) {
        return;
      }
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      try {
        const detail = await fetchFakturPajakById(fakturPajak.id);
        setSelectedFakturPajak(detail || fakturPajak);
      } catch (err) {
        setSelectedFakturPajak(fakturPajak);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchFakturPajakById]
  );

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedFakturPajak(null);
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

  const handleUpdateSubmit = async (payload) => {
    if (!selectedFakturPajak?.id) {
      return;
    }
    const result = await updateFakturPajak(selectedFakturPajak.id, payload);
    if (result) {
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['fakturPajak'] });
      setIsEditModalOpen(false);
      setSelectedFakturPajak(null);
    }
  };

  const handleDelete = (fakturPajak) => {
    if (!fakturPajak?.id) {
      return;
    }
    triggerDeleteFakturPajak(fakturPajak.id);
  };

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Manajemen Faktur Pajak
              </h3>
              <p className='text-sm text-gray-500'>
                Kelola faktur pajak penjualan beserta relasi invoice dan laporan
                penerimaan barang.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={openExportModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700'
              >
                <HeroIcon name='archive-box' className='w-5 h-5 mr-2' />
                Export e-Faktur DJP
              </button>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah Faktur Pajak
              </button>
            </div>
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
                />
              ))}
            </TabContainer>
          </div>

          <FakturPajakTableServerSide
            onView={openDetailModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            deleteLoading={deleteFakturPajakConfirmation.loading}
            initialPage={1}
            initialLimit={10}
            activeTab={activeTab}
          />
        </div>
      </div>

      <FakturPajakModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <FakturPajakModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedFakturPajak}
        isEdit
      />

      <FakturPajakDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        fakturPajak={selectedFakturPajak}
        isLoading={detailLoading}
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
    </div>
  );
};

export default FakturPajakPage;
