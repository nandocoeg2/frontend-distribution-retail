import React, { useCallback, useMemo, useState } from 'react';
import useKwitansiPage from '@/hooks/useKwitansiPage';
import {
  KwitansiSearch,
  KwitansiTable,
  KwitansiModal,
  KwitansiDetailModal,
} from '@/components/kwitansi';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', filters: null },
  pending: {
    label: 'Pending',
    filters: { status_code: 'PENDING KWITANSI' },
  },
  processing: {
    label: 'Processing',
    filters: { status_code: 'PROCESSING KWITANSI' },
  },
  paid: {
    label: 'Paid',
    filters: { status_code: 'PAID KWITANSI' },
  },
  overdue: {
    label: 'Overdue',
    filters: { status_code: 'OVERDUE KWITANSI' },
  },
  completed: {
    label: 'Completed',
    filters: { status_code: 'COMPLETED KWITANSI' },
  },
  cancelled: {
    label: 'Cancelled',
    filters: { status_code: 'CANCELLED KWITANSI' },
  },
};

const TAB_ORDER = [
  'all',
  'pending',
  'processing',
  'paid',
  'overdue',
  'completed',
  'cancelled',
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

const KwitansiPage = () => {
  const {
    kwitansis,
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
    createKwitansi,
    updateKwitansi,
    deleteKwitansi: triggerDeleteKwitansi,
    deleteKwitansiConfirmation,
    fetchKwitansi,
    fetchKwitansiById,
    searchKwitansiWithFilters,
    handleAuthError,
  } = useKwitansiPage();

  const [selectedKwitansi, setSelectedKwitansi] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [tabLoading, setTabLoading] = useState(false);
  const [tabKwitansis, setTabKwitansis] = useState([]);
  const [tabPagination, setTabPagination] = useState(INITIAL_TAB_PAGINATION);

  const openCreateModal = () => {
    setSelectedKwitansi(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (kwitansi) => {
    setSelectedKwitansi(kwitansi);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedKwitansi(null);
  };

  const openDetailModal = useCallback(
    async (kwitansi) => {
      if (!kwitansi?.id) {
        return;
      }

      setIsDetailModalOpen(true);
      setDetailLoading(true);
      try {
        const detail = await fetchKwitansiById(kwitansi.id);
        setSelectedKwitansi(detail || kwitansi);
      } catch (error) {
        setSelectedKwitansi(kwitansi);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchKwitansiById]
  );

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedKwitansi(null);
    setDetailLoading(false);
  };

  const isSearchActive = hasActiveFilters;

  const tableKwitansis = useMemo(() => {
    if (isSearchActive || activeTab === 'all') {
      return kwitansis;
    }
    return tabKwitansis;
  }, [activeTab, isSearchActive, kwitansis, tabKwitansis]);

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

  const resolvedPagination = tablePagination || INITIAL_TAB_PAGINATION;
  const activeTabBadge =
    resolvedPagination?.totalItems ?? resolvedPagination?.total ?? 0;

  const fetchDataByTab = useCallback(
    async (tab = activeTab, page = 1, limit) => {
      const effectiveLimit =
        typeof limit === 'number' && !Number.isNaN(limit) && limit > 0
          ? limit
          : tabPagination.itemsPerPage ||
            tabPagination.limit ||
            INITIAL_TAB_PAGINATION.itemsPerPage;

      if (tab === 'all') {
        await fetchKwitansi({ page, limit: effectiveLimit });
        return;
      }

      const filtersByTab = TAB_STATUS_CONFIG[tab]?.filters;
      if (!filtersByTab) {
        setTabKwitansis([]);
        setTabPagination({
          ...INITIAL_TAB_PAGINATION,
          itemsPerPage: effectiveLimit,
          limit: effectiveLimit,
        });
        return;
      }

      setTabLoading(true);
      try {
        const { results, pagination: parsedPagination } =
          await searchKwitansiWithFilters(filtersByTab, page, effectiveLimit);
        setTabKwitansis(results);
        setTabPagination({
          ...parsedPagination,
          itemsPerPage:
            parsedPagination?.itemsPerPage ||
            parsedPagination?.limit ||
            effectiveLimit,
          limit:
            parsedPagination?.limit ||
            parsedPagination?.itemsPerPage ||
            effectiveLimit,
        });
      } catch (error) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          handleAuthError();
        }
        console.error('Failed to fetch kwitansi by status:', error);
        setTabKwitansis([]);
        setTabPagination({
          ...INITIAL_TAB_PAGINATION,
          itemsPerPage: effectiveLimit,
          limit: effectiveLimit,
        });
      } finally {
        setTabLoading(false);
      }
    },
    [
      activeTab,
      fetchKwitansi,
      handleAuthError,
      searchKwitansiWithFilters,
      tabPagination.itemsPerPage,
      tabPagination.limit,
    ]
  );

  const handleTabChange = useCallback(
    (newTab) => {
      setActiveTab(newTab);

      if (newTab === 'all') {
        const currentPage = pagination?.currentPage || pagination?.page || 1;
        const currentLimit =
          pagination?.itemsPerPage ||
          pagination?.limit ||
          INITIAL_TAB_PAGINATION.itemsPerPage;
        fetchKwitansi({ page: currentPage, limit: currentLimit });
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
    [fetchDataByTab, fetchKwitansi, pagination, tabPagination]
  );

  const handleTablePageChange = useCallback(
    (page) => {
      if (isSearchActive || activeTab === 'all') {
        handlePageChange(page);
      } else {
        fetchDataByTab(activeTab, page);
      }
    },
    [activeTab, fetchDataByTab, handlePageChange, isSearchActive]
  );

  const handleTableLimitChange = useCallback(
    (limit) => {
      if (isSearchActive || activeTab === 'all') {
        handleLimitChange(limit);
      } else {
        fetchDataByTab(activeTab, 1, limit);
      }
    },
    [activeTab, fetchDataByTab, handleLimitChange, isSearchActive]
  );

  const refreshActiveTab = useCallback(async () => {
    if (hasActiveFilters) {
      await handleSearchSubmit();
      return;
    }

    if (activeTab === 'all') {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      const currentLimit =
        pagination?.itemsPerPage ||
        pagination?.limit ||
        INITIAL_TAB_PAGINATION.itemsPerPage;
      await fetchKwitansi({ page: currentPage, limit: currentLimit });
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
    fetchKwitansi,
    handleSearchSubmit,
    hasActiveFilters,
    pagination,
    tabPagination,
  ]);

  const handleCreateSubmit = async (payload) => {
    const result = await createKwitansi(payload);
    if (result) {
      setIsCreateModalOpen(false);
      await refreshActiveTab();
    }
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedKwitansi?.id) {
      return;
    }

    const result = await updateKwitansi(selectedKwitansi.id, payload);
    if (result) {
      setIsEditModalOpen(false);
      setSelectedKwitansi(null);
      await refreshActiveTab();
    }
  };

  const handleDelete = (id) => {
    if (!id) {
      return;
    }
    triggerDeleteKwitansi(id);
  };

  const handleDeleteConfirm = useCallback(async () => {
    await deleteKwitansiConfirmation.confirmDelete();
    await refreshActiveTab();
  }, [deleteKwitansiConfirmation.confirmDelete, refreshActiveTab]);

  const handleSearch = useCallback(async () => {
    if (activeTab !== 'all') {
      setActiveTab('all');
    }
    await handleSearchSubmit();
  }, [activeTab, handleSearchSubmit]);

  const handleReset = useCallback(async () => {
    if (activeTab !== 'all') {
      setActiveTab('all');
    }
    await handleResetFilters();
  }, [activeTab, handleResetFilters]);

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
                Manajemen Kwitansi
              </h3>
              <p className='text-sm text-gray-500'>
                Pantau dan kelola bukti pembayaran dari invoice penagihan
                pelanggan.
              </p>
            </div>
            <div className='flex justify-end'>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah Kwitansi
              </button>
            </div>
          </div>

          <KwitansiSearch
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            onReset={handleReset}
            loading={Boolean(searchLoading || tableLoading)}
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
                  label={TAB_STATUS_CONFIG[tabId]?.label || tabId}
                  badge={activeTab === tabId ? activeTabBadge : null}
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
            <KwitansiTable
              kwitansis={tableKwitansis}
              pagination={resolvedPagination}
              onPageChange={handleTablePageChange}
              onLimitChange={handleTableLimitChange}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onView={openDetailModal}
              loading={tableLoading}
              searchQuery={searchQuery}
              hasActiveFilters={hasActiveFilters}
            />
          )}
        </div>
      </div>

      <KwitansiModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <KwitansiModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedKwitansi}
        isEdit
      />

      <KwitansiDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        kwitansi={selectedKwitansi}
        isLoading={detailLoading}
      />

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
