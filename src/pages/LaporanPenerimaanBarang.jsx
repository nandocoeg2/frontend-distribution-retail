import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useLaporanPenerimaanBarangPage from '@/hooks/useLaporanPenerimaanBarangPage';
import {
  LaporanPenerimaanBarangTableServerSide,
  LaporanPenerimaanBarangModal,
  LaporanPenerimaanBarangDetailCard,
  LaporanPenerimaanBarangExportPreviewModal,
  LpbFilePreviewModal,
} from '@/components/laporanPenerimaanBarang';
import {
  useConfirmationDialog,
} from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import laporanPenerimaanBarangService from '@/services/laporanPenerimaanBarangService';
import toastService from '@/services/toastService';
import GenerateInvoicePenagihanDialog from '@/components/invoicePengiriman/GenerateInvoicePenagihanDialog';

const LaporanPenerimaanBarang = () => {
  const queryClient = useQueryClient();

  const {
    createReport,
    uploadBulkReports,
    uploadBulkReportsTextExtraction,
    updateReport,
    bulkDeleteReports,
    fetchReportById,
    completeReports,
  } = useLaporanPenerimaanBarangPage();

  const [selectedReport, setSelectedReport] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReportForDetail, setSelectedReportForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [isCompletingReports, setIsCompletingReports] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [generateConfirmation, setGenerateConfirmation] = useState({
    show: false,
    lpbIds: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewLpbLoading, setIsPreviewLpbLoading] = useState(false);
  const [lpbPreviewModalOpen, setLpbPreviewModalOpen] = useState(false);
  const [lpbPreviewFiles, setLpbPreviewFiles] = useState([]);

  const {
    showDialog: showCompleteDialog,
    hideDialog: hideCompleteDialog,
    setLoading: setCompleteDialogLoading,
    ConfirmationDialog: CompleteConfirmationDialog,
  } = useConfirmationDialog();

  const {
    showDialog: showExportDialog,
    hideDialog: hideExportDialog,
    setLoading: setExportDialogLoading,
    ConfirmationDialog: ExportConfirmationDialog,
  } = useConfirmationDialog();

  const {
    showDialog: showDeleteDialog,
    hideDialog: hideDeleteDialog,
    setLoading: setDeleteDialogLoading,
    ConfirmationDialog: DeleteConfirmationDialog,
  } = useConfirmationDialog();

  const [isDeleting, setIsDeleting] = useState(false);

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

  const refreshData = useCallback(() => {
    setSelectedReportIds([]);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
  }, [queryClient]);

  const handleFiltersChange = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  const handleExportClick = useCallback(() => {
    showExportDialog({
      title: 'Export Excel',
      message: 'Apakah Anda yakin ingin mengexport data Laporan Penerimaan Barang ini ke Excel?',
      confirmText: 'Ya, Export',
      cancelText: 'Batal',
      type: 'info',
    });
  }, [showExportDialog]);

  const handleConfirmExport = useCallback(async () => {
    setExportDialogLoading(true);
    setIsExporting(true);

    try {
      await laporanPenerimaanBarangService.exportExcel(activeFilters);
      toastService.success('Berhasil mengexport data ke Excel');
      hideExportDialog();
    } catch (error) {
      console.error('Failed to export Laporan Penerimaan Barang:', error);
      toastService.error(error.message || 'Gagal mengexport data ke Excel');
    } finally {
      setExportDialogLoading(false);
      setIsExporting(false);
    }
  }, [activeFilters, hideExportDialog, setExportDialogLoading]);

  const handlePreviewExportClick = useCallback(async () => {
    try {
      setPreviewLoading(true);
      setIsPreviewModalOpen(true);
      const response = await laporanPenerimaanBarangService.previewExportExcel(activeFilters);
      setPreviewData(response?.data || response);
    } catch (error) {
      console.error('Failed to load export preview:', error);
      toastService.error('Gagal memuat preview export Excel');
      setIsPreviewModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }, [activeFilters]);

  // Preview LPB using uploaded PDF/Image file from user upload
  const handlePreviewLpb = useCallback(async (targetReportId = null) => {
    let ids = [];
    if (typeof targetReportId === 'string') {
      ids = [targetReportId];
    } else if (targetReportId && (targetReportId.id || targetReportId.lpbId)) {
      ids = [targetReportId.id || targetReportId.lpbId];
    } else if (selectedReportIds.length > 0) {
      ids = selectedReportIds;
    } else if (selectedReportForDetail?.id) {
      ids = [selectedReportForDetail.id];
    }

    if (ids.length === 0) {
      toastService.warning('Pilih minimal satu Laporan Penerimaan Barang untuk melihat preview file LPB.');
      return;
    }

    setIsPreviewLpbLoading(true);
    const loadedFiles = [];
    let failCount = 0;

    try {
      toastService.info(`Memuat preview ${ids.length} file LPB...`);

      for (const id of ids) {
        try {
          const result = await laporanPenerimaanBarangService.exportLPB(id);
          const blobUrl = window.URL.createObjectURL(result.blob);
          const report = selectedReportForDetail?.id === id ? selectedReportForDetail : null;

          loadedFiles.push({
            id,
            url: blobUrl,
            blob: result.blob,
            filename: result.filename,
            contentType: result.contentType,
            lpbNumber: report?.no_lpb || result.filename,
          });
        } catch (err) {
          failCount++;
          console.error(`Gagal memuat file LPB untuk ID ${id}:`, err);
        }
      }

      if (loadedFiles.length === 0) {
        toastService.error('Tidak ada file LPB yang dapat dimuat atau belum ada file yang diunggah untuk LPB ini.');
        return;
      }

      if (failCount > 0) {
        toastService.warning(`${loadedFiles.length} file berhasil dimuat, ${failCount} gagal.`);
      }

      setLpbPreviewFiles(loadedFiles);
      setLpbPreviewModalOpen(true);
    } catch (error) {
      console.error('Failed to preview LPB:', error);
      toastService.error(error.message || 'Gagal memuat preview file LPB.');
    } finally {
      setIsPreviewLpbLoading(false);
    }
  }, [selectedReportIds, selectedReportForDetail]);

  const handleCloseLpbPreview = useCallback(() => {
    // Revoke previous blob URLs to prevent memory leaks
    lpbPreviewFiles.forEach((file) => {
      if (file.url) {
        window.URL.revokeObjectURL(file.url);
      }
    });
    setLpbPreviewFiles([]);
    setLpbPreviewModalOpen(false);
  }, [lpbPreviewFiles]);

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

  const handleDeleteSelected = useCallback(() => {
    if (!hasSelectedReports) {
      return;
    }

    showDeleteDialog({
      title: 'Hapus Laporan Penerimaan Barang',
      message: `Apakah Anda yakin ingin menghapus ${selectedReportIds.length} laporan penerimaan barang yang dipilih?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
  }, [hasSelectedReports, selectedReportIds.length, showDeleteDialog]);

  const handleConfirmDelete = useCallback(async () => {
    setDeleteDialogLoading(true);
    setIsDeleting(true);

    try {
      const result = await bulkDeleteReports(selectedReportIds);

      if (result && Array.isArray(result.failed)) {
        const failedIds = result.failed
          .map((item) => resolveReportId(item))
          .filter(Boolean);

        setSelectedReportIds(Array.from(new Set(failedIds)));
      } else if (result) {
        setSelectedReportIds([]);
      }

      await queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
      hideDeleteDialog();
    } catch (error) {
      console.error('Failed to delete laporan penerimaan barang:', error);
    } finally {
      setDeleteDialogLoading(false);
      setIsDeleting(false);
    }
  }, [bulkDeleteReports, selectedReportIds, resolveReportId, hideDeleteDialog, setDeleteDialogLoading, queryClient]);

  const openGenerateDialog = useCallback((lpbIds) => {
    if (!lpbIds || lpbIds.length === 0) {
      toastService.error('Tidak ada laporan yang dipilih');
      return;
    }
    setGenerateConfirmation({
      show: true,
      lpbIds,
    });
  }, []);

  const closeGenerateDialog = useCallback(() => {
    setGenerateConfirmation({
      show: false,
      lpbIds: [],
    });
  }, []);

  const handleGenerateConfirm = useCallback(async (tanggalDokumen) => {
    const lpbIds = generateConfirmation.lpbIds;

    if (!lpbIds || lpbIds.length === 0) {
      closeGenerateDialog();
      return;
    }

    setIsGenerating(true);
    try {
      toastService.info(`Memproses ${lpbIds.length} laporan penerimaan barang...`);

      // Call bulk API route on laporanPenerimaanBarangService!
      const response = await laporanPenerimaanBarangService.bulkGenerateInvoicePenagihan({
        lpbIds,
        tanggal_dokumen: tanggalDokumen,
      });

      const resData = response?.success ? response.data : response;
      const { successCount = 0, failCount = 0 } = resData || {};

      if (successCount > 0 && failCount === 0) {
        toastService.success(`✅ Berhasil membuat semua dokumen untuk ${successCount} laporan penerimaan barang (Invoice Penagihan + Kwitansi + Faktur Pajak)`);
      } else if (successCount > 0 && failCount > 0) {
        toastService.warning(`✅ Berhasil membuat semua dokumen untuk ${successCount} laporan penerimaan barang. ${failCount} gagal.`);
      } else {
        toastService.error('❌ Gagal membuat dokumen invoice');
      }

      // Clear selection and refresh data
      setSelectedReportIds([]);
      await queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
      closeGenerateDialog();
    } catch (error) {
      console.error('Error in bulk generate:', error);
      toastService.error(error.message || 'Gagal membuat dokumen invoice');
    } finally {
      setIsGenerating(false);
    }
  }, [generateConfirmation.lpbIds, closeGenerateDialog, queryClient]);

  const openCreateModal = useCallback(() => {
    setSelectedReport(null);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setSelectedReport(null);
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
      setSelectedReportForDetail(detail || null);
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

  return (
    <div>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-3 py-3 space-y-2'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900'>Laporan Penerimaan Barang</h3>
            <div className='flex flex-wrap gap-2'>
              <button
                onClick={() => handlePreviewLpb()}
                disabled={isPreviewLpbLoading}
                className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm'
                title='Preview File LPB (PDF/Gambar yang diupload)'
              >
                {isPreviewLpbLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5'></div>
                    Memuat LPB...
                  </>
                ) : (
                  <>
                    <HeroIcon name='document-text' className='w-4 h-4 mr-1.5' />
                    Preview LPB
                  </>
                )}
              </button>
              <button
                onClick={handlePreviewExportClick}
                disabled={previewLoading}
                className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm'
              >
                <HeroIcon name='eye' className='w-4 h-4 mr-1.5' />
                {previewLoading ? 'Memuat...' : 'Preview Excel'}
              </button>
              <button
                onClick={handleExportClick}
                disabled={isExporting}
                className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm'
              >
                <HeroIcon name='document-arrow-down' className='w-4 h-4 mr-1.5' />
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </button>
              <button onClick={openCreateModal} className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm'>
                <HeroIcon name='plus' className='w-4 h-4 mr-1.5' />Tambah
              </button>
            </div>
          </div>

          <LaporanPenerimaanBarangTableServerSide
            onView={handleViewDetail}
            onEdit={openEditModal}
            selectedReports={selectedReportIds}
            onSelectReport={handleSelectReport}
            onCompleteSelected={handleCompleteSelected}
            onDeleteSelected={handleDeleteSelected}
            isCompleting={isCompletingReports}
            isDeleting={isDeleting}
            hasSelectedReports={hasSelectedReports}
            selectedReportId={selectedReportForDetail?.id}
            onFiltersChange={handleFiltersChange}
            onOpenGenerateDialog={openGenerateDialog}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      <LaporanPenerimaanBarangModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
        onBulkUpload={uploadBulkReports}
        onBulkUploadTextExtraction={uploadBulkReportsTextExtraction}
        onFinished={refreshData}
      />

      <LaporanPenerimaanBarangModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedReport}
        isEdit
      />

      <CompleteConfirmationDialog onConfirm={handleConfirmComplete} />

      <ExportConfirmationDialog onConfirm={handleConfirmExport} />

      <DeleteConfirmationDialog onConfirm={handleConfirmDelete} />

      <GenerateInvoicePenagihanDialog
        show={generateConfirmation.show}
        onClose={closeGenerateDialog}
        onConfirm={handleGenerateConfirm}
        invoiceCount={generateConfirmation.lpbIds.length}
        loading={isGenerating}
      />

      {selectedReportForDetail && (
        <LaporanPenerimaanBarangDetailCard report={selectedReportForDetail} onClose={handleCloseDetail} loading={detailLoading} />
      )}

      <LaporanPenerimaanBarangExportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        previewData={previewData}
        previewLoading={previewLoading}
        onExport={handleConfirmExport}
        isExporting={isExporting}
      />

      <LpbFilePreviewModal
        isOpen={lpbPreviewModalOpen}
        onClose={handleCloseLpbPreview}
        files={lpbPreviewFiles}
      />
    </div>
  );
};

export default LaporanPenerimaanBarang;
