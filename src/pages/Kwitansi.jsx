import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useKwitansiPage from '@/hooks/useKwitansiPage';
import {
  KwitansiTableServerSide,
  KwitansiModal,
  KwitansiDetailCard,
} from '@/components/kwitansi';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import toastService from '@/services/toastService';
import kwitansiService from '@/services/kwitansiService';
import authService from '@/services/authService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', filters: null },
  pending: {
    label: 'Pending',
    filters: { status_code: 'PENDING KWITANSI' },
  },
  processing: {
    label: 'Processing',
    filters: { status_code: 'PROCESSING KWITANSI' },
  },
  paid: {
    label: 'Paid',
    filters: { status_code: 'PAID KWITANSI' },
  },
  overdue: {
    label: 'Overdue',
    filters: { status_code: 'OVERDUE KWITANSI' },
  },
  completed: {
    label: 'Completed',
    filters: { status_code: 'COMPLETED KWITANSI' },
  },
  cancelled: {
    label: 'Cancelled',
    filters: { status_code: 'CANCELLED KWITANSI' },
  },
};

const TAB_ORDER = [
  'all',
  'pending',
  'processing',
  'paid',
  'overdue',
  'completed',
  'cancelled',
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

const KwitansiPage = () => {
  const queryClient = useQueryClient();

  const {
    createKwitansi,
    updateKwitansi,
    deleteKwitansiConfirmation,
    fetchKwitansiById,
  } = useKwitansiPage();

  const [selectedKwitansi, setSelectedKwitansi] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedKwitansiForDetail, setSelectedKwitansiForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [exportingId, setExportingId] = useState(null);

  const openCreateModal = () => {
    setSelectedKwitansi(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (kwitansi) => {
    setSelectedKwitansi(kwitansi);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedKwitansi(null);
  };

  const handleViewDetail = useCallback(
    async (kwitansi) => {
      if (!kwitansi?.id) {
        return;
      }

      setDetailLoading(true);
      try {
        const detail = await fetchKwitansiById(kwitansi.id);
        setSelectedKwitansiForDetail(detail || kwitansi);
      } catch (error) {
        console.warn('Failed to fetch kwitansi details, using list data:', error.message);
        setSelectedKwitansiForDetail(kwitansi);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchKwitansiById]
  );

  const handleCloseDetail = () => {
    setSelectedKwitansiForDetail(null);
    setDetailLoading(false);
  };

  const handleExportKwitansi = useCallback(
    async (kwitansiOrId) => {
      const kwitansiId =
        typeof kwitansiOrId === 'string'
          ? kwitansiOrId
          : kwitansiOrId?.id;

      if (!kwitansiId) {
        toastService.warning('Data kwitansi tidak ditemukan untuk diekspor.');
        return;
      }

      setExportingId(kwitansiId);

      try {
        // Get company ID from auth
        const companyData = authService.getCompanyData();
        if (!companyData || !companyData.id) {
          toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
          return;
        }

        toastService.info('Generating kwitansi...');

        // Call backend API to get HTML
        const html = await kwitansiService.exportKwitansi(kwitansiId, companyData.id);

        // Open HTML in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          
          // Wait for content to load, then trigger print dialog
          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };

          toastService.success('Kwitansi berhasil di-generate. Silakan print.');
        } else {
          toastService.error('Popup window diblokir. Silakan izinkan popup untuk mencetak.');
        }
      } catch (error) {
        console.error('Failed to export kwitansi:', error);
        toastService.error(error.message || 'Gagal mengekspor kwitansi');
      } finally {
        setExportingId(null);
      }
    },
    []
  );

  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
    },
    []
  );

  const handleModalSuccess = useCallback(async () => {
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['kwitansi'] });
    closeCreateModal();
    closeEditModal();
  }, [closeCreateModal, closeEditModal, queryClient]);

  const handleCreateSubmit = async (payload) => {
    const result = await createKwitansi(payload);
    if (result) {
      await handleModalSuccess();
    }
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedKwitansi?.id) {
      return;
    }

    const result = await updateKwitansi(selectedKwitansi.id, payload);
    if (result) {
      await handleModalSuccess();
    }
  };

  const handleDelete = (kwitansiOrId) => {
    const id = typeof kwitansiOrId === 'string' ? kwitansiOrId : kwitansiOrId?.id;
    if (!id) {
      return;
    }
    deleteKwitansiConfirmation.showDeleteConfirmation(id);
  };

  const handleDeleteConfirm = useCallback(async () => {
    await deleteKwitansiConfirmation.confirmDelete();
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['kwitansi'] });
  }, [deleteKwitansiConfirmation, queryClient]);

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Manajemen Kwitansi
              </h3>
              <p className='text-sm text-gray-500'>
                Pantau dan kelola bukti pembayaran dari invoice penagihan
                pelanggan.
              </p>
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
                  label={TAB_STATUS_CONFIG[tabId]?.label || tabId}
                />
              ))}
            </TabContainer>
          </div>

          <div className='space-y-4'>
            <KwitansiTableServerSide
              onEdit={openEditModal}
              onDelete={handleDelete}
              onExport={handleExportKwitansi}
              exportingId={exportingId}
              deleteLoading={deleteKwitansiConfirmation.loading}
              initialPage={1}
              initialLimit={10}
              activeTab={activeTab}
              onRowClick={handleViewDetail}
              selectedKwitansiId={selectedKwitansiForDetail?.id}
            />
          </div>
        </div>
      </div>

      <KwitansiModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <KwitansiModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedKwitansi}
        isEdit
      />

      {selectedKwitansiForDetail && (
        <KwitansiDetailCard
          kwitansi={selectedKwitansiForDetail}
          onClose={handleCloseDetail}
          loading={detailLoading}
          onExport={handleExportKwitansi}
          exportLoading={
            Boolean(selectedKwitansiForDetail?.id) &&
            exportingId === selectedKwitansiForDetail?.id
          }
        />
      )}

      <ConfirmationDialog
        show={deleteKwitansiConfirmation.showConfirm}
        onClose={deleteKwitansiConfirmation.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteKwitansiConfirmation.title}
        message={deleteKwitansiConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteKwitansiConfirmation.loading}
      />
    </div>
  );
};

export default KwitansiPage;
