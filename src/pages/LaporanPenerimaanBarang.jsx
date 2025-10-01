import React, { useState } from 'react';
import useLaporanPenerimaanBarangPage from '@/hooks/useLaporanPenerimaanBarangPage';
import {
  LaporanPenerimaanBarangSearch,
  LaporanPenerimaanBarangTable,
  LaporanPenerimaanBarangModal,
  LaporanPenerimaanBarangDetailModal,
  LaporanPenerimaanBarangBulkModal,
} from '@/components/laporanPenerimaanBarang';
import { ConfirmationDialog, useConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const LaporanPenerimaanBarang = () => {
  const {
    reports,
    pagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange,
    createReport,
    createReportFromFile,
    uploadBulkReports,
    fetchBulkStatus,
    fetchBulkFiles,
    updateReport,
    deleteReport,
    deleteReportConfirmation,
    fetchReports,
    fetchReportById,
    processReports,
    completeReports,
  } = useLaporanPenerimaanBarangPage();

  const [selectedReport, setSelectedReport] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [isProcessingReports, setIsProcessingReports] = useState(false);
  const [isCompletingReports, setIsCompletingReports] = useState(false);
  const {
    showDialog: showProcessDialog,
    hideDialog: hideProcessDialog,
    setLoading: setProcessDialogLoading,
    ConfirmationDialog: ProcessConfirmationDialog,
  } = useConfirmationDialog();
  const {
    showDialog: showCompleteDialog,
    hideDialog: hideCompleteDialog,
    setLoading: setCompleteDialogLoading,
    ConfirmationDialog: CompleteConfirmationDialog,
  } = useConfirmationDialog();

  const resolveReportId = (report) => {
    if (!report) {
      return null;
    }

    return report?.id || report?.lpbId || report?._id || report?.uuid || null;
  };

  const handleSelectReport = (reportId, checked) => {
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
  };

  const handleSelectAllReports = (checked) => {
    if (!Array.isArray(reports)) {
      setSelectedReportIds([]);
      return;
    }

    if (checked) {
      const ids = reports
        .map((reportItem) => resolveReportId(reportItem))
        .filter(Boolean);
      setSelectedReportIds(Array.from(new Set(ids)));
    } else {
      setSelectedReportIds([]);
    }
  };

  React.useEffect(() => {
    setSelectedReportIds((prev) => {
      if (!Array.isArray(reports)) {
        return prev.length ? [] : prev;
      }

      const availableIds = new Set(
        reports
          .map((item) => resolveReportId(item))
          .filter(Boolean)
      );

      const filtered = prev.filter((id) => availableIds.has(id));

      return filtered.length === prev.length ? prev : filtered;
    });
  }, [reports]);

  const selectionDisabled = loading || isProcessingReports || isCompletingReports;
  const hasSelectedReports = selectedReportIds.length > 0;

  const handleProcessSelected = () => {
    if (!hasSelectedReports) {
      return;
    }

    showProcessDialog({
      title: 'Proses Laporan Penerimaan Barang',
      message: `Apakah Anda yakin ingin memproses ${selectedReportIds.length} laporan penerimaan barang yang dipilih?`,
      confirmText: 'Proses',
      cancelText: 'Batal',
      type: 'warning',
    });
  };

  const handleConfirmProcess = async () => {
    setProcessDialogLoading(true);
    setIsProcessingReports(true);

    try {
      const result = await processReports(selectedReportIds);

      if (result && Array.isArray(result.failed)) {
        const failedIds = result.failed
          .map((item) => resolveReportId(item))
          .filter(Boolean);

        setSelectedReportIds(Array.from(new Set(failedIds)));
      } else if (result) {
        setSelectedReportIds([]);
      }

      hideProcessDialog();
    } catch (error) {
      console.error('Failed to process laporan penerimaan barang:', error);
    } finally {
      setProcessDialogLoading(false);
      setIsProcessingReports(false);
    }
  };

  const handleCompleteSelected = () => {
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
  };

  const handleConfirmComplete = async () => {
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

      hideCompleteDialog();
    } catch (error) {
      console.error('Failed to complete laporan penerimaan barang:', error);
    } finally {
      setCompleteDialogLoading(false);
      setIsCompletingReports(false);
    }
  };



  const openCreateModal = () => {
    setSelectedReport(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedReport(null);
  };

  const openBulkModal = () => {
    setIsBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    setIsBulkModalOpen(false);
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedReport(null);
  };

  const openDetailModal = async (report) => {
    if (!report?.id) {
      return;
    }

    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setSelectedReport(null);

    try {
      const detail = await fetchReportById(report.id);
      setSelectedReport(detail?.data || detail || null);
    } catch (error) {
      console.error('Failed to fetch laporan penerimaan barang detail:', error);
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReport(null);
    setDetailLoading(false);
  };

  const handleCreateSubmit = async (payload) => {
    await createReport(payload);
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedReport?.id) {
      return;
    }
    await updateReport(selectedReport.id, payload);
  };

  const handleRetry = () => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    const limit = pagination?.itemsPerPage || pagination?.limit || 10;
    fetchReports(currentPage, limit);
  };

  return (
    <div className='p-6'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-medium text-gray-900'>Laporan Penerimaan Barang</h3>
            <div className='flex items-center gap-2'>
              <button
                onClick={openBulkModal}
                className='inline-flex items-center rounded-md bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600'
              >
                <HeroIcon name='arrow-up-tray' className='mr-2 h-5 w-5' />
                Upload Bulk
              </button>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='mr-2 h-5 w-5' />
                Tambah Laporan
              </button>
            </div>
          </div>

          <LaporanPenerimaanBarangSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChange}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
          />

          {error ? (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <p className='text-red-800 text-sm mb-3'>Terjadi kesalahan: {error}</p>
              <button
                onClick={handleRetry}
                className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {loading && (
                <div className='flex items-center mb-4 text-sm text-gray-500'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2'></div>
                  Memuat data laporan...
                </div>
              )}
              <LaporanPenerimaanBarangTable
                reports={reports}
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onEdit={openEditModal}
                onDelete={deleteReport}
                onView={openDetailModal}
                searchQuery={searchQuery}
                selectedReports={selectedReportIds}
                onSelectReport={handleSelectReport}
                onSelectAllReports={handleSelectAllReports}
                onProcessSelected={handleProcessSelected}
                onCompleteSelected={handleCompleteSelected}
                isProcessing={isProcessingReports}
                isCompleting={isCompletingReports}
                disableSelection={selectionDisabled}
              />
            </>
          )}
        </div>
      </div>

      <LaporanPenerimaanBarangModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
        onUploadFromFile={createReportFromFile}
      />

      <LaporanPenerimaanBarangModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedReport}
        isEdit
      />

      <LaporanPenerimaanBarangDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        report={selectedReport}
        isLoading={detailLoading}
      />

      <LaporanPenerimaanBarangBulkModal
        isOpen={isBulkModalOpen}
        onClose={closeBulkModal}
        onBulkUpload={uploadBulkReports}
        onFetchStatus={fetchBulkStatus}
        onFetchBulkFiles={fetchBulkFiles}
      />

      <ProcessConfirmationDialog onConfirm={handleConfirmProcess} />
      <CompleteConfirmationDialog onConfirm={handleConfirmComplete} />

      <ConfirmationDialog
        show={deleteReportConfirmation.showConfirm}
        onClose={deleteReportConfirmation.hideDeleteConfirmation}
        onConfirm={deleteReportConfirmation.confirmDelete}
        title={deleteReportConfirmation.title}
        message={deleteReportConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteReportConfirmation.loading}
      />
    </div>
  );
};

export default LaporanPenerimaanBarang;
