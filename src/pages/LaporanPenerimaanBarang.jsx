import React, { useState, useMemo, useCallback } from 'react';
import useLaporanPenerimaanBarangPage from '@/hooks/useLaporanPenerimaanBarangPage';
import {
  LaporanPenerimaanBarangSearch,
  LaporanPenerimaanBarangTable,
  LaporanPenerimaanBarangModal,
  LaporanPenerimaanBarangDetailModal,
  LaporanPenerimaanBarangBulkModal,
} from '@/components/laporanPenerimaanBarang';
import { ConfirmationDialog, useConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import laporanPenerimaanBarangService from '@/services/laporanPenerimaanBarangService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const TAB_STATUS_CONFIG = {
  all: { label: 'ALL', statusCode: null },
  pending: {
    label: 'PENDING LAPORAN PENERIMAAN BARANG',
    statusCode: 'PENDING LAPORAN PENERIMAAN BARANG',
  },
  processing: {
    label: 'PROCESSING LAPORAN PENERIMAAN BARANG',
    statusCode: 'PROCESSING LAPORAN PENERIMAAN BARANG',
  },
  completed: {
    label: 'COMPLETED LAPORAN PENERIMAAN BARANG',
    statusCode: 'COMPLETED LAPORAN PENERIMAAN BARANG',
  },
  failed: {
    label: 'FAILED LAPORAN PENERIMAAN BARANG',
    statusCode: 'FAILED LAPORAN PENERIMAAN BARANG',
  },
};

const TAB_ORDER = ['all', 'pending', 'processing', 'completed', 'failed'];

const INITIAL_TAB_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const parseReportsByStatusResponse = (response = {}) => {
  const rawData = response?.data?.data ?? response?.data ?? [];
  const paginationData = response?.data?.pagination ?? {};
  const currentPage = paginationData.currentPage ?? paginationData.page ?? 1;
  const itemsPerPage =
    paginationData.itemsPerPage ??
    paginationData.limit ??
    INITIAL_TAB_PAGINATION.itemsPerPage;
  const totalItems =
    paginationData.totalItems ??
    paginationData.total ??
    (Array.isArray(rawData) ? rawData.length : 0);

  const results = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

  return {
    results,
    pagination: {
      currentPage,
      page: currentPage,
      totalPages:
        paginationData.totalPages ??
        Math.max(Math.ceil((totalItems || 1) / (itemsPerPage || 1)), 1),
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage,
    },
  };
};

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
    handleAuthError,
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
  const [activeTab, setActiveTab] = useState('all');
  const [tabLoading, setTabLoading] = useState(false);
  const [tabReports, setTabReports] = useState([]);
  const [tabPagination, setTabPagination] = useState(INITIAL_TAB_PAGINATION);
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

  const isSearchActive = useMemo(() => {
    if (searchQuery == null) {
      return false;
    }

    if (typeof searchQuery === 'string') {
      return searchQuery.trim() !== '';
    }

    return Boolean(searchQuery);
  }, [searchQuery]);

  const tableReports = useMemo(() => {
    if (isSearchActive || activeTab === 'all') {
      return reports;
    }
    return tabReports;
  }, [activeTab, isSearchActive, reports, tabReports]);

  const tablePagination = useMemo(() => {
    if (isSearchActive || activeTab === 'all') {
      return pagination;
    }
    return tabPagination;
  }, [activeTab, isSearchActive, pagination, tabPagination]);

  const tableLoading = useMemo(() => {
    if (isSearchActive || activeTab === 'all') {
      return loading;
    }
    return tabLoading;
  }, [activeTab, isSearchActive, loading, tabLoading]);
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
    const dataSource = Array.isArray(tableReports) ? tableReports : [];

    if (checked) {
      const ids = dataSource
        .map((reportItem) => resolveReportId(reportItem))
        .filter(Boolean);
      setSelectedReportIds(Array.from(new Set(ids)));
    } else {
      setSelectedReportIds([]);
    }
  };

  React.useEffect(() => {
    setSelectedReportIds((prev) => {
      const dataSource = Array.isArray(tableReports) ? tableReports : [];

      if (!dataSource.length) {
        return prev.length ? [] : prev;
      }

      const availableIds = new Set(
        dataSource
          .map((item) => resolveReportId(item))
          .filter(Boolean)
      );

      const filtered = prev.filter((id) => availableIds.has(id));

      return filtered.length === prev.length ? prev : filtered;
    });
  }, [tableReports]);
  const getStatusCodeForTab = useCallback(
    (tabId) => TAB_STATUS_CONFIG[tabId]?.statusCode || null,
    []
  );

  const fetchDataByTab = useCallback(
    async (tab = activeTab, page = 1, limit) => {
      const effectiveLimit =
        typeof limit === 'number'
          ? limit
          : tabPagination.itemsPerPage ||
            tabPagination.limit ||
            INITIAL_TAB_PAGINATION.itemsPerPage;

      if (tab === 'all') {
        await fetchReports(page, effectiveLimit);
        return;
      }

      const statusCode = getStatusCodeForTab(tab);
      if (!statusCode) {
        setTabReports([]);
        setTabPagination((prev) => ({
          ...prev,
          currentPage: 1,
          page: 1,
          totalItems: 0,
          total: 0,
          totalPages: 1,
        }));
        return;
      }

      setTabLoading(true);
      try {
        const response = await laporanPenerimaanBarangService.searchReports(
          { status_code: statusCode },
          page,
          effectiveLimit
        );
        const { results, pagination: parsedPagination } =
          parseReportsByStatusResponse(response);
        setTabReports(results);
        setTabPagination(parsedPagination);
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
        }
        console.error('Failed to fetch laporan penerimaan barang by status:', err);
        setTabReports([]);
        setTabPagination((prev) => ({
          ...prev,
          currentPage: 1,
          page: 1,
          totalItems: 0,
          total: 0,
          totalPages: 1,
        }));
      } finally {
        setTabLoading(false);
      }
    },
    [
      activeTab,
      fetchReports,
      getStatusCodeForTab,
      handleAuthError,
      tabPagination.itemsPerPage,
      tabPagination.limit,
    ]
  );

  const handleTabChange = useCallback(
    (newTab) => {
      setActiveTab(newTab);
      setSelectedReportIds([]);

      if (newTab === 'all') {
        const currentPage = pagination?.currentPage || pagination?.page || 1;
        const currentLimit =
          pagination?.itemsPerPage ||
          pagination?.limit ||
          INITIAL_TAB_PAGINATION.itemsPerPage;
        fetchReports(currentPage, currentLimit);
      } else {
        setTabPagination((prev) => ({
          ...prev,
          currentPage: 1,
          page: 1,
        }));
        const currentLimit =
          tabPagination.itemsPerPage ||
          tabPagination.limit ||
          INITIAL_TAB_PAGINATION.itemsPerPage;
        fetchDataByTab(newTab, 1, currentLimit);
      }
    },
    [
      fetchDataByTab,
      fetchReports,
      pagination,
      tabPagination.itemsPerPage,
      tabPagination.limit,
    ]
  );

  const handleTabPageChange = useCallback(
    (page) => {
      fetchDataByTab(activeTab, page);
    },
    [activeTab, fetchDataByTab]
  );

  const handleTabLimitChange = useCallback(
    (limit) => {
      fetchDataByTab(activeTab, 1, limit);
    },
    [activeTab, fetchDataByTab]
  );

  const handleTablePageChange = useCallback(
    (page) => {
      if (isSearchActive || activeTab === 'all') {
        handlePageChange(page);
      } else {
        handleTabPageChange(page);
      }
    },
    [activeTab, handlePageChange, handleTabPageChange, isSearchActive]
  );

  const handleTableLimitChange = useCallback(
    (limit) => {
      if (isSearchActive || activeTab === 'all') {
        handleLimitChange(limit);
      } else {
        handleTabLimitChange(limit);
      }
    },
    [activeTab, handleLimitChange, handleTabLimitChange, isSearchActive]
  );

  const refreshActiveTab = useCallback(async () => {
    if (isSearchActive) {
      return;
    }

    if (activeTab === 'all') {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      const currentLimit =
        pagination?.itemsPerPage ||
        pagination?.limit ||
        INITIAL_TAB_PAGINATION.itemsPerPage;
      await fetchReports(currentPage, currentLimit);
    } else {
      const currentPage = tabPagination.currentPage || tabPagination.page || 1;
      const currentLimit =
        tabPagination.itemsPerPage ||
        tabPagination.limit ||
        INITIAL_TAB_PAGINATION.itemsPerPage;
      await fetchDataByTab(activeTab, currentPage, currentLimit);
    }
  }, [
    activeTab,
    fetchDataByTab,
    fetchReports,
    isSearchActive,
    pagination,
    tabPagination,
  ]);


  const handleDeleteConfirm = useCallback(async () => {
    await deleteReportConfirmation.confirmDelete();
    await refreshActiveTab();
  }, [deleteReportConfirmation, refreshActiveTab]);

  const selectionDisabled = tableLoading || isProcessingReports || isCompletingReports;
  const hasSelectedReports = selectedReportIds.length > 0;
  const resolvedPagination = tablePagination || INITIAL_TAB_PAGINATION;
  const activeTabBadge =
    resolvedPagination?.totalItems ?? resolvedPagination?.total ?? 0;

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

      await refreshActiveTab();
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

      await refreshActiveTab();
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

  const handleUploadFromFile = useCallback(async ({ file, prompt }) => {
    const result = await createReportFromFile({ file, prompt });
    await refreshActiveTab();
    return result;
  }, [createReportFromFile, refreshActiveTab]);

  const handleCreateSubmit = async (payload) => {
    await createReport(payload);
    await refreshActiveTab();
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedReport?.id) {
      return;
    }
    await updateReport(selectedReport.id, payload);
    await refreshActiveTab();
  };

  const handleRetry = () => {
    if (isSearchActive) {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      handlePageChange(currentPage);
      return;
    }

    refreshActiveTab();
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
                  badge={activeTab === tabId ? activeTabBadge : null}
                />
              ))}
            </TabContainer>
          </div>

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
              {tableLoading && (
                <div className='flex items-center mb-4 text-sm text-gray-500'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2'></div>
                  Memuat data laporan...
                </div>
              )}
              <LaporanPenerimaanBarangTable
                reports={tableReports}
                pagination={resolvedPagination}
                onPageChange={handleTablePageChange}
                onLimitChange={handleTableLimitChange}
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
        onUploadFromFile={handleUploadFromFile}
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
        onConfirm={handleDeleteConfirm}
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
