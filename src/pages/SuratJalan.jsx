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
import EditSuratJalanModal from '../components/suratJalan/EditSuratJalanModal';
import ViewSuratJalanModal from '../components/suratJalan/ViewSuratJalanModal';
import ProcessSuratJalanModal from '../components/suratJalan/ProcessSuratJalanModal';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [editingSuratJalan, setEditingSuratJalan] = useState(null);
  const [viewingSuratJalan, setViewingSuratJalan] = useState(null);
  const [selectedSuratJalan, setSelectedSuratJalan] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    showDialog: showDeleteDialog,
    hideDialog: hideDeleteDialog,
    setLoading: setDeleteDialogLoading,
    ConfirmationDialog: DeleteConfirmationDialog,
  } = useConfirmationDialog();

  const {
    showDialog: showProcessDialog,
    hideDialog: hideProcessDialog,
    setLoading: setProcessDialogLoading,
    ConfirmationDialog: ProcessConfirmationDialog,
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

  const openEditModal = async (suratJalanItem) => {
    if (!suratJalanItem?.id) {
      toastService.error('Surat jalan tidak valid');
      return;
    }

    try {
      const response = await suratJalanService.getSuratJalanById(suratJalanItem.id);
      const detailData = response?.data?.data ?? response?.data;

      if (response?.success === false || !detailData) {
        toastService.error(response?.message || 'Gagal memuat detail surat jalan');
        return;
      }

      setEditingSuratJalan(detailData);
      setShowEditModal(true);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }
      console.error('Error fetching surat jalan detail:', err);
      toastService.error('Gagal memuat detail surat jalan');
    }
  };

  const closeEditModal = () => {
    setEditingSuratJalan(null);
    setShowEditModal(false);
  };

  const openViewModal = async (suratJalanItem) => {
    if (!suratJalanItem?.id) {
      toastService.error('Surat jalan tidak valid');
      return;
    }

    try {
      const response = await suratJalanService.getSuratJalanById(suratJalanItem.id);
      const detailData = response?.data?.data ?? response?.data;

      if (response?.success === false || !detailData) {
        toastService.error(response?.message || 'Gagal memuat detail surat jalan');
        return;
      }

      setViewingSuratJalan(detailData);
      setShowViewModal(true);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }
      console.error('Error fetching surat jalan detail:', err);
      toastService.error('Gagal memuat detail surat jalan');
    }
  };

  const closeViewModal = () => {
    setViewingSuratJalan(null);
    setShowViewModal(false);
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

  const handleSelectSuratJalan = useCallback((suratJalanId) => {
    setSelectedSuratJalan((prevSelected) => {
      if (prevSelected.includes(suratJalanId)) {
        return prevSelected.filter((id) => id !== suratJalanId);
      }
      return [...prevSelected, suratJalanId];
    });
  }, []);

  const handleSelectAllSuratJalan = useCallback((items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
      setSelectedSuratJalan([]);
      return;
    }

    const ids = items.map((item) => item?.id).filter(Boolean);
    
    setSelectedSuratJalan((prevSelected) => {
      if (ids.length === 0) {
        return [];
      }
      
      const isAllSelected = ids.every((id) => prevSelected.includes(id));
      return isAllSelected ? [] : ids;
    });
  }, []);

  const handleProcessSelected = useCallback(() => {
    if (selectedSuratJalan.length === 0) {
      toastService.error('Pilih minimal satu surat jalan untuk diproses');
      return;
    }

    setShowProcessModal(true);
  }, [selectedSuratJalan]);

  const closeProcessModal = useCallback(() => {
    setShowProcessModal(false);
  }, []);

  const handleProcessModalSubmit = useCallback(
    async (checklistData) => {
      if (selectedSuratJalan.length === 0) {
        toastService.error('Pilih minimal satu surat jalan untuk diproses');
        return;
      }

      setIsProcessing(true);
      try {
        const requestBody = {
          ids: selectedSuratJalan,
          checklist: checklistData,
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
        closeProcessModal();
        
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
        setIsProcessing(false);
      }
    },
    [selectedSuratJalan, closeProcessModal, handleAuthError, queryClient]
  );

  const handleSuratJalanAdded = useCallback(() => {
    setSelectedSuratJalan([]);
    closeAddModal();
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
  }, [queryClient]);

  const handleSuratJalanUpdated = useCallback(() => {
    setSelectedSuratJalan([]);
    closeEditModal();
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
  }, [queryClient]);

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
            onView={openViewModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            deleteLoading={deleteLoading}
            selectedSuratJalan={selectedSuratJalan}
            onSelectSuratJalan={handleSelectSuratJalan}
            onSelectAllSuratJalan={handleSelectAllSuratJalan}
            onProcessSelected={handleProcessSelected}
            isProcessing={isProcessing}
            hasSelectedSuratJalan={selectedSuratJalan.length > 0}
            activeTab={activeTab}
          />
        </div>
      </div>

      <AddSuratJalanModal
        show={showAddModal}
        onClose={closeAddModal}
        onSuratJalanAdded={handleSuratJalanAdded}
        handleAuthError={handleAuthError}
      />

      <EditSuratJalanModal
        show={showEditModal}
        onClose={closeEditModal}
        suratJalan={editingSuratJalan}
        onSuratJalanUpdated={handleSuratJalanUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewSuratJalanModal
        show={showViewModal}
        onClose={closeViewModal}
        suratJalan={viewingSuratJalan}
      />

      <ProcessSuratJalanModal
        show={showProcessModal}
        onClose={closeProcessModal}
        onSubmit={handleProcessModalSubmit}
        isSubmitting={isProcessing}
        selectedItems={selectedSuratJalan.map(id => ({ id }))}
        selectedIds={selectedSuratJalan}
      />

      <DeleteConfirmationDialog />
      <ProcessConfirmationDialog />
    </div>
  );
};

export default SuratJalan;
