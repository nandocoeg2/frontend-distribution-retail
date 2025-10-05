import React, { useCallback, useMemo, useState } from 'react';
import useInvoicePengiriman from '@/hooks/useInvoicePengirimanPage';
import InvoicePengirimanTable from '@/components/invoicePengiriman/InvoicePengirimanTable';
import InvoicePengirimanSearch from '@/components/invoicePengiriman/InvoicePengirimanSearch';
import AddInvoicePengirimanModal from '@/components/invoicePengiriman/AddInvoicePengirimanModal';
import EditInvoicePengirimanModal from '@/components/invoicePengiriman/EditInvoicePengirimanModal';
import ViewInvoicePengirimanModal from '@/components/invoicePengiriman/ViewInvoicePengirimanModal';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import invoicePengirimanService from '@/services/invoicePengirimanService';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED INVOICE' },
  pending: { label: 'Pending', statusCode: 'PENDING INVOICE' },
  paid: { label: 'Paid', statusCode: 'PAID INVOICE' },
  overdue: { label: 'Overdue', statusCode: 'OVERDUE INVOICE' },
};

const TAB_ORDER = ['all', 'cancelled', 'pending', 'paid', 'overdue'];

const INITIAL_TAB_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

const parseInvoicePengirimanApiResponse = (response = {}) => {
  const rawData = response?.data?.data ?? response?.data ?? [];
  const paginationData = response?.data?.pagination ?? {};
  const currentPage = paginationData.currentPage ?? paginationData.page ?? 1;
  const itemsPerPage =
    paginationData.itemsPerPage ??
    paginationData.limit ??
    INITIAL_TAB_PAGINATION.itemsPerPage;
  const results = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : [];
  const totalItems =
    paginationData.totalItems ??
    paginationData.total ??
    (Array.isArray(results) ? results.length : 0);

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

const InvoicePengirimanPage = () => {
  const {
    invoicePengiriman,
    setInvoicePengiriman,
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
    fetchInvoicePengiriman,
    handleAuthError,
  } = useInvoicePengiriman();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  const [activeTab, setActiveTab] = useState('all');
  const [tabLoading, setTabLoading] = useState(false);
  const [tabData, setTabData] = useState([]);
  const [tabPagination, setTabPagination] = useState(INITIAL_TAB_PAGINATION);

  const isSearchActive = useMemo(() => {
    if (typeof searchQuery !== 'string') {
      return false;
    }
    return searchQuery.trim().length > 0;
  }, [searchQuery]);

  const tableInvoices = useMemo(() => {
    if (isSearchActive || activeTab === 'all') {
      return invoicePengiriman;
    }
    return tabData;
  }, [activeTab, invoicePengiriman, isSearchActive, tabData]);

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

  const getStatusCodeForTab = useCallback(
    (tabId) => TAB_STATUS_CONFIG[tabId]?.statusCode ?? null,
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
        await fetchInvoicePengiriman(page, effectiveLimit);
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
        const response = await invoicePengirimanService.searchInvoicePengiriman(
          { status_code: statusCode },
          page,
          effectiveLimit
        );
        const { results, pagination: parsedPagination } =
          parseInvoicePengirimanApiResponse(response);
        setTabData(results);
        setTabPagination(parsedPagination);
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
        }
        console.error('Failed to fetch invoice pengiriman by status:', err);
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
      fetchInvoicePengiriman,
      getStatusCodeForTab,
      handleAuthError,
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
        fetchInvoicePengiriman(currentPage, currentLimit);
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
      fetchInvoicePengiriman,
      pagination,
      tabPagination.itemsPerPage,
      tabPagination.limit,
    ]
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
        setTabPagination((prev) => ({
          ...prev,
          itemsPerPage: limit,
          limit,
        }));
        fetchDataByTab(activeTab, 1, limit);
      }
    },
    [activeTab, fetchDataByTab, handleLimitChange, isSearchActive]
  );

  const refreshActiveTab = useCallback(() => {
    if (isSearchActive) {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      handlePageChange(currentPage);
      return;
    }

    if (activeTab === 'all') {
      const currentPage = pagination?.currentPage || pagination?.page || 1;
      const currentLimit =
        pagination?.itemsPerPage ||
        pagination?.limit ||
        INITIAL_TAB_PAGINATION.itemsPerPage;
      fetchInvoicePengiriman(currentPage, currentLimit);
    } else {
      const currentPage = tabPagination.currentPage || tabPagination.page || 1;
      const currentLimit =
        tabPagination.itemsPerPage ||
        tabPagination.limit ||
        INITIAL_TAB_PAGINATION.itemsPerPage;
      fetchDataByTab(activeTab, currentPage, currentLimit);
    }
  }, [
    activeTab,
    fetchDataByTab,
    fetchInvoicePengiriman,
    handlePageChange,
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

  const handleInvoiceAdded = (newInvoice) => {
    if (!newInvoice) {
      return;
    }
    setInvoicePengiriman((prev) => [...prev, newInvoice]);
    closeAddModal();
    refreshActiveTab();
  };

  const handleInvoiceUpdated = (updatedInvoice) => {
    if (!updatedInvoice) {
      return;
    }
    setInvoicePengiriman((prev) =>
      prev.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      )
    );
    closeEditModal();
    refreshActiveTab();
  };

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteInvoiceConfirmation.confirmDelete();
    } finally {
      refreshActiveTab();
    }
  }, [deleteInvoiceConfirmation, refreshActiveTab]);

  if (loading && activeTab === 'all' && !isSearchActive) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
        <p className='text-red-800'>Terjadi kesalahan: {error}</p>
        <button
          onClick={fetchInvoicePengiriman}
          className='px-4 py-2 mt-2 text-white bg-red-600 rounded hover:bg-red-700'
        >
          Coba Lagi
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
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Daftar Invoice Pengiriman
              </h3>
              <p className='text-sm text-gray-500'>
                Pantau seluruh invoice pengiriman termasuk informasi pelanggan
                dan status pembayaran.
              </p>
            </div>
            {/* <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700'
            >
              Tambah Invoice Pengiriman
            </button> */}
          </div>

          <InvoicePengirimanSearch
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
                  badge={
                    activeTab === tabId
                      ? (resolvedPagination?.totalItems ?? 0)
                      : null
                  }
                />
              ))}
            </TabContainer>
          </div>

          {tableLoading ? (
            <div className='flex items-center justify-center h-40'>
              <div className='w-10 h-10 border-b-2 border-blue-600 rounded-full animate-spin'></div>
            </div>
          ) : (
            <InvoicePengirimanTable
              invoices={tableInvoices}
              pagination={resolvedPagination}
              onPageChange={handleTablePageChange}
              onLimitChange={handleTableLimitChange}
              onEdit={openEditModal}
              onDelete={deleteInvoiceConfirmation.showDeleteConfirmation}
              onView={openViewModal}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>

      <AddInvoicePengirimanModal
        show={showAddModal}
        onClose={closeAddModal}
        onInvoiceAdded={handleInvoiceAdded}
        handleAuthError={handleAuthError}
      />

      <EditInvoicePengirimanModal
        show={showEditModal}
        onClose={closeEditModal}
        invoice={editingInvoice}
        onInvoiceUpdated={handleInvoiceUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewInvoicePengirimanModal
        show={showViewModal}
        onClose={closeViewModal}
        invoice={viewingInvoice}
      />

      <ConfirmationDialog
        show={deleteInvoiceConfirmation.showConfirm}
        onClose={deleteInvoiceConfirmation.hideDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        title={deleteInvoiceConfirmation.title}
        message={deleteInvoiceConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteInvoiceConfirmation.loading}
      />
    </div>
  );
};

export default InvoicePengirimanPage;
