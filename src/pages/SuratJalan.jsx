import React, { useState, useMemo, useCallback } from 'react';
import useSuratJalanPage from '../hooks/useSuratJalanPage';
import SuratJalanTable from '../components/suratJalan/SuratJalanTable';
import SuratJalanSearch from '../components/suratJalan/SuratJalanSearch';
import AddSuratJalanModal from '../components/suratJalan/AddSuratJalanModal';
import EditSuratJalanModal from '../components/suratJalan/EditSuratJalanModal';
import ViewSuratJalanModal from '../components/suratJalan/ViewSuratJalanModal';
import ProcessSuratJalanModal from '../components/suratJalan/ProcessSuratJalanModal';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { TabContainer, Tab } from '../components/ui/Tabs';
import suratJalanService from '../services/suratJalanService';
import toastService from '../services/toastService';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  draft: { label: 'Draft', statusCode: 'DRAFT SURAT JALAN' },
  readyToShip: {
    label: 'Ready to Ship',
    statusCode: 'READY TO SHIP SURAT JALAN',
  },
  delivered: { label: 'Delivered', statusCode: 'DELIVERED SURAT JALAN' },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED SURAT JALAN' },
};

const TAB_ORDER = [
  'all',
  'draft',
  'readyToShip',
  'delivered',
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

const parseSuratJalanApiResponse = (response = {}) => {
  const rawData =
    response?.data?.suratJalan ?? response?.data?.data ?? response?.data ?? [];
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

const SuratJalan = () => {
  const {
    suratJalan,
    setSuratJalan,
    pagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    selectedSuratJalan,
    setSelectedSuratJalan,
    hasSelectedSuratJalan,
    isProcessingSuratJalan,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange,
    handleSelectSuratJalan,
    handleSelectAllSuratJalan,
    handleProcessSuratJalan,
    deleteSuratJalan,
    deleteSuratJalanConfirmation,
    fetchSuratJalan,
    handleAuthError,
  } = useSuratJalanPage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingSuratJalan, setEditingSuratJalan] = useState(null);
  const [viewingSuratJalan, setViewingSuratJalan] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);

  const [activeTab, setActiveTab] = useState('all');
  const [tabLoading, setTabLoading] = useState(false);
  const [tabData, setTabData] = useState([]);
  const [tabPagination, setTabPagination] = useState(INITIAL_TAB_PAGINATION);

  const isSearchActive = useMemo(() => {
    if (searchQuery == null) {
      return false;
    }

    if (typeof searchQuery === 'string') {
      return searchQuery.trim() !== '';
    }

    return Boolean(searchQuery);
  }, [searchQuery]);

  const tableSuratJalan = useMemo(() => {
    if (isSearchActive || activeTab === 'all') {
      return suratJalan;
    }
    return tabData;
  }, [activeTab, isSearchActive, suratJalan, tabData]);

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

  const selectedSuratJalanDetails = useMemo(() => {
    if (!Array.isArray(selectedSuratJalan) || selectedSuratJalan.length === 0) {
      return [];
    }

    const sources = [
      Array.isArray(suratJalan) ? suratJalan : [],
      Array.isArray(tabData) ? tabData : [],
    ];

    const detailMap = new Map();

    sources.forEach((collection) => {
      collection.forEach((item) => {
        if (
          item?.id &&
          selectedSuratJalan.includes(item.id) &&
          !detailMap.has(item.id)
        ) {
          detailMap.set(item.id, item);
        }
      });
    });

    return Array.from(detailMap.values());
  }, [selectedSuratJalan, suratJalan, tabData]);

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
        await fetchSuratJalan(page, effectiveLimit);
        return;
      }

      const statusCode = getStatusCodeForTab(tab);
      if (!statusCode) {
        setTabData([]);
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
        const response = await suratJalanService.searchSuratJalan(
          { status_code: statusCode },
          page,
          effectiveLimit
        );
        const { results, pagination: parsedPagination } =
          parseSuratJalanApiResponse(response);
        setTabData(results);
        setTabPagination(parsedPagination);
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
        }
        console.error('Failed to fetch surat jalan by status:', err);
        setTabData([]);
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
      fetchSuratJalan,
      getStatusCodeForTab,
      handleAuthError,
      tabPagination.itemsPerPage,
      tabPagination.limit,
    ]
  );

  const handleTabChange = useCallback(
    (newTab) => {
      setActiveTab(newTab);
      setSelectedSuratJalan([]);

      if (newTab === 'all') {
        const currentPage = pagination?.currentPage || pagination?.page || 1;
        const currentLimit =
          pagination?.itemsPerPage ||
          pagination?.limit ||
          INITIAL_TAB_PAGINATION.itemsPerPage;
        fetchSuratJalan(currentPage, currentLimit);
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
      fetchSuratJalan,
      pagination,
      tabPagination.itemsPerPage,
      tabPagination.limit,
    ]
  );

  const handleSearchChangeWithReset = useCallback((event) => {
    setSelectedSuratJalan([]);
    handleSearchChange(event);
  }, [handleSearchChange, setSelectedSuratJalan]);

  const handleSearchFieldChangeWithReset = useCallback((field) => {
    setSelectedSuratJalan([]);
    handleSearchFieldChange(field);
  }, [handleSearchFieldChange, setSelectedSuratJalan]);

  const handleTabPageChange = useCallback(
    (page) => {
      setSelectedSuratJalan([]);
      fetchDataByTab(activeTab, page);
    },
    [activeTab, fetchDataByTab, setSelectedSuratJalan]
  );

  const handleTabLimitChange = useCallback(
    (limit) => {
      setSelectedSuratJalan([]);
      fetchDataByTab(activeTab, 1, limit);
    },
    [activeTab, fetchDataByTab, setSelectedSuratJalan]
  );

  const handleTablePageChange = useCallback(
    (page) => {
      setSelectedSuratJalan([]);
      if (isSearchActive || activeTab === 'all') {
        handlePageChange(page);
      } else {
        handleTabPageChange(page);
      }
    },
    [activeTab, handlePageChange, handleTabPageChange, isSearchActive, setSelectedSuratJalan]
  );

  const handleTableLimitChange = useCallback(
    (limit) => {
      setSelectedSuratJalan([]);
      if (isSearchActive || activeTab === 'all') {
        handleLimitChange(limit);
      } else {
        handleTabLimitChange(limit);
      }
    },
    [activeTab, handleLimitChange, handleTabLimitChange, isSearchActive, setSelectedSuratJalan]
  );

  const handleProcessSelected = useCallback(() => {
    if (!hasSelectedSuratJalan) {
      toastService.error('Pilih minimal satu surat jalan untuk diproses');
      return;
    }

    setShowProcessModal(true);
  }, [hasSelectedSuratJalan]);

  const closeProcessModal = useCallback(() => {
    setShowProcessModal(false);
  }, []);

  const refreshActiveTab = useCallback(async () => {
    setSelectedSuratJalan([]);

    if (isSearchActive) {
      return;
    }

    if (activeTab === 'all') {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      const currentLimit =
        pagination?.itemsPerPage ||
        pagination?.limit ||
        INITIAL_TAB_PAGINATION.itemsPerPage;
      await fetchSuratJalan(currentPage, currentLimit);
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
    fetchSuratJalan,
    isSearchActive,
    pagination,
    tabPagination,
    setSelectedSuratJalan,
  ]);

  const handleProcessModalSubmit = useCallback(
    async (checklistData) => {
      if (
        !Array.isArray(selectedSuratJalan) ||
        selectedSuratJalan.length === 0
      ) {
        toastService.error('Pilih minimal satu surat jalan untuk diproses');
        return;
      }

      try {
        const response = await handleProcessSuratJalan({
          ids: selectedSuratJalan,
          checklist: checklistData,
        });

        if (response?.success === false) {
          return;
        }

        closeProcessModal();
        await refreshActiveTab();
      } catch (processError) {
        console.error('Error processing surat jalan:', processError);
      }
    },
    [
      closeProcessModal,
      handleProcessSuratJalan,
      refreshActiveTab,
      selectedSuratJalan,
    ]
  );

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = async (suratJalanItem) => {
    if (!suratJalanItem?.id) {
      toastService.error('Surat jalan tidak valid');
      return;
    }

    try {
      const response = await suratJalanService.getSuratJalanById(suratJalanItem.id);
      const detailData = response?.data?.data ?? response?.data;

      if (response?.success === false || !detailData) {
        toastService.error(response?.message || 'Gagal memuat detail surat jalan');
        return;
      }

      setEditingSuratJalan(detailData);
      setShowEditModal(true);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }
      console.error('Error fetching surat jalan detail:', err);
      toastService.error('Gagal memuat detail surat jalan');
    }
  };
  const closeEditModal = () => {
    setEditingSuratJalan(null);
    setShowEditModal(false);
  };

  const openViewModal = async (suratJalanItem) => {
    if (!suratJalanItem?.id) {
      toastService.error('Surat jalan tidak valid');
      return;
    }

    try {
      const response = await suratJalanService.getSuratJalanById(suratJalanItem.id);
      const detailData = response?.data?.data ?? response?.data;

      if (response?.success === false || !detailData) {
        toastService.error(response?.message || 'Gagal memuat detail surat jalan');
        return;
      }

      setViewingSuratJalan(detailData);
      setShowViewModal(true);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }
      console.error('Error fetching surat jalan detail:', err);
      toastService.error('Gagal memuat detail surat jalan');
    }
  };
  const closeViewModal = () => {
    setViewingSuratJalan(null);
    setShowViewModal(false);
  };

  const handleSuratJalanAdded = (newSuratJalan) => {
    setSuratJalan((prev) => [...prev, newSuratJalan]);
    setSelectedSuratJalan([]);
    closeAddModal();
    refreshActiveTab();
  };

  const handleSuratJalanUpdated = (updatedSuratJalan) => {
    setSuratJalan((prev) =>
      prev.map((item) =>
        item.id === updatedSuratJalan.id ? updatedSuratJalan : item
      )
    );
    setSelectedSuratJalan([]);
    closeEditModal();
    refreshActiveTab();
  };

  const handleDeleteConfirm = useCallback(async () => {
    await deleteSuratJalanConfirmation.confirmDelete();
    setSelectedSuratJalan([]);
    await refreshActiveTab();
  }, [deleteSuratJalanConfirmation, refreshActiveTab, setSelectedSuratJalan]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
        <p className='text-red-800'>Error: {error}</p>
        <button
          onClick={fetchSuratJalan}
          className='px-4 py-2 mt-2 text-white bg-red-600 rounded hover:bg-red-700'
        >
          Retry
        </button>
      </div>
    );
  }

  const resolvedPagination = tablePagination || INITIAL_TAB_PAGINATION;

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-medium text-gray-900'>
              Surat Jalan List
            </h3>
            {/* <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Surat Jalan
            </button> */}
          </div>

          <SuratJalanSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChangeWithReset}
            handleSearchFieldChange={handleSearchFieldChangeWithReset}
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
                  badge={
                    activeTab === tabId
                      ? (resolvedPagination?.totalItems ?? 0)
                      : null
                  }
                />
              ))}
            </TabContainer>
          </div>

          <SuratJalanTable
            suratJalan={tableSuratJalan}
            pagination={resolvedPagination}
            onPageChange={handleTablePageChange}
            onLimitChange={handleTableLimitChange}
            onEdit={openEditModal}
            onDelete={deleteSuratJalan}
            onView={openViewModal}
            searchQuery={searchQuery}
            loading={tableLoading}
            selectedSuratJalan={selectedSuratJalan}
            onSelectSuratJalan={handleSelectSuratJalan}
            onSelectAllSuratJalan={handleSelectAllSuratJalan}
            onProcessSelected={handleProcessSelected}
            isProcessing={isProcessingSuratJalan}
            hasSelectedSuratJalan={hasSelectedSuratJalan}
          />
        </div>
      </div>

      <AddSuratJalanModal
        show={showAddModal}
        onClose={closeAddModal}
        onSuratJalanAdded={handleSuratJalanAdded}
        handleAuthError={handleAuthError}
      />

      <EditSuratJalanModal
        show={showEditModal}
        onClose={closeEditModal}
        suratJalan={editingSuratJalan}
        onSuratJalanUpdated={handleSuratJalanUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewSuratJalanModal
        show={showViewModal}
        onClose={closeViewModal}
        suratJalan={viewingSuratJalan}
      />

      <ProcessSuratJalanModal
        show={showProcessModal}
        onClose={closeProcessModal}
        onSubmit={handleProcessModalSubmit}
        isSubmitting={isProcessingSuratJalan}
        selectedItems={selectedSuratJalanDetails}
        selectedIds={selectedSuratJalan}
      />

      <ConfirmationDialog
        show={deleteSuratJalanConfirmation.showConfirm}
        onClose={deleteSuratJalanConfirmation.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteSuratJalanConfirmation.title}
        message={deleteSuratJalanConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteSuratJalanConfirmation.loading}
      />
    </div>
  );
};

export default SuratJalan;
