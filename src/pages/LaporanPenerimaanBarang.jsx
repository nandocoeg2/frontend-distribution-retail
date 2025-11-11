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
import { TabContainer, Tab } from '@/components/ui/Tabs';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: {
    label: 'Pending',
    statusCode: 'PENDING LAPORAN PENERIMAAN BARANG',
  },
  processing: {
    label: 'Processing',
    statusCode: 'PROCESSING LAPORAN PENERIMAAN BARANG',
  },
  completed: {
    label: 'Completed',
    statusCode: 'COMPLETED LAPORAN PENERIMAAN BARANG',
  },
  failed: {
    label: 'Failed',
    statusCode: 'FAILED LAPORAN PENERIMAAN BARANG',
  },
};

const TAB_ORDER = ['all', 'pending', 'processing', 'completed', 'failed'];

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
    fetchBulkStatus,
    fetchBulkFiles,
    updateReport,
    deleteReport,
    deleteReportConfirmation,
    fetchReportById,
    processReports,
    completeReports,
  } = useLaporanPenerimaanBarangPage();

  const [selectedReport, setSelectedReport] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReportForDetail, setSelectedReportForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [isProcessingReports, setIsProcessingReports] = useState(false);
  const [isCompletingReports, setIsCompletingReports] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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
    // This will be handled by the table component
    // Just toggle the selection state
    setSelectedReportIds((prev) => (prev.length > 0 ? [] : []));
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSelectedReportIds([]);
  }, []);

  const refreshData = useCallback(() => {
    setSelectedReportIds([]);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
  }, [queryClient]);

  const hasSelectedReports = selectedReportIds.length > 0;

  const handleProcessSelected = useCallback(() => {
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
  }, [hasSelectedReports, selectedReportIds.length, showProcessDialog]);

  const handleConfirmProcess = useCallback(async () => {
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

      await queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
      hideProcessDialog();
    } catch (error) {
      console.error('Failed to process laporan penerimaan barang:', error);
    } finally {
      setProcessDialogLoading(false);
      setIsProcessingReports(false);
    }
  }, [processReports, selectedReportIds, resolveReportId, hideProcessDialog, setProcessDialogLoading, queryClient]);

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
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Laporan Penerimaan Barang
              </h3>
              <p className='text-sm text-gray-500'>
                Kelola dan pantau laporan penerimaan barang dari supplier.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={openBulkModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-md shadow-sm hover:bg-indigo-600'
              >
                <HeroIcon name='arrow-up-tray' className='w-5 h-5 mr-2' />
                Upload Bulk
              </button>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah Laporan
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

          <div className='space-y-4'>
            <LaporanPenerimaanBarangTableServerSide
              onView={handleViewDetail}
              onEdit={openEditModal}
              onDelete={deleteReport}
              deleteLoading={deleteReportConfirmation.loading}
              selectedReports={selectedReportIds}
              onSelectReport={handleSelectReport}
              onSelectAllReports={handleSelectAllReports}
              onProcessSelected={handleProcessSelected}
              onCompleteSelected={handleCompleteSelected}
              isProcessing={isProcessingReports}
              isCompleting={isCompletingReports}
              hasSelectedReports={hasSelectedReports}
              initialPage={1}
              initialLimit={10}
              activeTab={activeTab}
              selectedReportId={selectedReportForDetail?.id}
            />
          </div>
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
        onFetchStatus={fetchBulkStatus}
        onFetchBulkFiles={fetchBulkFiles}
      />

      <ProcessConfirmationDialog onConfirm={handleConfirmProcess} />
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

      {/* Laporan Penerimaan Barang Detail Card */}
      {selectedReportForDetail && (
        <LaporanPenerimaanBarangDetailCard
          report={selectedReportForDetail}
          onClose={handleCloseDetail}
          loading={detailLoading}
        />
      )}
    </div>
  );
};

export default LaporanPenerimaanBarang;
