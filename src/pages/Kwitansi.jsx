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

  // Excel export states
  const [exportExcelLoading, setExportExcelLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const [pendingExportFilters, setPendingExportFilters] = useState(null);

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

  // Handle Export Excel - show confirmation dialog
  const handleExportExcel = useCallback((columnFilters) => {
    // Convert column filters array to object for backend
    const filters = {};

    const companyId = authService.getCompanyData()?.id;
    if (companyId) {
      filters.companyId = companyId;
    }

    if (Array.isArray(columnFilters)) {
      columnFilters.forEach(({ id, value }) => {
        if (value !== undefined && value !== null && value !== '') {
          // Map column IDs to backend parameter names
          switch (id) {
            case 'no_invoice_penagihan':
              filters.no_invoice_penagihan = value;
              break;
            case 'no_kwitansi':
              filters.no_kwitansi = value;
              break;
            case 'tanggal':
              // Handle date range filter
              if (typeof value === 'object') {
                if (value.from) filters.tanggal_start = value.from;
                if (value.to) filters.tanggal_end = value.to;
              }
              break;
            case 'grand_total':
              // Handle range filter
              if (typeof value === 'object') {
                if (value.min) filters.grand_total_min = value.min;
                if (value.max) filters.grand_total_max = value.max;
              }
              break;
            case 'customer_name':
              // Handle multi-select customer names
              if (Array.isArray(value) && value.length > 0) {
                filters.customer_names = value;
              }
              break;
            case 'status_code':
              // Handle multi-select status codes
              if (Array.isArray(value) && value.length > 0) {
                filters.status_codes = value;
              }
              break;
            default:
              break;
          }
        }
      });
    }

    setPendingExportFilters(filters);
    setShowExportConfirmation(true);
  }, []);

  // Confirm Export Excel
  const confirmExportExcel = useCallback(async () => {
    try {
      setShowExportConfirmation(false);
      setExportExcelLoading(true);

      await kwitansiService.exportExcel(pendingExportFilters || {});
      toastService.success('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      toastService.error(err.message || 'Gagal mengexport data');
    } finally {
      setExportExcelLoading(false);
      setPendingExportFilters(null);
    }
  }, [pendingExportFilters]);

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
            <button
              onClick={() => handleExportExcel([])}
              disabled={exportExcelLoading}
              className='inline-flex items-center px-3 py-1.5 text-xs bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {exportExcelLoading ? (
                <>
                  <div className='animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5'></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export Excel
                </>
              )}
            </button>
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

      {/* Delete Confirmation Dialog */}
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

      {/* Export Excel Confirmation Dialog */}
      <ConfirmationDialog
        show={showExportConfirmation}
        onClose={() => setShowExportConfirmation(false)}
        onConfirm={confirmExportExcel}
        title="Konfirmasi Export"
        message="Apakah Anda yakin ingin mengexport data ini ke Excel?"
        type="info"
        confirmText="Ya, Export"
        cancelText="Batal"
        loading={exportExcelLoading}
      />
    </div>
  );
};

export default KwitansiPage;

