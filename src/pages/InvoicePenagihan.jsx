import React, { useCallback, useMemo, useState } from 'react';
import useInvoicePenagihan from '@/hooks/useInvoicePenagihanPage';
import InvoicePenagihanTable from '@/components/invoicePenagihan/InvoicePenagihanTable';
import InvoicePenagihanSearch from '@/components/invoicePenagihan/InvoicePenagihanSearch';
import AddInvoicePenagihanModal from '@/components/invoicePenagihan/AddInvoicePenagihanModal';
import EditInvoicePenagihanModal from '@/components/invoicePenagihan/EditInvoicePenagihanModal';
import ViewInvoicePenagihanModal from '@/components/invoicePenagihan/ViewInvoicePenagihanModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import invoicePenagihanService from '@/services/invoicePenagihanService';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', filters: null },
  pending: {
    label: 'Pending',
    filters: { status_code: 'PENDING INVOICE PENAGIHAN' },
  },
  processing: {
    label: 'Processing',
    filters: { status_code: 'PROCESSING INVOICE PENAGIHAN' },
  },
  paid: {
    label: 'Paid',
    filters: { status_code: 'PAID INVOICE PENAGIHAN' },
  },
  overdue: {
    label: 'Overdue',
    filters: { status_code: 'OVERDUE INVOICE PENAGIHAN' },
  },
  completed: {
    label: 'Completed',
    filters: { status_code: 'COMPLETED INVOICE PENAGIHAN' },
  },
  cancelled: {
    label: 'Cancelled',
    filters: { status_code: 'CANCELLED INVOICE PENAGIHAN' },
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

const parseInvoicePenagihanListResponse = (response = {}) => {
  if (response?.success === false) {
    throw new Error(
      response?.error?.message || 'Failed to fetch invoice penagihan'
    );
  }

  const rawData = response?.data?.data || response?.data || [];
  const results = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

  const paginationData = response?.data?.pagination || {};
  const currentPage =
    paginationData.currentPage ||
    paginationData.page ||
    INITIAL_TAB_PAGINATION.currentPage;
  const itemsPerPage =
    paginationData.itemsPerPage ||
    paginationData.limit ||
    INITIAL_TAB_PAGINATION.itemsPerPage;
  const totalItems =
    paginationData.totalItems ||
    paginationData.total ||
    (Array.isArray(results) ? results.length : 0);
  const totalPages =
    paginationData.totalPages ||
    Math.max(Math.ceil((totalItems || 1) / (itemsPerPage || 1)), 1);

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

const InvoicePenagihanPage = () => {
  const {
    invoicePenagihan,
    setInvoicePenagihan,
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
    deleteInvoiceConfirmation,
    fetchInvoicePenagihan,
    createInvoice,
    updateInvoice,
    handleAuthError,
  } = useInvoicePenagihan();

  const {
    showConfirm: showDeleteDialog,
    hideDeleteConfirmation,
    confirmDelete,
    showDeleteConfirmation,
    title: deleteDialogTitle,
    message: deleteDialogMessage,
    loading: deleteDialogLoading,
  } = deleteInvoiceConfirmation;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [tabInvoices, setTabInvoices] = useState([]);
  const [tabPagination, setTabPagination] = useState(INITIAL_TAB_PAGINATION);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState(null);

  const isSearchActive = useMemo(() => {
    if (typeof searchQuery === 'string') {
      return searchQuery.trim().length > 0;
    }
    return (
      searchQuery !== undefined && searchQuery !== null && searchQuery !== ''
    );
  }, [searchQuery]);

  const tableInvoices = useMemo(() => {
    const dataSource =
      isSearchActive || activeTab === 'all' ? invoicePenagihan : tabInvoices;
    return Array.isArray(dataSource) ? dataSource : [];
  }, [activeTab, invoicePenagihan, isSearchActive, tabInvoices]);

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
        await fetchInvoicePenagihan(page, effectiveLimit);
        return;
      }

      const filters = TAB_STATUS_CONFIG[tab]?.filters;
      if (!filters) {
        setTabInvoices([]);
        setTabPagination({
          ...INITIAL_TAB_PAGINATION,
          itemsPerPage: effectiveLimit,
          limit: effectiveLimit,
        });
        setTabError(null);
        return;
      }

      setTabLoading(true);
      setTabError(null);
      try {
        const response = await invoicePenagihanService.searchInvoicePenagihan(
          filters,
          page,
          effectiveLimit
        );
        const { results, pagination: parsedPagination } =
          parseInvoicePenagihanListResponse(response);
        setTabInvoices(results);
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
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
        }
        console.error('Failed to fetch invoice penagihan by status:', err);
        setTabInvoices([]);
        setTabPagination({
          ...INITIAL_TAB_PAGINATION,
          itemsPerPage: effectiveLimit,
          limit: effectiveLimit,
        });
        setTabError(
          err?.response?.data?.error?.message ||
            err?.message ||
            'Gagal memuat invoice penagihan untuk status ini.'
        );
      } finally {
        setTabLoading(false);
      }
    },
    [
      activeTab,
      fetchInvoicePenagihan,
      handleAuthError,
      tabPagination.itemsPerPage,
      tabPagination.limit,
    ]
  );

  const refreshActiveTab = useCallback(async () => {
    if (isSearchActive) {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      const currentLimit =
        pagination?.itemsPerPage ||
        pagination?.limit ||
        INITIAL_TAB_PAGINATION.itemsPerPage;
      await fetchInvoicePenagihan(currentPage, currentLimit);
      return;
    }

    if (activeTab === 'all') {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      const currentLimit =
        pagination?.itemsPerPage ||
        pagination?.limit ||
        INITIAL_TAB_PAGINATION.itemsPerPage;
      await fetchInvoicePenagihan(currentPage, currentLimit);
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
    fetchInvoicePenagihan,
    isSearchActive,
    pagination,
    tabPagination,
  ]);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setEditingInvoice(null);
    setShowEditModal(false);
  };

  const openViewModal = (invoice) => {
    setViewingInvoice(invoice);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setViewingInvoice(null);
    setShowViewModal(false);
  };

  const handleTabChange = useCallback(
    (newTab) => {
      setActiveTab(newTab);

      if (newTab === 'all') {
        const currentPage = pagination?.currentPage || pagination?.page || 1;
        const currentLimit =
          pagination?.itemsPerPage ||
          pagination?.limit ||
          INITIAL_TAB_PAGINATION.itemsPerPage;
        fetchInvoicePenagihan(currentPage, currentLimit);
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
    [fetchDataByTab, fetchInvoicePenagihan, pagination, tabPagination]
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

  const handleInvoiceCreated = useCallback(
    async (payload) => {
      const createdInvoice = await createInvoice(payload);
      if (createdInvoice) {
        setInvoicePenagihan((prev) => {
          const previous = Array.isArray(prev) ? prev : [];
          const exists = previous.some((item) => item.id === createdInvoice.id);
          if (exists) {
            return previous.map((item) =>
              item.id === createdInvoice.id ? createdInvoice : item
            );
          }
          return [...previous, createdInvoice];
        });
        await refreshActiveTab();
      }
      return createdInvoice;
    },
    [createInvoice, refreshActiveTab, setInvoicePenagihan]
  );

  const handleInvoiceUpdated = useCallback(
    async (id, payload) => {
      const updatedInvoice = await updateInvoice(id, payload);
      if (updatedInvoice) {
        setInvoicePenagihan((prev) => {
          const previous = Array.isArray(prev) ? prev : [];
          return previous.map((invoice) =>
            invoice.id === updatedInvoice.id ? updatedInvoice : invoice
          );
        });
        await refreshActiveTab();
      }
      return updatedInvoice;
    },
    [refreshActiveTab, setInvoicePenagihan, updateInvoice]
  );

  const handleDeleteConfirm = useCallback(async () => {
    await confirmDelete();
    await refreshActiveTab();
  }, [confirmDelete, refreshActiveTab]);

  const handleRetry = useCallback(() => {
    refreshActiveTab();
  }, [refreshActiveTab]);

  const handleTabRetry = useCallback(() => {
    const currentPage = tabPagination.currentPage || tabPagination.page || 1;
    const currentLimit =
      tabPagination.itemsPerPage ||
      tabPagination.limit ||
      INITIAL_TAB_PAGINATION.itemsPerPage;
    fetchDataByTab(activeTab, currentPage, currentLimit);
  }, [activeTab, fetchDataByTab, tabPagination]);

  const shouldShowGlobalError =
    error && (isSearchActive || activeTab === 'all');
  const shouldShowTabError =
    !shouldShowGlobalError && !isSearchActive && activeTab !== 'all' && tabError;

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Daftar Invoice Penagihan
              </h3>
              <p className='text-sm text-gray-500'>
                Kelola invoice penagihan termasuk informasi pelanggan, status,
                serta rincian pembayaran.
              </p>
            </div>
            {/* <div className='flex justify-end'>
              <button
                onClick={openAddModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                Tambah Invoice Penagihan
              </button>
            </div> */}
          </div>

          <InvoicePenagihanSearch
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
                  label={TAB_STATUS_CONFIG[tabId]?.label || tabId}
                  badge={activeTab === tabId ? activeTabBadge : null}
                />
              ))}
            </TabContainer>
          </div>

          {shouldShowGlobalError ? (
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
          ) : shouldShowTabError ? (
            <div className='p-4 border border-yellow-200 rounded-lg bg-yellow-50'>
              <p className='text-sm text-yellow-800'>{tabError}</p>
              <button
                onClick={handleTabRetry}
                className='px-4 py-2 mt-2 text-white bg-yellow-600 rounded hover:bg-yellow-700'
              >
                Muat Ulang
              </button>
            </div>
          ) : tableLoading ? (
            <div className='flex items-center justify-center h-40'>
              <div className='w-10 h-10 border-b-2 border-blue-600 rounded-full animate-spin'></div>
            </div>
          ) : (
            <InvoicePenagihanTable
              invoices={tableInvoices}
              pagination={resolvedPagination}
              onPageChange={handleTablePageChange}
              onLimitChange={handleTableLimitChange}
              onEdit={openEditModal}
              onDelete={showDeleteConfirmation}
              onView={openViewModal}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>

      <AddInvoicePenagihanModal
        show={showAddModal}
        onClose={closeAddModal}
        onCreate={handleInvoiceCreated}
      />

      <EditInvoicePenagihanModal
        show={showEditModal}
        onClose={closeEditModal}
        invoice={editingInvoice}
        onUpdate={handleInvoiceUpdated}
      />

      <ViewInvoicePenagihanModal
        show={showViewModal}
        onClose={closeViewModal}
        invoice={viewingInvoice}
      />

      <ConfirmationDialog
        show={showDeleteDialog}
        onClose={hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteDialogTitle}
        message={deleteDialogMessage}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteDialogLoading}
      />
    </div>
  );
};

export default InvoicePenagihanPage;

