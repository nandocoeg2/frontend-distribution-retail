import React, { useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useFakturPajakPage from '@/hooks/useFakturPajakPage';
import {
  FakturPajakTableServerSide,
  FakturPajakModal,
  FakturPajakDetailCard,
  FakturPajakExportModal,
} from '@/components/fakturPajak';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ArchiveBoxIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import fakturPajakService from '@/services/fakturPajakService';
import toastService from '@/services/toastService';

const FakturPajakPage = () => {
  const queryClient = useQueryClient();

  const {
    createFakturPajak,
    updateFakturPajak,
    deleteFakturPajak: triggerDeleteFakturPajak,
    deleteFakturPajakConfirmation,
    fetchFakturPajakById,
  } = useFakturPajakPage();

  const [selectedFakturPajakForDetail, setSelectedFakturPajakForDetail] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [generateTtfConfirmation, setGenerateTtfConfirmation] = useState({
    show: false,
    fakturPajak: null,
  });
  const [generatingTtfFakturPajakId, setGeneratingTtfFakturPajakId] = useState(null);

  // Export Excel states
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const currentQueryParams = useRef({});

  const generateTtfDialogFakturPajak = generateTtfConfirmation.fakturPajak;
  const generateTtfDialogLoading =
    Boolean(generateTtfDialogFakturPajak) &&
    generatingTtfFakturPajakId === generateTtfDialogFakturPajak.id;

  // Handle query params change from table component
  const handleQueryParamsChange = useCallback((params) => {
    currentQueryParams.current = params;
  }, []);

  // Export Excel confirmation
  const handleExportExcel = () => {
    setShowExportConfirmation(true);
  };

  const confirmExportExcel = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);

      // Get current filters from table
      const { filters = {} } = currentQueryParams.current || {};

      await fakturPajakService.exportExcel(filters);
      toastService.success('Data Faktur Pajak berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      toastService.error(err.message || 'Gagal mengexport data Faktur Pajak');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteConfirm = useCallback(async () => {
    await deleteFakturPajakConfirmation.confirmDelete();
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['fakturPajak'] });
  }, [deleteFakturPajakConfirmation, queryClient]);

  const openGenerateTtfDialog = useCallback((fakturPajak) => {
    if (
      !fakturPajak ||
      fakturPajak?.tandaTerimaFakturId ||
      fakturPajak?.tandaTerimaFaktur?.id
    ) {
      return;
    }
    setGenerateTtfConfirmation({
      show: true,
      fakturPajak,
    });
  }, []);

  const closeGenerateTtfDialog = useCallback(() => {
    setGenerateTtfConfirmation({
      show: false,
      fakturPajak: null,
    });
  }, []);

  const handleGenerateTtfConfirm = useCallback(async () => {
    const targetFakturPajak = generateTtfDialogFakturPajak;
    const fakturPajakId = targetFakturPajak?.id;

    if (!fakturPajakId) {
      closeGenerateTtfDialog();
      return;
    }

    setGeneratingTtfFakturPajakId(fakturPajakId);
    try {
      const response =
        await fakturPajakService.generateTandaTerimaFaktur(fakturPajakId);
      const payload = response ?? {};
      if (payload?.success === false) {
        throw new Error(
          payload?.error?.message ||
          'Gagal membuat tanda terima faktur dari faktur pajak.'
        );
      }

      const ttfData = payload?.data ?? payload;
      toastService.success(
        ttfData?.code_supplier
          ? `Tanda terima faktur ${ttfData.code_supplier} berhasil dibuat.`
          : 'Tanda terima faktur berhasil dibuat.'
      );

      closeGenerateTtfDialog();

      setSelectedFakturPajakForDetail((prev) => {
        if (prev?.id !== fakturPajakId) {
          return prev;
        }
        return {
          ...prev,
          tandaTerimaFakturId:
            ttfData?.id ||
            ttfData?.tandaTerimaFakturId ||
            prev?.tandaTerimaFakturId,
          tandaTerimaFaktur: ttfData || prev?.tandaTerimaFaktur,
        };
      });

      await queryClient.invalidateQueries({ queryKey: ['fakturPajak'] });
    } catch (err) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Gagal membuat tanda terima faktur dari faktur pajak.';
      toastService.error(message);
      console.error(
        'Failed to generate tanda terima faktur from faktur pajak:',
        err
      );
    } finally {
      setGeneratingTtfFakturPajakId((current) =>
        current === fakturPajakId ? null : current
      );
    }
  }, [
    closeGenerateTtfDialog,
    generateTtfDialogFakturPajak,
    queryClient,
  ]);

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openExportModal = () => {
    setIsExportModalOpen(true);
  };

  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  const handleViewDetail = useCallback(
    async (fakturPajak) => {
      if (!fakturPajak?.id) {
        return;
      }
      setDetailLoading(true);
      try {
        const detail = await fetchFakturPajakById(fakturPajak.id);
        setSelectedFakturPajakForDetail(detail || fakturPajak);
      } catch (err) {
        console.warn('Failed to fetch faktur pajak details, using list data:', err.message);
        setSelectedFakturPajakForDetail(fakturPajak);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchFakturPajakById]
  );

  const handleCloseDetail = () => {
    setSelectedFakturPajakForDetail(null);
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

  const handleDetailUpdate = useCallback(async () => {
    // Invalidate queries and refresh detail
    await queryClient.invalidateQueries({ queryKey: ['fakturPajak'] });
    if (selectedFakturPajakForDetail?.id) {
      try {
        const refreshedDetail = await fetchFakturPajakById(selectedFakturPajakForDetail.id);
        setSelectedFakturPajakForDetail(refreshedDetail);
      } catch (error) {
        console.warn('Failed to refresh faktur pajak detail:', error);
      }
    }
  }, [queryClient, selectedFakturPajakForDetail, fetchFakturPajakById]);

  const handleDelete = (fakturPajak) => {
    if (!fakturPajak?.id) {
      return;
    }
    triggerDeleteFakturPajak(fakturPajak.id);
  };

  return (
    <div className='p-3 space-y-3'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-3 py-3'>
          <div className='mb-2 flex justify-between items-center'>
            <h3 className='text-sm font-semibold text-gray-900'>Faktur Pajak</h3>
            <div className='flex gap-2'>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {exportLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1'></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className='w-3.5 h-3.5 mr-1' />
                    Export Excel
                  </>
                )}
              </button>
              <button
                onClick={openExportModal}
                className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700'
              >
                <ArchiveBoxIcon className='w-3.5 h-3.5 mr-1' />
                Export e-Faktur
              </button>
            </div>
          </div>

          <FakturPajakTableServerSide
            onView={handleViewDetail}
            onDelete={handleDelete}
            onGenerateTandaTerimaFaktur={openGenerateTtfDialog}
            generatingTandaTerimaFakturPajakId={generatingTtfFakturPajakId}
            deleteLoading={deleteFakturPajakConfirmation.loading}
            initialPage={1}
            initialLimit={10}
            selectedFakturPajakId={selectedFakturPajakForDetail?.id}
            onQueryParamsChange={handleQueryParamsChange}
          />
        </div>
      </div>

      <FakturPajakModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
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

      {/* Faktur Pajak Detail Card */}
      {selectedFakturPajakForDetail && (
        <FakturPajakDetailCard
          fakturPajak={selectedFakturPajakForDetail}
          onClose={handleCloseDetail}
          loading={detailLoading}
          updateFakturPajak={updateFakturPajak}
          onUpdate={handleDetailUpdate}
        />
      )}

      <ConfirmationDialog
        show={generateTtfConfirmation.show}
        onClose={closeGenerateTtfDialog}
        onConfirm={handleGenerateTtfConfirm}
        title='Generate Tanda Terima Faktur'
        message={
          generateTtfDialogFakturPajak
            ? `Apakah Anda yakin ingin membuat tanda terima faktur untuk faktur pajak ${generateTtfDialogFakturPajak.no_pajak ||
            generateTtfDialogFakturPajak.id ||
            ''
            }?`
            : 'Apakah Anda yakin ingin membuat tanda terima faktur untuk faktur pajak ini?'
        }
        confirmText='Ya, buat tanda terima'
        cancelText='Batal'
        type='warning'
        loading={generateTtfDialogLoading}
      />

      {/* Export Excel Confirmation Dialog */}
      <ConfirmationDialog
        show={showExportConfirmation}
        onClose={() => setShowExportConfirmation(false)}
        onConfirm={confirmExportExcel}
        title='Konfirmasi Export'
        message='Apakah Anda yakin ingin mengexport data Faktur Pajak ini ke Excel?'
        type='info'
        confirmText='Ya, Export'
        cancelText='Batal'
        loading={exportLoading}
      />
    </div>
  );
};

export default FakturPajakPage;
