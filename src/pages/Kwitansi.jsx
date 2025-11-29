import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useKwitansiPage from '@/hooks/useKwitansiPage';
import {
  KwitansiTableServerSide,
  KwitansiModal,
  KwitansiDetailCard,
} from '@/components/kwitansi';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import toastService from '@/services/toastService';
import kwitansiService from '@/services/kwitansiService';
import authService from '@/services/authService';

const KwitansiPage = () => {
  const queryClient = useQueryClient();

  const {
    createKwitansi,
    updateKwitansi,
    deleteKwitansiConfirmation,
    fetchKwitansiById,
  } = useKwitansiPage();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedKwitansiForDetail, setSelectedKwitansiForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [exportingPaketId, setExportingPaketId] = useState(null);
  const [selectedKwitansis, setSelectedKwitansis] = useState([]);

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
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

  const handleExportKwitansiPaket = useCallback(
    async (kwitansiOrId) => {
      const kwitansiId =
        typeof kwitansiOrId === 'string'
          ? kwitansiOrId
          : kwitansiOrId?.id;

      if (!kwitansiId) {
        toastService.warning('Data kwitansi tidak ditemukan untuk diekspor.');
        return;
      }

      setExportingPaketId(kwitansiId);

      try {
        // Get company ID from auth
        const companyData = authService.getCompanyData();
        if (!companyData || !companyData.id) {
          toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
          return;
        }

        toastService.info('Generating kwitansi paket (Kwitansi + Invoice Pengiriman)...');

        // Call backend API to get HTML
        const html = await kwitansiService.exportKwitansiPaket(kwitansiId, companyData.id);

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

          toastService.success('Kwitansi paket berhasil di-generate. Silakan print.');
        } else {
          toastService.error('Popup window diblokir. Silakan izinkan popup untuk mencetak.');
        }
      } catch (error) {
        console.error('Failed to export kwitansi paket:', error);
        toastService.error(error.message || 'Gagal mengekspor kwitansi paket');
      } finally {
        setExportingPaketId(null);
      }
    },
    []
  );

  const handleSelectKwitansi = useCallback((kwitansiId, isSelected) => {
    setSelectedKwitansis((prev) => {
      if (isSelected) {
        return prev.includes(kwitansiId) ? prev : [...prev, kwitansiId];
      } else {
        return prev.filter((id) => id !== kwitansiId);
      }
    });
  }, []);

  const hasSelectedKwitansis = selectedKwitansis.length > 0;

  const handleModalSuccess = useCallback(async () => {
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['kwitansi'] });
    closeCreateModal();
  }, [queryClient]);

  const handleCreateSubmit = async (payload) => {
    const result = await createKwitansi(payload);
    if (result) {
      await handleModalSuccess();
    }
  };

  const handleDetailUpdate = useCallback(async () => {
    // Invalidate queries and refresh detail
    await queryClient.invalidateQueries({ queryKey: ['kwitansi'] });
    if (selectedKwitansiForDetail?.id) {
      try {
        const refreshedDetail = await fetchKwitansiById(selectedKwitansiForDetail.id);
        setSelectedKwitansiForDetail(refreshedDetail);
      } catch (error) {
        console.warn('Failed to refresh kwitansi detail:', error);
      }
    }
  }, [queryClient, selectedKwitansiForDetail, fetchKwitansiById]);

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
    <div className='p-3 space-y-3'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-3 py-3'>
          <div className='mb-2 flex justify-between items-center'>
            <h3 className='text-sm font-semibold text-gray-900'>Kwitansi</h3>
          </div>

          <KwitansiTableServerSide
            onDelete={handleDelete}
            deleteLoading={deleteKwitansiConfirmation.loading}
            initialPage={1}
            initialLimit={10}
            onRowClick={handleViewDetail}
            selectedKwitansiId={selectedKwitansiForDetail?.id}
            selectedKwitansis={selectedKwitansis}
            onSelectKwitansi={handleSelectKwitansi}
            hasSelectedKwitansis={hasSelectedKwitansis}
          />
        </div>
      </div>

      <KwitansiModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
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
          onExportPaket={handleExportKwitansiPaket}
          exportPaketLoading={
            Boolean(selectedKwitansiForDetail?.id) &&
            exportingPaketId === selectedKwitansiForDetail?.id
          }
          updateKwitansi={updateKwitansi}
          onUpdate={handleDetailUpdate}
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
