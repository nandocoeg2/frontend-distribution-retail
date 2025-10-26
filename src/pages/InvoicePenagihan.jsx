import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useInvoicePenagihan from '@/hooks/useInvoicePenagihanPage';
import InvoicePenagihanTableServerSide from '@/components/invoicePenagihan/InvoicePenagihanTableServerSide';
import InvoicePenagihanSearch from '@/components/invoicePenagihan/InvoicePenagihanSearch';
import AddInvoicePenagihanModal from '@/components/invoicePenagihan/AddInvoicePenagihanModal';
import EditInvoicePenagihanModal from '@/components/invoicePenagihan/EditInvoicePenagihanModal';
import ViewInvoicePenagihanModal from '@/components/invoicePenagihan/ViewInvoicePenagihanModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { TabContainer, Tab } from '@/components/ui/Tabs';
import invoicePenagihanService from '@/services/invoicePenagihanService';
import toastService from '@/services/toastService';
import useStatuses from '@/hooks/useStatuses';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: {
    label: 'Pending',
    statusCode: 'PENDING INVOICE PENAGIHAN',
  },
  processing: {
    label: 'Processing',
    statusCode: 'PROCESSING INVOICE PENAGIHAN',
  },
  paid: {
    label: 'Paid',
    statusCode: 'PAID INVOICE PENAGIHAN',
  },
  overdue: {
    label: 'Overdue',
    statusCode: 'OVERDUE INVOICE PENAGIHAN',
  },
  completed: {
    label: 'Completed',
    statusCode: 'COMPLETED INVOICE PENAGIHAN',
  },
  cancelled: {
    label: 'Cancelled',
    statusCode: 'CANCELLED INVOICE PENAGIHAN',
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
  const queryClient = useQueryClient();
  
  const {
    invoicePenagihan,
    setInvoicePenagihan,
    pagination,
    loading,
    error,
    filters,
    searchQuery,
    searchLoading,
    hasActiveFilters,
    handleFiltersChange,
    handleSearchSubmit,
    handleResetFilters,
    handlePageChange,
    handleLimitChange,
    deleteInvoiceConfirmation,
    fetchInvoicePenagihan,
    createInvoice,
    updateInvoice,
    handleAuthError,
  } = useInvoicePenagihan();

  const { invoiceStatuses, fetchInvoiceStatuses } = useStatuses();

  useEffect(() => {
    fetchInvoiceStatuses();
  }, [fetchInvoiceStatuses]);

  const invoiceStatusList = useMemo(() => {
    if (Array.isArray(invoiceStatuses)) {
      return invoiceStatuses;
    }
    if (Array.isArray(invoiceStatuses?.data)) {
      return invoiceStatuses.data;
    }
    if (Array.isArray(invoiceStatuses?.data?.data)) {
      return invoiceStatuses.data.data;
    }
    return [];
  }, [invoiceStatuses]);

  const statusCodeToIdMap = useMemo(() => {
    return invoiceStatusList.reduce((acc, status) => {
      if (status?.status_code && status?.id) {
        acc[status.status_code] = status.id;
      }
      return acc;
    }, {});
  }, [invoiceStatusList]);

  const resolveTabFilters = useCallback(
    (tabId) => {
      if (!tabId || tabId === 'all') {
        return null;
      }
      const statusCode = TAB_STATUS_CONFIG[tabId]?.statusCode;
      if (!statusCode) {
        return null;
      }
      const statusId = statusCodeToIdMap[statusCode];
      if (statusId) {
        return { statusId };
      }
      return { status_code: statusCode };
    },
    [statusCodeToIdMap]
  );

  const {
    showConfirm: showDeleteDialog,
    hideDeleteConfirmation,
    confirmDelete,
    showDeleteConfirmation,
    title: deleteDialogTitle,
    message: deleteDialogMessage,
    loading: deleteDialogLoading,
  } = deleteInvoiceConfirmation;

  const viewDetailRequestRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewDetailLoading, setViewDetailLoading] = useState(false);
  const [generateKwitansiConfirmation, setGenerateKwitansiConfirmation] =
    useState({
      show: false,
      invoice: null,
    });
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState(null);
  const [generateFakturConfirmation, setGenerateFakturConfirmation] = useState({
    show: false,
    invoice: null,
  });
  const [generatingFakturInvoiceId, setGeneratingFakturInvoiceId] =
    useState(null);
  const [generateTtfConfirmation, setGenerateTtfConfirmation] = useState({
    show: false,
    invoice: null,
  });
  const [generatingTtfInvoiceId, setGeneratingTtfInvoiceId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [tabInvoices, setTabInvoices] = useState([]);
  const [tabPagination, setTabPagination] = useState(INITIAL_TAB_PAGINATION);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState(null);

  const generateKwitansiDialogInvoice = generateKwitansiConfirmation.invoice;
  const generateKwitansiDialogLoading =
    Boolean(generateKwitansiDialogInvoice) &&
    generatingInvoiceId === generateKwitansiDialogInvoice.id;
  const generateFakturDialogInvoice = generateFakturConfirmation.invoice;
  const generateFakturDialogLoading =
    Boolean(generateFakturDialogInvoice) &&
    generatingFakturInvoiceId === generateFakturDialogInvoice.id;
  const generateTtfDialogInvoice = generateTtfConfirmation.invoice;
  const generateTtfDialogLoading =
    Boolean(generateTtfDialogInvoice) &&
    generatingTtfInvoiceId === generateTtfDialogInvoice.id;

  const isSearchActive = hasActiveFilters;

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

      const tabFilters = resolveTabFilters(tab);
      if (!tabFilters) {
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
          tabFilters,
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
      resolveTabFilters,
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

  const openGenerateKwitansiDialog = useCallback((invoice) => {
    if (!invoice || invoice?.kwitansiId || invoice?.kwitansi?.id) {
      return;
    }
    setGenerateKwitansiConfirmation({
      show: true,
      invoice,
    });
  }, []);

  const closeGenerateKwitansiDialog = useCallback(() => {
    setGenerateKwitansiConfirmation({
      show: false,
      invoice: null,
    });
  }, []);

  const handleGenerateKwitansiConfirm = useCallback(async () => {
    const targetInvoice = generateKwitansiDialogInvoice;
    const invoiceId = targetInvoice?.id;

    if (!invoiceId) {
      closeGenerateKwitansiDialog();
      return;
    }

    setGeneratingInvoiceId(invoiceId);
    try {
      const response = await invoicePenagihanService.generateKwitansi(
        invoiceId
      );
      const payload = response ?? {};
      if (payload?.success === false) {
        throw new Error(
          payload?.error?.message || 'Gagal membuat kwitansi dari invoice.'
        );
      }

      const kwitansiData = payload?.data ?? payload;
      toastService.success(
        kwitansiData?.no_kwitansi
          ? `Kwitansi ${kwitansiData.no_kwitansi} berhasil dibuat.`
          : 'Kwitansi berhasil dibuat.'
      );

      closeGenerateKwitansiDialog();

      setViewingInvoice((prev) => {
        if (prev?.id !== invoiceId) {
          return prev;
        }
        return {
          ...prev,
          kwitansiId: kwitansiData?.id || kwitansiData?.kwitansiId || prev?.kwitansiId,
          kwitansi: kwitansiData || prev?.kwitansi,
        };
      });

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['invoicePenagihan'] });
      await refreshActiveTab();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
      } else {
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Gagal membuat kwitansi dari invoice penagihan.';
        toastService.error(message);
      }
      console.error('Failed to generate kwitansi from invoice penagihan:', err);
    } finally {
      setGeneratingInvoiceId((current) =>
        current === invoiceId ? null : current
      );
    }
  }, [
    closeGenerateKwitansiDialog,
    generateKwitansiDialogInvoice,
    handleAuthError,
    refreshActiveTab,
    queryClient,
  ]);

  const openGenerateTtfDialog = useCallback((invoice) => {
    if (
      !invoice ||
      invoice?.tandaTerimaFakturId ||
      invoice?.tandaTerimaFaktur?.id
    ) {
      return;
    }
    setGenerateTtfConfirmation({
      show: true,
      invoice,
    });
  }, []);

  const closeGenerateTtfDialog = useCallback(() => {
    setGenerateTtfConfirmation({
      show: false,
      invoice: null,
    });
  }, []);

  const handleGenerateTtfConfirm = useCallback(async () => {
    const targetInvoice = generateTtfDialogInvoice;
    const invoiceId = targetInvoice?.id;

    if (!invoiceId) {
      closeGenerateTtfDialog();
      return;
    }

    setGeneratingTtfInvoiceId(invoiceId);
    try {
      const response =
        await invoicePenagihanService.generateTandaTerimaFaktur(invoiceId);
      const payload = response ?? {};
      if (payload?.success === false) {
        throw new Error(
          payload?.error?.message ||
            'Gagal membuat tanda terima faktur dari invoice.'
        );
      }

      const ttfData = payload?.data ?? payload;
      toastService.success(
        ttfData?.code_supplier
          ? `Tanda terima faktur ${ttfData.code_supplier} berhasil dibuat.`
          : 'Tanda terima faktur berhasil dibuat.'
      );

      closeGenerateTtfDialog();

      setViewingInvoice((prev) => {
        if (prev?.id !== invoiceId) {
          return prev;
        }
        return {
          ...prev,
          tandaTerimaFakturId:
            ttfData?.id ||
            ttfData?.tandaTerimaFakturId ||
            prev?.tandaTerimaFakturId,
          tandaTerimaFaktur: ttfData || prev?.tandaTerimaFaktur,
        };
      });

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['invoicePenagihan'] });
      await refreshActiveTab();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
      } else {
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Gagal membuat tanda terima faktur dari invoice penagihan.';
        toastService.error(message);
      }
      console.error(
        'Failed to generate tanda terima faktur from invoice penagihan:',
        err
      );
    } finally {
      setGeneratingTtfInvoiceId((current) =>
        current === invoiceId ? null : current
      );
    }
  }, [
    closeGenerateTtfDialog,
    generateTtfDialogInvoice,
    handleAuthError,
    refreshActiveTab,
    queryClient,
  ]);

  const openGenerateFakturDialog = useCallback((invoice) => {
    if (!invoice || invoice?.fakturPajakId || invoice?.fakturPajak?.id) {
      return;
    }
    setGenerateFakturConfirmation({
      show: true,
      invoice,
    });
  }, []);

  const closeGenerateFakturDialog = useCallback(() => {
    setGenerateFakturConfirmation({
      show: false,
      invoice: null,
    });
  }, []);

  const handleGenerateFakturConfirm = useCallback(async () => {
    const targetInvoice = generateFakturDialogInvoice;
    const invoiceId = targetInvoice?.id;

    if (!invoiceId) {
      closeGenerateFakturDialog();
      return;
    }

    setGeneratingFakturInvoiceId(invoiceId);
    try {
      const response = await invoicePenagihanService.generateFakturPajak(
        invoiceId
      );
      const payload = response ?? {};
      if (payload?.success === false) {
        throw new Error(
          payload?.error?.message || 'Gagal membuat faktur pajak.'
        );
      }

      const fakturData = payload?.data ?? payload;
      toastService.success(
        fakturData?.no_pajak
          ? `Faktur pajak ${fakturData.no_pajak} berhasil dibuat.`
          : 'Faktur pajak berhasil dibuat.'
      );

      closeGenerateFakturDialog();

      setViewingInvoice((prev) => {
        if (prev?.id !== invoiceId) {
          return prev;
        }
        return {
          ...prev,
          fakturPajakId:
            fakturData?.id || fakturData?.fakturPajakId || prev?.fakturPajakId,
          fakturPajak: fakturData || prev?.fakturPajak,
        };
      });

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['invoicePenagihan'] });
      await refreshActiveTab();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
      } else {
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Gagal membuat faktur pajak dari invoice penagihan.';
        toastService.error(message);
      }
      console.error('Failed to generate faktur pajak from invoice penagihan:', err);
    } finally {
      setGeneratingFakturInvoiceId((current) =>
        current === invoiceId ? null : current
      );
    }
  }, [
    closeGenerateFakturDialog,
    generateFakturDialogInvoice,
    handleAuthError,
    refreshActiveTab,
    queryClient,
  ]);

  const openViewModal = useCallback(
    async (selectedInvoice) => {
      if (!selectedInvoice) {
        return;
      }

      setViewingInvoice(selectedInvoice);
      setShowViewModal(true);

      const invoiceId = selectedInvoice.id;
      if (!invoiceId) {
        return;
      }

      setViewDetailLoading(true);
      try {
        viewDetailRequestRef.current = invoiceId;
        const response = await invoicePenagihanService.getInvoicePenagihanById(
          invoiceId
        );
        const detailPayload = response?.data ?? response;
        const detailedInvoice =
          detailPayload?.data && !Array.isArray(detailPayload.data)
            ? detailPayload.data
            : detailPayload;

        if (detailedInvoice) {
          setViewingInvoice((prev) => {
            if (viewDetailRequestRef.current !== invoiceId) {
              return prev;
            }
            if (!prev) {
              return prev;
            }
            if (invoiceId && prev.id && prev.id !== invoiceId) {
              return prev;
            }
            return detailedInvoice;
          });
        }
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
        } else {
          const message =
            err?.response?.data?.error?.message ||
            err?.message ||
            'Gagal memuat detail invoice penagihan.';
          toastService.error(message);
        }
        console.error('Failed to fetch invoice penagihan detail:', err);
      } finally {
        if (viewDetailRequestRef.current === invoiceId) {
          viewDetailRequestRef.current = null;
          setViewDetailLoading(false);
        }
      }
    },
    [handleAuthError]
  );

  const closeViewModal = useCallback(() => {
    viewDetailRequestRef.current = null;
    setViewingInvoice(null);
    setShowViewModal(false);
    setViewDetailLoading(false);
  }, []);

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
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['invoicePenagihan'] });
        await refreshActiveTab();
      }
      return createdInvoice;
    },
    [createInvoice, refreshActiveTab, setInvoicePenagihan, queryClient]
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
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['invoicePenagihan'] });
        await refreshActiveTab();
      }
      return updatedInvoice;
    },
    [refreshActiveTab, setInvoicePenagihan, updateInvoice, queryClient]
  );

  const handleDeleteConfirm = useCallback(async () => {
    await confirmDelete();
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ['invoicePenagihan'] });
    await refreshActiveTab();
  }, [confirmDelete, refreshActiveTab, queryClient]);

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

          {/* Search is now integrated in the server-side table */}
          {/* <InvoicePenagihanSearch
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            onReset={handleReset}
            loading={Boolean(searchLoading || tableLoading)}
          /> */}

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

          <InvoicePenagihanTableServerSide
            onView={openViewModal}
            onEdit={openEditModal}
            onDelete={showDeleteConfirmation}
            onGenerateKwitansi={openGenerateKwitansiDialog}
            generatingInvoiceId={generatingInvoiceId}
            onGenerateTandaTerimaFaktur={openGenerateTtfDialog}
            generatingTandaTerimaInvoiceId={generatingTtfInvoiceId}
            onGenerateFakturPajak={openGenerateFakturDialog}
            generatingFakturInvoiceId={generatingFakturInvoiceId}
            deleteLoading={deleteDialogLoading}
            initialPage={1}
            initialLimit={10}
            activeTab={activeTab}
          />
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
        isLoading={viewDetailLoading}
      />

      <ConfirmationDialog
        show={generateKwitansiConfirmation.show}
        onClose={closeGenerateKwitansiDialog}
        onConfirm={handleGenerateKwitansiConfirm}
        title='Generate Kwitansi'
        message={
          generateKwitansiDialogInvoice
            ? `Apakah Anda yakin ingin membuat kwitansi untuk invoice ${generateKwitansiDialogInvoice.no_invoice_penagihan || generateKwitansiDialogInvoice.id || ''}?`
            : 'Apakah Anda yakin ingin membuat kwitansi untuk invoice ini?'
        }
        confirmText='Ya, buat kwitansi'
        cancelText='Batal'
        type='warning'
        loading={generateKwitansiDialogLoading}
      />

      <ConfirmationDialog
        show={generateTtfConfirmation.show}
        onClose={closeGenerateTtfDialog}
        onConfirm={handleGenerateTtfConfirm}
        title='Generate Tanda Terima Faktur'
        message={
          generateTtfDialogInvoice
            ? `Apakah Anda yakin ingin membuat tanda terima faktur untuk invoice ${
                generateTtfDialogInvoice.no_invoice_penagihan ||
                generateTtfDialogInvoice.id ||
                ''
              }?`
            : 'Apakah Anda yakin ingin membuat tanda terima faktur untuk invoice ini?'
        }
        confirmText='Ya, buat tanda terima'
        cancelText='Batal'
        type='warning'
        loading={generateTtfDialogLoading}
      />

      <ConfirmationDialog
        show={generateFakturConfirmation.show}
        onClose={closeGenerateFakturDialog}
        onConfirm={handleGenerateFakturConfirm}
        title='Generate Faktur Pajak'
        message={
          generateFakturDialogInvoice
            ? `Apakah Anda yakin ingin membuat faktur pajak untuk invoice ${generateFakturDialogInvoice.no_invoice_penagihan || generateFakturDialogInvoice.id || ''}?`
            : 'Apakah Anda yakin ingin membuat faktur pajak untuk invoice ini?'
        }
        confirmText='Ya, buat faktur pajak'
        cancelText='Batal'
        type='warning'
        loading={generateFakturDialogLoading}
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
