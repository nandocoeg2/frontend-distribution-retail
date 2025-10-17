import React, { useCallback, useState } from 'react';
import useTandaTerimaFakturPage from '@/hooks/useTandaTerimaFakturPage';
import {
  TandaTerimaFakturSearch,
  TandaTerimaFakturTable,
  TandaTerimaFakturModal,
  TandaTerimaFakturDetailModal,
} from '@/components/tandaTerimaFaktur';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '@/components/ui/Tabs';
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
  } = useTandaTerimaFakturPage();

  const [selectedTtf, setSelectedTtf] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const dataSource = Array.isArray(tandaTerimaFakturs)
    ? tandaTerimaFakturs
    : [];

  const statusCounts = React.useMemo(() => {
    const counts = {
      all: dataSource.length,
    };

    TAB_ORDER.forEach((tabId) => {
      if (tabId === 'all') {
        return;
      }
      const statusCode = TAB_STATUS_CONFIG[tabId]?.statusCode;
      if (!statusCode) {
        counts[tabId] = 0;
        return;
      }
      counts[tabId] = dataSource.filter(
        (item) => item?.status?.status_code === statusCode
      ).length;
    });

    return counts;
  }, [dataSource]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const filteredTandaTerimaFakturs = React.useMemo(() => {
    if (activeTab === 'all') {
      return dataSource;
    }

    const statusCode = TAB_STATUS_CONFIG[activeTab]?.statusCode;
    if (!statusCode) {
      return dataSource;
    }

    return dataSource.filter(
      (item) => item?.status?.status_code === statusCode
    );
  }, [activeTab, dataSource]);

  const resolvedPagination = React.useMemo(() => {
    if (activeTab === 'all') {
      return pagination;
    }

    const base = pagination || {};
    const itemsPerPage =
      base.itemsPerPage || base.limit || filteredTandaTerimaFakturs.length || 10;
    const totalItems = filteredTandaTerimaFakturs.length;
    const totalPages = Math.max(
      Math.ceil((totalItems || 1) / (itemsPerPage || 1)),
      1
    );

    return {
      ...base,
      currentPage: 1,
      page: 1,
      totalItems,
      total: totalItems,
      itemsPerPage,
      limit: itemsPerPage,
      totalPages,
    };
  }, [activeTab, filteredTandaTerimaFakturs, pagination]);

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
    }
  };

  const handleDelete = (id) => {
    if (!id) {
      return;
    }
    triggerDeleteTandaTerimaFaktur(id);
  };

  const handleRetry = () => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    fetchTandaTerimaFaktur({ page: currentPage });
  };

  const tableLoading = Boolean(loading) && !error;

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
              {TAB_ORDER.map((tabId) => (
                <Tab
                  key={tabId}
                  id={tabId}
                  label={TAB_STATUS_CONFIG[tabId]?.label || tabId}
                  badge={statusCounts[tabId] ?? 0}
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
              {tableLoading && (
                <div className='flex items-center mb-4 text-sm text-gray-500'>
                  <div className='w-4 h-4 mr-2 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                  Memuat data tanda terima faktur...
                </div>
              )}
              <TandaTerimaFakturTable
                tandaTerimaFakturs={filteredTandaTerimaFakturs}
                pagination={resolvedPagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onView={openDetailModal}
                loading={loading}
                searchQuery={searchQuery}
                hasActiveFilters={hasActiveFilters}
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
        show={deleteTandaTerimaFakturConfirmation.showConfirm}
        onClose={deleteTandaTerimaFakturConfirmation.hideDeleteConfirmation}
        onConfirm={deleteTandaTerimaFakturConfirmation.confirmDelete}
        title={deleteTandaTerimaFakturConfirmation.title}
        message={deleteTandaTerimaFakturConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteTandaTerimaFakturConfirmation.loading}
      />
    </div>
  );
};

export default TandaTerimaFakturPage;
