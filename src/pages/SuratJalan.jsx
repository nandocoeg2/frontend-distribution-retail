import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SuratJalanTableServerSide } from '@/components/suratJalan';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import {
  ConfirmationDialog as BaseConfirmationDialog,
  useConfirmationDialog,
} from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import AddSuratJalanModal from '../components/suratJalan/AddSuratJalanModal';
import SuratJalanDetailCard from '../components/suratJalan/SuratJalanDetailCard';
import suratJalanService from '../services/suratJalanService';
import toastService from '../services/toastService';
import { useNavigate } from 'react-router-dom';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  draft: { label: 'Draft', statusCode: 'DRAFT SURAT JALAN' },
  readyToShip: {
    label: 'Ready to Ship',
    statusCode: 'READY TO SHIP SURAT JALAN',
  },
  delivered: { label: 'Delivered', statusCode: 'DELIVERED SURAT JALAN' },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED SURAT JALAN' },
};

const TAB_ORDER = [
  'all',
  'draft',
  'readyToShip',
  'delivered',
  'cancelled',
];

const SuratJalan = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSuratJalanForDetail, setSelectedSuratJalanForDetail] = useState(null);
  const [selectedSuratJalan, setSelectedSuratJalan] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const {
    showDialog: showDeleteDialog,
    hideDialog: hideDeleteDialog,
    setLoading: setDeleteDialogLoading,
    ConfirmationDialog: DeleteConfirmationDialog,
  } = useConfirmationDialog();


  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      setSelectedSuratJalan([]);
    },
    []
  );

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  // Edit logic moved to SuratJalanDetailCard
  const handleEditClick = async (suratJalanItem) => {
    handleViewDetail(suratJalanItem);
  };

  const handleViewDetail = async (suratJalanItem) => {
    if (!suratJalanItem?.id) {
      toastService.error('Surat jalan tidak valid');
      return;
    }

    // Toggle detail card: if clicking the same row, close it
    if (selectedSuratJalanForDetail?.id === suratJalanItem.id) {
      setSelectedSuratJalanForDetail(null);
      return;
    }

    try {
      setDetailLoading(true);
      const response = await suratJalanService.getSuratJalanById(suratJalanItem.id);
      const detailData = response?.data?.data ?? response?.data;

      if (response?.success === false || !detailData) {
        toastService.error(response?.message || 'Gagal memuat detail surat jalan');
        return;
      }

      setSelectedSuratJalanForDetail(detailData);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }
      console.error('Error fetching surat jalan detail:', err);
      toastService.error('Gagal memuat detail surat jalan');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSuratJalanForDetail(null);
  };

  const handleDelete = useCallback((id) => {
    showDeleteDialog({
      title: 'Hapus Surat Jalan',
      message: 'Apakah Anda yakin ingin menghapus surat jalan ini?',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: async () => {
        setDeleteDialogLoading(true);
        try {
          await suratJalanService.deleteSuratJalan(id);
          toastService.success('Surat jalan berhasil dihapus');
          // Invalidate queries to refresh data
          await queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
          hideDeleteDialog();
        } catch (err) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            handleAuthError();
            return;
          }
          const message =
            err?.response?.data?.error?.message ||
            err?.message ||
            'Gagal menghapus surat jalan';
          toastService.error(message);
        } finally {
          setDeleteDialogLoading(false);
        }
      },
    });
  }, [showDeleteDialog, hideDeleteDialog, setDeleteDialogLoading, handleAuthError, queryClient]);

  const handleSelectSuratJalan = useCallback((suratJalanItem) => {
    setSelectedSuratJalan((prevSelected) => {
      const itemId = typeof suratJalanItem === 'string' ? suratJalanItem : suratJalanItem?.id;
      if (prevSelected.some(item => (typeof item === 'string' ? item : item?.id) === itemId)) {
        return prevSelected.filter((item) => (typeof item === 'string' ? item : item?.id) !== itemId);
      }
      return [...prevSelected, suratJalanItem];
    });
  }, []);

  const handleSelectAllSuratJalan = useCallback((items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
      setSelectedSuratJalan([]);
      return;
    }

    const validItems = items.filter(item => item && item.id);

    setSelectedSuratJalan((prevSelected) => {
      if (validItems.length === 0) {
        return [];
      }

      const prevIds = prevSelected.map(item => typeof item === 'string' ? item : item?.id);
      const isAllSelected = validItems.every((item) => prevIds.includes(item.id));
      return isAllSelected ? [] : validItems;
    });
  }, []);

  const handleProcessSelected = useCallback(() => {
    if (selectedSuratJalan.length === 0) {
      toastService.error('Pilih minimal satu surat jalan untuk diproses');
      return;
    }

    const selectedSummary = selectedSuratJalan
      .map((item) => {
        if (!item) return null;
        return {
          id: item.id,
          display: item.no_surat_jalan || '(No. Surat Jalan tidak tersedia)',
          subtitle: item.deliver_to || item.deliverTo || undefined,
        };
      })
      .filter((item) => item !== null);

    const summaryList = selectedSummary
      .map((item) => `• ${item.display}${item.subtitle ? ` - ${item.subtitle}` : ''}`)
      .join('\n');

    showDeleteDialog({
      title: 'Proses Surat Jalan',
      message: `Anda akan memproses ${selectedSuratJalan.length} surat jalan:\n\n${summaryList}\n\nTanggal checklist akan diisi dengan tanggal sekarang. Lanjutkan?`,
      confirmText: 'Proses',
      cancelText: 'Batal',
      type: 'info',
      onConfirm: async () => {
        setDeleteDialogLoading(true);
        setIsProcessing(true);
        try {
          const selectedIds = selectedSuratJalan.map(item => typeof item === 'string' ? item : item?.id).filter(Boolean);
          const requestBody = {
            ids: selectedIds,
            checklist: {
              status_code: 'PENDING CHECKLIST SURAT JALAN',
              tanggal: new Date().toISOString(),
            },
          };

          const response = await suratJalanService.processSuratJalan(requestBody);

          if (response?.success === false) {
            const errorMessage =
              response?.message ||
              response?.error?.message ||
              'Gagal memproses surat jalan';
            toastService.error(errorMessage);
            return;
          }

          const successMessage =
            response?.data?.message ||
            `Surat jalan berhasil diproses (${selectedSuratJalan.length})`;
          toastService.success(successMessage);

          setSelectedSuratJalan([]);
          hideDeleteDialog();

          // Invalidate queries to refresh data
          await queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
        } catch (err) {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            handleAuthError();
            return;
          }
          const message =
            err?.response?.data?.error?.message ||
            err?.message ||
            'Gagal memproses surat jalan';
          toastService.error(message);
        } finally {
          setDeleteDialogLoading(false);
          setIsProcessing(false);
        }
      },
    });
  }, [selectedSuratJalan, showDeleteDialog, hideDeleteDialog, setDeleteDialogLoading, handleAuthError, queryClient]);



  const handleSuratJalanAdded = useCallback(() => {
    setSelectedSuratJalan([]);
    closeAddModal();
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
  }, [queryClient]);

  const handleSuratJalanUpdated = useCallback(() => {
    // Refresh data after update from Detail Card
    queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
    // We might want to refresh the detail view as well if it's open, 
    // but SuratJalanDetailCard handles its own internal state update via onUpdate callback if we pass it correctly?
    // Actually, if we invalidate queries, the table updates. 
    // For the detail card, if we want it to reflect changes immediately, we might need to re-fetch or update local state.
    // But let's see how Companies.jsx does it.
    // Companies.jsx: fetchCompanies(pagination.currentPage, pagination.itemsPerPage); handleViewDetail(selectedCompanyForDetail);

    if (selectedSuratJalanForDetail) {
      // Re-fetch detail to ensure consistency
      handleViewDetail(selectedSuratJalanForDetail);
    }
  }, [queryClient, selectedSuratJalanForDetail]);

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Manajemen Surat Jalan
              </h3>
              <p className='text-sm text-gray-500'>
                Kelola dan pantau surat jalan pengiriman pelanggan.
              </p>
            </div>
            {/* Uncomment jika perlu tombol tambah */}
            {/* <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Surat Jalan
            </button> */}
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

          <SuratJalanTableServerSide
            onEdit={handleEditClick}
            onDelete={handleDelete}
            deleteLoading={deleteLoading}
            selectedSuratJalan={selectedSuratJalan}
            onSelectSuratJalan={handleSelectSuratJalan}
            onSelectAllSuratJalan={handleSelectAllSuratJalan}
            onProcessSelected={handleProcessSelected}
            isProcessing={isProcessing}
            hasSelectedSuratJalan={selectedSuratJalan.length > 0}
            activeTab={activeTab}
            onRowClick={handleViewDetail}
            selectedSuratJalanId={selectedSuratJalanForDetail?.id}
          />
        </div>
      </div>

      <AddSuratJalanModal
        show={showAddModal}
        onClose={closeAddModal}
        onSuratJalanAdded={handleSuratJalanAdded}
        handleAuthError={handleAuthError}
      />

      <DeleteConfirmationDialog />

      {/* Surat Jalan Detail Card */}
      {selectedSuratJalanForDetail && (
        <SuratJalanDetailCard
          suratJalan={selectedSuratJalanForDetail}
          onClose={handleCloseDetail}
          loading={detailLoading}
          onUpdate={handleSuratJalanUpdated}
        />
      )}
    </div>
  );
};

export default SuratJalan;
