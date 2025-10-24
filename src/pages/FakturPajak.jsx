import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useFakturPajakPage from '@/hooks/useFakturPajakPage';
import {
  FakturPajakSearch,
  FakturPajakTable,
  FakturPajakModal,
  FakturPajakDetailModal,
  FakturPajakExportModal,
} from '@/components/fakturPajak';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import fakturPajakService from '@/services/fakturPajakService';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: {
    label: 'Pending',
    statusCode: 'PENDING FAKTUR PAJAK',
  },
  processing: {
    label: 'Processing',
    statusCode: 'PROCESSING FAKTUR PAJAK',
  },
  issued: {
    label: 'Issued',
    statusCode: 'ISSUED FAKTUR PAJAK',
  },
  cancelled: {
    label: 'Cancelled',
    statusCode: 'CANCELLED FAKTUR PAJAK',
  },
  completed: {
    label: 'Completed',
    statusCode: 'COMPLETED FAKTUR PAJAK',
  },
};

const TAB_ORDER = [
  'all',
  'pending',
  'processing',
  'issued',
  'cancelled',
  'completed',
];

const INITIAL_TAB_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const parseFakturPajakListResponse = (response = {}) => {
  if (response?.success === false) {
    throw new Error(
      response?.error?.message || 'Failed to fetch faktur pajak data'
    );
  }

  const responseData = response?.data || response;
  const rawData =
    responseData?.fakturPajaks ??
    responseData?.data ??
    responseData?.results ??
    responseData ??
    [];

  const paginationSource =
    responseData?.pagination ??
    responseData?.meta ??
    responseData?.data?.pagination ??
    response?.pagination ??
    {};

  const currentPage =
    paginationSource.currentPage ??
    paginationSource.page ??
    INITIAL_TAB_PAGINATION.currentPage;

  const itemsPerPage =
    paginationSource.itemsPerPage ??
    paginationSource.limit ??
    INITIAL_TAB_PAGINATION.itemsPerPage;

  const totalItems =
    paginationSource.totalItems ??
    paginationSource.total ??
    (Array.isArray(rawData) ? rawData.length : 0);

  const totalPages =
    paginationSource.totalPages ??
    Math.max(Math.ceil((totalItems || 1) / (itemsPerPage || 1)), 1);

  const results = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.fakturPajaks)
      ? rawData.fakturPajaks
      : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

  return {
    results,
    pagination: {
      currentPage,
      page: currentPage,
      totalPages,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage,
    },
  };
};

const mapPaginationShape = (
  source = {},
  fallbackLimit = INITIAL_TAB_PAGINATION.itemsPerPage
) => {
  const currentPage =
    source?.currentPage ?? source?.page ?? INITIAL_TAB_PAGINATION.currentPage;
  const itemsPerPage =
    source?.itemsPerPage ??
    source?.limit ??
    fallbackLimit ??
    INITIAL_TAB_PAGINATION.itemsPerPage;
  const totalItems =
    source?.totalItems ?? source?.total ?? INITIAL_TAB_PAGINATION.totalItems;
  const totalPages =
    source?.totalPages ??
    Math.max(Math.ceil((totalItems || 1) / (itemsPerPage || 1)), 1);

  return {
    currentPage,
    page: currentPage,
    totalPages,
    totalItems,
    total: totalItems,
    itemsPerPage,
    limit: itemsPerPage,
  };
};

const FakturPajakPage = () => {
  const {
    fakturPajaks,
    pagination,
    loading,
    error,
    filters,
    searchLoading,
    hasActiveFilters,
    searchQuery,
    handleFiltersChange,
    handleSearchSubmit,
    handleResetFilters,
    handlePageChange,
    handleLimitChange,
    createFakturPajak,
    updateFakturPajak,
    deleteFakturPajak: triggerDeleteFakturPajak,
    deleteFakturPajakConfirmation,
    fetchFakturPajak,
    fetchFakturPajakById,
  } = useFakturPajakPage();

  const statusIdMapRef = useRef({});
  const [activeTab, setActiveTab] = useState('all');
  const [tabFakturPajaks, setTabFakturPajaks] = useState([]);
  const [tabPagination, setTabPagination] = useState(INITIAL_TAB_PAGINATION);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState(null);

  const isSearchActive = useMemo(() => {
    if (!hasActiveFilters) {
      return false;
    }

    if (typeof searchQuery === 'string') {
      return searchQuery.trim() !== '';
    }

    return Boolean(searchQuery);
  }, [hasActiveFilters, searchQuery]);

  const [selectedFakturPajak, setSelectedFakturPajak] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!Array.isArray(fakturPajaks)) {
      return;
    }
    const map = statusIdMapRef.current;
    fakturPajaks.forEach((item) => {
      const code = item?.status?.status_code;
      const id = item?.statusId || item?.status?.id;
      if (code && id && !map[code]) {
        map[code] = id;
      }
    });
  }, [fakturPajaks]);

  const tableFakturPajaks = useMemo(() => {
    if (isSearchActive || activeTab === 'all') {
      return fakturPajaks;
    }
    return tabFakturPajaks;
  }, [activeTab, fakturPajaks, isSearchActive, tabFakturPajaks]);

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

  const tableError = isSearchActive || activeTab === 'all' ? error : tabError;

  const resolvedPagination = tablePagination || INITIAL_TAB_PAGINATION;
  const activeTabBadge =
    resolvedPagination?.totalItems ?? resolvedPagination?.total ?? 0;

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const fetchTabData = useCallback(
    async (tabId, { page = 1, limit } = {}) => {
      const tabConfig = TAB_STATUS_CONFIG[tabId];
      if (!tabConfig || !tabConfig.statusCode) {
        setTabFakturPajaks(fakturPajaks);
        setTabPagination(
          mapPaginationShape(
            pagination,
            pagination?.itemsPerPage ??
              pagination?.limit ??
              INITIAL_TAB_PAGINATION.itemsPerPage
          )
        );
        setTabError(null);
        return;
      }

      const nextLimit =
        limit ??
        tabPagination?.itemsPerPage ??
        pagination?.itemsPerPage ??
        INITIAL_TAB_PAGINATION.itemsPerPage;

      setTabLoading(true);
      setTabError(null);

      try {
        const statusCode = tabConfig.statusCode;
        const statusId = statusIdMapRef.current[statusCode];
        const searchParams = statusId
          ? { statusId }
          : { status_code: statusCode };

        const response = await fakturPajakService.searchFakturPajak(
          searchParams,
          page,
          nextLimit
        );
        const { results, pagination: nextPagination } =
          parseFakturPajakListResponse(response);

        setTabFakturPajaks(results);
        setTabPagination(mapPaginationShape(nextPagination, nextLimit));

        if (Array.isArray(results)) {
          const map = statusIdMapRef.current;
          results.forEach((item) => {
            const code = item?.status?.status_code;
            const id = item?.statusId || item?.status?.id;
            if (code && id && !map[code]) {
              map[code] = id;
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch faktur pajak by status:', err);
        setTabFakturPajaks([]);
        setTabPagination({
          ...INITIAL_TAB_PAGINATION,
          itemsPerPage: nextLimit,
          limit: nextLimit,
        });
        setTabError(
          err?.message || 'Gagal memuat faktur pajak berdasarkan status.'
        );
      } finally {
        setTabLoading(false);
      }
    },
    [fakturPajaks, pagination, tabPagination.itemsPerPage]
  );

  useEffect(() => {
    if (isSearchActive) {
      return;
    }

    if (activeTab === 'all') {
      setTabError(null);
      return;
    }

    fetchTabData(activeTab, { page: 1 });
  }, [activeTab, fetchTabData, isSearchActive]);

  const refreshActiveTab = useCallback(async () => {
    if (isSearchActive) {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      await fetchFakturPajak({ page: currentPage });
      return;
    }

    if (activeTab === 'all') {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      await fetchFakturPajak({ page: currentPage });
      return;
    }

    const currentPage = tabPagination?.currentPage || tabPagination?.page || 1;
    await fetchTabData(activeTab, { page: currentPage });
  }, [
    activeTab,
    fetchFakturPajak,
    fetchTabData,
    isSearchActive,
    pagination,
    tabPagination,
  ]);

  const handleTablePageChange = useCallback(
    (page) => {
      if (isSearchActive || activeTab === 'all') {
        handlePageChange(page);
        return;
      }

      fetchTabData(activeTab, { page });
    },
    [activeTab, fetchTabData, handlePageChange, isSearchActive]
  );

  const handleTableLimitChange = useCallback(
    (limit) => {
      if (isSearchActive || activeTab === 'all') {
        handleLimitChange(limit);
        return;
      }

      fetchTabData(activeTab, { page: 1, limit });
    },
    [activeTab, fetchTabData, handleLimitChange, isSearchActive]
  );

  const handleDeleteConfirm = useCallback(async () => {
    await deleteFakturPajakConfirmation.confirmDelete();
    await refreshActiveTab();
  }, [deleteFakturPajakConfirmation, refreshActiveTab]);

  const openCreateModal = () => {
    setSelectedFakturPajak(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (fakturPajak) => {
    setSelectedFakturPajak(fakturPajak);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedFakturPajak(null);
  };

  const openExportModal = () => {
    setIsExportModalOpen(true);
  };

  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  const openDetailModal = useCallback(
    async (fakturPajak) => {
      if (!fakturPajak?.id) {
        return;
      }
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      try {
        const detail = await fetchFakturPajakById(fakturPajak.id);
        setSelectedFakturPajak(detail || fakturPajak);
      } catch (err) {
        setSelectedFakturPajak(fakturPajak);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchFakturPajakById]
  );

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedFakturPajak(null);
    setDetailLoading(false);
  };

  const handleCreateSubmit = async (payload) => {
    const result = await createFakturPajak(payload);
    if (result) {
      if (isSearchActive || activeTab !== 'all') {
        await refreshActiveTab();
      }
      setIsCreateModalOpen(false);
    }
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedFakturPajak?.id) {
      return;
    }
    const result = await updateFakturPajak(selectedFakturPajak.id, payload);
    if (result) {
      if (isSearchActive || activeTab !== 'all') {
        await refreshActiveTab();
      }
      setIsEditModalOpen(false);
      setSelectedFakturPajak(null);
    }
  };

  const handleDelete = (id) => {
    if (!id) {
      return;
    }
    triggerDeleteFakturPajak(id);
  };

  const handleRetry = () => {
    refreshActiveTab();
  };

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Manajemen Faktur Pajak
              </h3>
              <p className='text-sm text-gray-500'>
                Kelola faktur pajak penjualan beserta relasi invoice dan laporan
                penerimaan barang.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={openExportModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700'
              >
                <HeroIcon name='archive-box' className='w-5 h-5 mr-2' />
                Export e-Faktur DJP
              </button>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah Faktur Pajak
              </button>
            </div>
          </div>

          <FakturPajakSearch
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearchSubmit}
            onReset={handleResetFilters}
            loading={searchLoading || loading}
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

          {tableError ? (
            <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
              <p className='mb-3 text-sm text-red-800'>
                Terjadi kesalahan: {tableError}
              </p>
              <button
                onClick={handleRetry}
                className='px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700'
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {tableLoading && (
                <div className='flex items-center mb-4 text-sm text-gray-500'>
                  <div className='w-4 h-4 mr-2 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                  Memuat data faktur pajak...
                </div>
              )}
              <FakturPajakTable
                fakturPajaks={tableFakturPajaks}
                pagination={tablePagination}
                onPageChange={handleTablePageChange}
                onLimitChange={handleTableLimitChange}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onView={openDetailModal}
                loading={tableLoading}
                searchQuery={searchQuery}
                hasActiveFilters={hasActiveFilters}
              />
            </>
          )}
        </div>
      </div>

      <FakturPajakModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <FakturPajakModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedFakturPajak}
        isEdit
      />

      <FakturPajakDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        fakturPajak={selectedFakturPajak}
        isLoading={detailLoading}
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
    </div>
  );
};

export default FakturPajakPage;
