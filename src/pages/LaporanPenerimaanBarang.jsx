import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useLaporanPenerimaanBarangPage from '@/hooks/useLaporanPenerimaanBarangPage';
import {
  LaporanPenerimaanBarangTableServerSide,
  LaporanPenerimaanBarangModal,
  LaporanPenerimaanBarangDetailCard,
  LaporanPenerimaanBarangBulkModal,
} from '@/components/laporanPenerimaanBarang';
import {
  ConfirmationDialog,
  useConfirmationDialog,
} from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const LaporanPenerimaanBarang = () => {
  const queryClient = useQueryClient();

  const {
    createReport,
    createReportFromFile,
    uploadBulkReports,
    uploadBulkReportsTextExtraction,
    fetchBulkStatus,
    fetchBulkFiles,
    updateReport,
    deleteReport,
    deleteReportConfirmation,
    fetchReportById,
    completeReports,
  } = useLaporanPenerimaanBarangPage();

  const [selectedReport, setSelectedReport] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReportForDetail, setSelectedReportForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [isCompletingReports, setIsCompletingReports] = useState(false);

  const {
    showDialog: showCompleteDialog,
    hideDialog: hideCompleteDialog,
    setLoading: setCompleteDialogLoading,
    ConfirmationDialog: CompleteConfirmationDialog,
  } = useConfirmationDialog();

  const resolveReportId = useCallback((report) => {
    if (!report) {
      return null;
    }
    return report?.id || report?.lpbId || report?._id || report?.uuid || null;
  }, []);

  const handleSelectReport = useCallback((reportId, checked) => {
    if (!reportId) {
      return;
    }

    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(reportId);
      } else {
        next.delete(reportId);
      }
      return Array.from(next);
    });
  }, []);

  const handleSelectAllReports = useCallback(() => {
    setSelectedReportIds((prev) => (prev.length > 0 ? [] : []));
  }, []);

  const refreshData = useCallback(() => {
    setSelectedReportIds([]);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
  }, [queryClient]);

  const hasSelectedReports = selectedReportIds.length > 0;

  const handleCompleteSelected = useCallback(() => {
    if (!hasSelectedReports) {
      return;
    }

    showCompleteDialog({
      title: 'Selesaikan Laporan Penerimaan Barang',
      message: `Apakah Anda yakin ingin menyelesaikan ${selectedReportIds.length} laporan penerimaan barang yang dipilih?`,
      confirmText: 'Selesaikan',
      cancelText: 'Batal',
      type: 'info',
    });
  }, [hasSelectedReports, selectedReportIds.length, showCompleteDialog]);

  const handleConfirmComplete = useCallback(async () => {
    setCompleteDialogLoading(true);
    setIsCompletingReports(true);

    try {
      const result = await completeReports(selectedReportIds);

      if (result && Array.isArray(result.failed)) {
        const failedIds = result.failed
          .map((item) => resolveReportId(item))
          .filter(Boolean);

        setSelectedReportIds(Array.from(new Set(failedIds)));
      } else if (result) {
        setSelectedReportIds([]);
      }

      await queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
      hideCompleteDialog();
    } catch (error) {
      console.error('Failed to complete laporan penerimaan barang:', error);
    } finally {
      setCompleteDialogLoading(false);
      setIsCompletingReports(false);
    }
  }, [completeReports, selectedReportIds, resolveReportId, hideCompleteDialog, setCompleteDialogLoading, queryClient]);

  const openCreateModal = useCallback(() => {
    setSelectedReport(null);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setSelectedReport(null);
  }, []);

  const openBulkModal = useCallback(() => {
    setIsBulkModalOpen(true);
  }, []);

  const closeBulkModal = useCallback(() => {
    setIsBulkModalOpen(false);
  }, []);

  const openEditModal = useCallback((report) => {
    setSelectedReport(report);
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedReport(null);
  }, []);

  const handleViewDetail = useCallback(async (report) => {
    if (!report?.id) {
      return;
    }

    setDetailLoading(true);
    setSelectedReportForDetail(null);

    try {
      const detail = await fetchReportById(report.id);
      setSelectedReportForDetail(detail?.data || detail || null);
    } catch (error) {
      console.error('Failed to fetch laporan penerimaan barang detail:', error);
      setSelectedReportForDetail(report);
    } finally {
      setDetailLoading(false);
    }
  }, [fetchReportById]);

  const handleCloseDetail = useCallback(() => {
    setSelectedReportForDetail(null);
    setDetailLoading(false);
  }, []);

  const handleUploadFromFile = useCallback(
    async ({ file, prompt }) => {
      const result = await createReportFromFile({ file, prompt });
      refreshData();
      return result;
    },
    [createReportFromFile, refreshData]
  );

  const handleCreateSubmit = useCallback(async (payload) => {
    await createReport(payload);
    refreshData();
    closeCreateModal();
  }, [createReport, refreshData, closeCreateModal]);

  const handleUpdateSubmit = useCallback(async (payload) => {
    if (!selectedReport?.id) {
      return;
    }
    await updateReport(selectedReport.id, payload);
    refreshData();
    closeEditModal();
  }, [selectedReport?.id, updateReport, refreshData, closeEditModal]);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteReportConfirmation.confirmDelete();
    await queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
  }, [deleteReportConfirmation, queryClient]);

  return (
    <div className='p-3 space-y-3'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-3 py-3'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-semibold text-gray-900'>Laporan Penerimaan Barang</h3>
            <div className='flex items-center gap-1'>
              <button onClick={openBulkModal} className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-indigo-500 rounded hover:bg-indigo-600'>
                <HeroIcon name='arrow-up-tray' className='w-3 h-3 mr-1' />Bulk
              </button>
              <button onClick={openCreateModal} className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700'>
                <HeroIcon name='plus' className='w-3 h-3 mr-1' />Tambah
              </button>
            </div>
          </div>

          <LaporanPenerimaanBarangTableServerSide
            onView={handleViewDetail}
            onEdit={openEditModal}
            onDelete={deleteReport}
            deleteLoading={deleteReportConfirmation.loading}
            selectedReports={selectedReportIds}
            onSelectReport={handleSelectReport}
            onSelectAllReports={handleSelectAllReports}
            onCompleteSelected={handleCompleteSelected}
            isCompleting={isCompletingReports}
            hasSelectedReports={hasSelectedReports}
            initialPage={1}
            initialLimit={10}
            selectedReportId={selectedReportForDetail?.id}
          />
        </div>
      </div>

      <LaporanPenerimaanBarangModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
        onUploadFromFile={handleUploadFromFile}
      />

      <LaporanPenerimaanBarangModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedReport}
        isEdit
      />

      <LaporanPenerimaanBarangBulkModal
        isOpen={isBulkModalOpen}
        onClose={closeBulkModal}
        onBulkUpload={uploadBulkReports}
        onBulkUploadTextExtraction={uploadBulkReportsTextExtraction}
        onFetchStatus={fetchBulkStatus}
        onFetchBulkFiles={fetchBulkFiles}
      />

      <CompleteConfirmationDialog onConfirm={handleConfirmComplete} />

      <ConfirmationDialog
        show={deleteReportConfirmation.showConfirm}
        onClose={deleteReportConfirmation.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteReportConfirmation.title}
        message={deleteReportConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteReportConfirmation.loading}
      />

      {selectedReportForDetail && (
        <LaporanPenerimaanBarangDetailCard report={selectedReportForDetail} onClose={handleCloseDetail} loading={detailLoading} />
      )}
    </div>
  );
};

export default LaporanPenerimaanBarang;
