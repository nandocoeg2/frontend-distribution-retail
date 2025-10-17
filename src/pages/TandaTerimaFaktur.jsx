import React, { useCallback, useMemo, useState } from 'react';
import useTandaTerimaFakturPage from '@/hooks/useTandaTerimaFakturPage';
import {
  TandaTerimaFakturSearch,
  TandaTerimaFakturTable,
  TandaTerimaFakturModal,
  TandaTerimaFakturDetailModal,
} from '@/components/tandaTerimaFaktur';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import tandaTerimaFakturService from '@/services/tandaTerimaFakturService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: {
    label: 'Pending',
    statusCode: 'PENDING TANDA TERIMA FAKTUR',
  },
  processing: {
    label: 'Processing',
    statusCode: 'PROCESSING TANDA TERIMA FAKTUR',
  },
  delivered: {
    label: 'Delivered',
    statusCode: 'DELIVERED TANDA TERIMA FAKTUR',
  },
  received: {
    label: 'Received',
    statusCode: 'RECEIVED TANDA TERIMA FAKTUR',
  },
  cancelled: {
    label: 'Cancelled',
    statusCode: 'CANCELLED TANDA TERIMA FAKTUR',
  },
  completed: {
    label: 'Completed',
    statusCode: 'COMPLETED TANDA TERIMA FAKTUR',
  },
};

const TAB_ORDER = [
  'all',
  'pending',
  'processing',
  'delivered',
  'received',
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

const parseTandaTerimaFakturByStatusResponse = (response = {}) => {
  const responseData = response?.data || response;
  const rawData =
    responseData?.tandaTerimaFakturs ??
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
    : Array.isArray(rawData?.tandaTerimaFakturs)
      ? rawData.tandaTerimaFakturs
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

const TandaTerimaFakturPage = () => {
  const {
    tandaTerimaFakturs,
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
    createTandaTerimaFaktur,
    updateTandaTerimaFaktur,
    deleteTandaTerimaFaktur: triggerDeleteTandaTerimaFaktur,
    deleteTandaTerimaFakturConfirmation,
    fetchTandaTerimaFaktur,
    fetchTandaTerimaFakturById,
    handleAuthError,
  } = useTandaTerimaFakturPage();

  const [selectedTtf, setSelectedTtf] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [tabLoading, setTabLoading] = useState(false);
  const [tabTandaTerimaFakturs, setTabTandaTerimaFakturs] = useState([]);
  const [tabPagination, setTabPagination] = useState(INITIAL_TAB_PAGINATION);

  const isSearchActive = useMemo(() => {
    if (hasActiveFilters) {
      return true;
    }
    if (searchQuery == null) {
      return false;
    }
    if (typeof searchQuery === 'string') {
      return searchQuery.trim() !== '';
    }
    return Boolean(searchQuery);
  }, [hasActiveFilters, searchQuery]);

  const statusIdMap = useMemo(() => {
    const map = {};
    if (Array.isArray(tandaTerimaFakturs)) {
      tandaTerimaFakturs.forEach((item) => {
        const code = item?.status?.status_code;
        const statusId = item?.statusId || item?.status?.id;
        if (code && statusId && map[code] == null) {
          map[code] = statusId;
        }
      });
    }
    return map;
  }, [tandaTerimaFakturs]);

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
        await fetchTandaTerimaFaktur({ page, limit: effectiveLimit });
        return;
      }

      const statusCode = getStatusCodeForTab(tab);
      if (!statusCode) {
        setTabTandaTerimaFakturs([]);
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
        const searchParams = statusIdMap[statusCode]
          ? { statusId: statusIdMap[statusCode] }
          : { status_code: statusCode };
        const response = await tandaTerimaFakturService.search(
          searchParams,
          page,
          effectiveLimit
        );
        const { results, pagination: parsedPagination } =
          parseTandaTerimaFakturByStatusResponse(response);
        setTabTandaTerimaFakturs(results);
        setTabPagination(parsedPagination);
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
        }
        console.error('Failed to fetch tanda terima faktur by status:', err);
        setTabTandaTerimaFakturs([]);
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
      fetchTandaTerimaFaktur,
      getStatusCodeForTab,
      handleAuthError,
      statusIdMap,
      tabPagination.itemsPerPage,
      tabPagination.limit,
    ]
  );

  const tableTandaTerimaFakturs = useMemo(() => {
    if (isSearchActive || activeTab === 'all') {
      return tandaTerimaFakturs;
    }
    return tabTandaTerimaFakturs;
  }, [activeTab, isSearchActive, tabTandaTerimaFakturs, tandaTerimaFakturs]);

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

  const handleTabChange = useCallback(
    (newTab) => {
      setActiveTab(newTab);

      if (newTab === 'all') {
        const currentPage = pagination?.currentPage || pagination?.page || 1;
        const currentLimit =
          pagination?.itemsPerPage ||
          pagination?.limit ||
          INITIAL_TAB_PAGINATION.itemsPerPage;
        fetchTandaTerimaFaktur({ page: currentPage, limit: currentLimit });
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
      fetchTandaTerimaFaktur,
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
      await fetchTandaTerimaFaktur({ page: currentPage, limit: currentLimit });
      return;
    }

    const currentPage = tabPagination.currentPage || tabPagination.page || 1;
    const currentLimit =
      tabPagination.itemsPerPage ||
      tabPagination.limit ||
      INITIAL_TAB_PAGINATION.itemsPerPage;
    await fetchDataByTab(activeTab, currentPage, currentLimit);
  }, [
    activeTab,
    fetchDataByTab,
    fetchTandaTerimaFaktur,
    isSearchActive,
    pagination,
    tabPagination,
  ]);

  const resolvedPagination =
    tablePagination || tabPagination || INITIAL_TAB_PAGINATION;
  const activeTabBadge =
    resolvedPagination?.totalItems ?? resolvedPagination?.total ?? 0;

  const openCreateModal = () => {
    setSelectedTtf(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (ttf) => {
    setSelectedTtf(ttf);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTtf(null);
  };

  const openDetailModal = useCallback(
    async (ttf) => {
      if (!ttf?.id) {
        return;
      }
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      try {
        const detail = await fetchTandaTerimaFakturById(ttf.id);
        setSelectedTtf(detail || ttf);
      } catch (err) {
        setSelectedTtf(ttf);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchTandaTerimaFakturById]
  );

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTtf(null);
    setDetailLoading(false);
  };

  const handleCreateSubmit = async (payload) => {
    const result = await createTandaTerimaFaktur(payload);
    if (result) {
      setIsCreateModalOpen(false);
      await refreshActiveTab();
    }
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedTtf?.id) {
      return;
    }
    const result = await updateTandaTerimaFaktur(selectedTtf.id, payload);
    if (result) {
      setIsEditModalOpen(false);
      setSelectedTtf(null);
      await refreshActiveTab();
    }
  };

  const handleDelete = (id) => {
    if (!id) {
      return;
    }
    triggerDeleteTandaTerimaFaktur(id);
  };

  const handleRetry = async () => {
    await refreshActiveTab();
  };

  const handleDeleteConfirm = useCallback(async () => {
    await deleteTandaTerimaFakturConfirmation.confirmDelete();
    await refreshActiveTab();
  }, [deleteTandaTerimaFakturConfirmation, refreshActiveTab]);

  const tableHasActiveFilters = isSearchActive;

  const statusTabs = useMemo(
    () =>
      TAB_ORDER.map((tabId) => ({
        id: tabId,
        label: TAB_STATUS_CONFIG[tabId]?.label || tabId,
      })),
    []
  );

  const deleteConfirmationProps = deleteTandaTerimaFakturConfirmation;
  const isTableLoading = Boolean(tableLoading) && !error;

  const currentSearchQuery =
    typeof searchQuery === 'string'
      ? searchQuery
      : isSearchActive
        ? 'filter aktif'
        : undefined;

  const effectivePagination = resolvedPagination || INITIAL_TAB_PAGINATION;
  const tabHeaderBadge = activeTabBadge;
  const tableData = Array.isArray(tableTandaTerimaFakturs)
    ? tableTandaTerimaFakturs
    : [];

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div className='space-y-1'>
              <h3 className='text-lg font-medium text-gray-900'>
                Tanda Terima Faktur
              </h3>
              <p className='text-sm text-gray-500'>
                Catat dan kelola serah terima dokumen faktur antara supplier
                dan customer.
              </p>
            </div>
            <div className='flex items-center justify-end gap-3'>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah TTF
              </button>
            </div>
          </div>

          <TandaTerimaFakturSearch
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
              {statusTabs.map((tab) => (
                <Tab
                  key={tab.id}
                  id={tab.id}
                  label={tab.label}
                  badge={activeTab === tab.id ? tabHeaderBadge : null}
                />
              ))}
            </TabContainer>
          </div>

          {error ? (
            <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
              <p className='mb-3 text-sm text-red-800'>
                Terjadi kesalahan: {error}
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
              {isTableLoading && (
                <div className='flex items-center mb-4 text-sm text-gray-500'>
                  <div className='w-4 h-4 mr-2 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                  Memuat data tanda terima faktur...
                </div>
              )}
              <TandaTerimaFakturTable
                tandaTerimaFakturs={tableData}
                pagination={effectivePagination}
                onPageChange={handleTablePageChange}
                onLimitChange={handleTableLimitChange}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onView={openDetailModal}
                loading={Boolean(tableLoading)}
                searchQuery={currentSearchQuery}
                hasActiveFilters={tableHasActiveFilters}
              />
            </>
          )}
        </div>
      </div>

      <TandaTerimaFakturModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <TandaTerimaFakturModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedTtf}
        isEdit
      />

      <TandaTerimaFakturDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        tandaTerimaFaktur={selectedTtf}
        isLoading={detailLoading}
      />

      <ConfirmationDialog
        show={deleteConfirmationProps.showConfirm}
        onClose={deleteConfirmationProps.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteConfirmationProps.title}
        message={deleteConfirmationProps.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteConfirmationProps.loading}
      />
    </div>
  );
};

export default TandaTerimaFakturPage;
