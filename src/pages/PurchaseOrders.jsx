import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import usePurchaseOrders from '../hooks/usePurchaseOrders';
import PurchaseOrderTable from '../components/purchaseOrders/PurchaseOrderTable.jsx';
import PurchaseOrderSearch from '../components/purchaseOrders/PurchaseOrderSearch.jsx';
import AddPurchaseOrderModal from '../components/purchaseOrders/AddPurchaseOrderModal.jsx';
import EditPurchaseOrderModal from '../components/purchaseOrders/EditPurchaseOrderModal.jsx';
import ViewPurchaseOrderModal from '../components/purchaseOrders/ViewPurchaseOrderModal.jsx';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { useConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { useAlert } from '../components/ui/Alert';
import purchaseOrderService from '../services/purchaseOrderService';
import { useNavigate } from 'react-router-dom';
import { TabContainer, Tab, TabContent, TabPanel } from '../components/ui/Tabs';

const PROCESS_STATUS_CODE = 'PROCESSING PURCHASE ORDER';
const FAILED_STATUS_CODE = 'FAILED PURCHASE ORDER';

const extractDuplicateGroups = (failedItems = []) => {
  const groupsMap = new Map();

  failedItems.forEach((item) => {
    if (!item) {
      return;
    }

    const errorText = typeof item.error === 'string' ? item.error.toLowerCase() : '';
    if (!errorText.includes('duplicate')) {
      return;
    }

    const poNumber = item.poNumber || item.po_number || item.po;
    if (!poNumber) {
      return;
    }

    const idSet = groupsMap.get(poNumber) || new Set();
    if (Array.isArray(item.duplicateIds)) {
      item.duplicateIds.filter(Boolean).forEach((id) => idSet.add(id));
    }
    if (item.id) {
      idSet.add(item.id);
    }

    groupsMap.set(poNumber, idSet);
  });

  return Array.from(groupsMap.entries())
    .map(([poNumber, idSet]) => ({
      poNumber,
      ids: Array.from(idSet)
    }))
    .filter((group) => group.ids.length > 1);
};

const formatDuplicateMessage = (groups = []) => {
  if (!groups.length) {
    return 'Ditemukan nomor PO duplikat. Tandai duplikat sebagai FAILED (menyisakan data paling awal) lalu lanjutkan proses?';
  }

  const details = groups
    .map((group) => `"${group.poNumber}" (${group.ids.length} data)`)
    .join(', ');

  return `Ditemukan ${groups.length} nomor PO duplikat: ${details}. Apakah Anda ingin menandai duplikat sebagai FAILED (menyisakan data paling awal) lalu melanjutkan proses?`;
};


const resolveCreatedAtValue = (source) => {
  if (!source) {
    return null;
  }

  if (source.createdAt) {
    return source.createdAt;
  }

  if (source.created_at) {
    return source.created_at;
  }

  const fallbackKey = Object.keys(source).find((key) => {
    return typeof key === 'string' && key.toLowerCase() === 'createdat';
  });

  return fallbackKey ? source[fallbackKey] : null;
};

const PurchaseOrders = () => {
  const {
    purchaseOrders,
    pagination,
    loading,
    error,
    searchLoading,
    searchQuery,
    searchField,
    fetchPurchaseOrders,
    searchPurchaseOrders,
    deletePurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrder,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSearchFieldChange,
  } = usePurchaseOrders();

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [tabLoading, setTabLoading] = useState(false);
  const [tabData, setTabData] = useState([]);
  const [tabPagination, setTabPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    page: 1,
    limit: 10,
    total: 0
  });
  const { showDialog, hideDialog, setLoading, ConfirmationDialog } = useConfirmationDialog();
  const { showSuccess, showError, showWarning, AlertComponent } = useAlert();

  const isSearchActive = useMemo(() => {
    if (searchQuery == null) {
      return false;
    }

    if (searchField === 'statusId') {
      return searchQuery !== '';
    }

    if (typeof searchQuery === 'string') {
      return searchQuery.trim() !== '';
    }

    if (Array.isArray(searchQuery)) {
      return searchQuery.length > 0;
    }

    if (typeof searchQuery === 'number') {
      return !Number.isNaN(searchQuery);
    }

    return Boolean(searchQuery);
  }, [searchField, searchQuery]);

  const tableOrders = isSearchActive ? purchaseOrders : tabData;
  const tablePagination = isSearchActive ? pagination : tabPagination;
  const tableLoading = isSearchActive ? loading : tabLoading;

  const { currentPage: tabCurrentPage, itemsPerPage: tabItemsPerPage } = tabPagination;
  const confirmActionRef = useRef(() => {});

  const openConfirmationDialog = (options, onConfirm) => {
    confirmActionRef.current = onConfirm;
    showDialog(options);
  };
  const navigate = useNavigate();

  // Map tab to status code
  const getStatusCodeForTab = (tab) => {
    const statusMap = {
      'all': null,
      'pending': 'PENDING PURCHASE ORDER',
      'processing': 'PROCESSING PURCHASE ORDER',
      'processed': 'PROCESSED PURCHASE ORDER',
      'completed': 'COMPLETED PURCHASE ORDER',
      'failed': 'FAILED PURCHASE ORDER'
    };
    return statusMap[tab];
  };

  // Fetch data based on active tab
  const fetchDataByTab = useCallback(async (tab = activeTab, page = 1, limit = 10) => {
    setTabLoading(true);
    try {
      const statusCode = getStatusCodeForTab(tab);
      let response;

      if (statusCode === null) {
        // Fetch all purchase orders
        response = await purchaseOrderService.getAllPurchaseOrders(page, limit);
      } else {
        // Fetch by status code
        response = await purchaseOrderService.getPurchaseOrdersByStatus(statusCode, page, limit);
      }

      const rawData = response?.data?.data || response?.data || [];
      const paginationData = response?.data?.pagination || {};

      const currentPage = paginationData.currentPage || paginationData.page || 1;
      const itemsPerPage = paginationData.itemsPerPage || paginationData.limit || 10;
      const totalItems = paginationData.totalItems || paginationData.total || 0;

      const data = Array.isArray(rawData) ? rawData : [];

      setTabData(data);
      setTabPagination({
        currentPage,
        page: currentPage,
        totalPages: paginationData.totalPages || 1,
        totalItems,
        total: totalItems,
        itemsPerPage,
        limit: itemsPerPage
      });

      return data;
    } catch (err) {
      console.error('Error fetching data by tab:', err);
      showError(err.message || 'Failed to fetch purchase orders');
      setTabData([]);
      return [];
    } finally {
      setTabLoading(false);
    }
  }, [activeTab, showError]);

  // This function is now the callback for when the Add modal is finished.
  const handleAddFinished = () => {
    setAddModalOpen(false);
    fetchPurchaseOrders(); // Always refresh the list when the modal closes.
    fetchDataByTab(); // Also refresh tab data
  };

  const handleEditOrder = async (id, formData) => {
    const result = await updatePurchaseOrder(id, formData);
    if (result) {
      setEditModalOpen(false);
      setSelectedOrder(null);
      fetchDataByTab(activeTab, tabPagination.currentPage, tabPagination.itemsPerPage);
    }
  };

  const handleViewOrder = async (order) => {
    setViewModalOpen(true);
    const orderData = await getPurchaseOrder(order.id);
    setSelectedOrder(orderData);
  };

  const handleEditModalOpen = async (order) => {
    setEditModalOpen(true);
    const orderData = await getPurchaseOrder(order.id);
    setSelectedOrder(orderData);
  };

  // Tab change handler
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    setTabPagination(prev => ({ ...prev, currentPage: 1, page: 1 }));
    fetchDataByTab(newTab, 1, tabPagination.itemsPerPage);
  }, [fetchDataByTab, tabPagination.itemsPerPage]);

  // Tab pagination handlers
  const handleTabPageChange = useCallback((page) => {
    fetchDataByTab(activeTab, page, tabPagination.itemsPerPage);
  }, [activeTab, fetchDataByTab, tabPagination.itemsPerPage]);

  const handleTabLimitChange = useCallback((limit) => {
    fetchDataByTab(activeTab, 1, limit);
  }, [activeTab, fetchDataByTab]);

  const handleTablePageChange = useCallback((page) => {
    if (isSearchActive) {
      handlePageChange(page);
    } else {
      handleTabPageChange(page);
    }
  }, [handlePageChange, handleTabPageChange, isSearchActive]);

  const handleTableLimitChange = useCallback((limit) => {
    if (isSearchActive) {
      handleLimitChange(limit);
    } else {
      handleTabLimitChange(limit);
    }
  }, [handleLimitChange, handleTabLimitChange, isSearchActive]);

  const handleDeleteOrder = useCallback(async (id) => {
    const success = await deletePurchaseOrder(id);
    if (success && !isSearchActive) {
      await fetchDataByTab(activeTab, tabCurrentPage, tabItemsPerPage);
    }
    return success;
  }, [deletePurchaseOrder, isSearchActive, fetchDataByTab, activeTab, tabCurrentPage, tabItemsPerPage]);

  // Bulk selection handlers
  const handleSelectionChange = (orderId, checked) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      const allIds = tableOrders.map(order => order.id);
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders([]);
    }
  }, [tableOrders]);

  // Bulk process handlers
  const handleBulkProcess = () => {
    if (selectedOrders.length === 0) {
      showWarning('Pilih minimal satu purchase order untuk diproses.');
      return;
    }

    const idsSnapshot = [...selectedOrders];

    openConfirmationDialog({
      title: "Proses Purchase Orders",
      message: `Apakah Anda yakin ingin memproses ${idsSnapshot.length} purchase order yang dipilih?`,
      confirmText: "Proses",
      cancelText: "Batal",
      type: "warning"
    }, () => handleConfirmBulkProcess(idsSnapshot));
  };

  const handleConfirmBulkProcess = async (ids = [], options = {}) => {
    const { failedCount = 0 } = options;

    if (!ids.length) {
      showWarning('Tidak ada purchase order yang diproses.');
      hideDialog();
      return;
    }

    setLoading(true);
    setBulkProcessing(true);

    try {
      const result = await purchaseOrderService.processPurchaseOrder(ids, PROCESS_STATUS_CODE);

      if (!result.success) {
        throw new Error('Failed to process purchase orders');
      }

      const duplicateGroups = extractDuplicateGroups(result.data?.failed);

      if (duplicateGroups.length > 0) {
        promptDuplicateCleanup(duplicateGroups, ids, { failedCount });
        return;
      }

      const successCount = result.data?.success?.length || 0;
      const failedCountFromResult = result.data?.failed?.length || 0;

      const messageParts = [];

      if (failedCount > 0) {
        messageParts.push(`Berhasil mengupdate ${failedCount} purchase order duplikat menjadi FAILED.`);
      }

      messageParts.push(`Berhasil memproses ${successCount} purchase order.`);

      if (failedCountFromResult > 0) {
        messageParts.push(`${failedCountFromResult} purchase order gagal diproses.`);
      }

      showSuccess(messageParts.join(' '));

      await fetchPurchaseOrders();
      await fetchDataByTab(activeTab, tabPagination.currentPage, tabPagination.itemsPerPage);
      setSelectedOrders([]);
      hideDialog();
    } catch (error) {
      console.error('Error processing purchase orders:', error);
      showError(`Gagal memproses purchase orders: ${error.message}`);
    } finally {
      setLoading(false);
      setBulkProcessing(false);
    }
  };



  const resolveOrderDetails = async (id) => {
    if (!id) {
      return null;
    }

    const existing = purchaseOrders.find((order) => order.id === id);
    if (existing && (existing.createdAt || existing.created_at)) {
      return existing;
    }

    try {
      const response = await purchaseOrderService.getPurchaseOrderById(id);
      if (response?.data) {
        return response.data?.data || response.data;
      }
      return response;
    } catch (error) {
      console.error(`Failed to fetch purchase order ${id} for duplicate cleanup:`, error);
      return null;
    }
  };

  const determineDeletionTargets = async (groups) => {
    const idsToDeleteSet = new Set();
    const idsToKeepSet = new Set();
    const fetchErrorSet = new Set();

    for (const group of groups) {
      const detailedOrders = await Promise.all(
        group.ids.map(async (id) => {
          const detail = await resolveOrderDetails(id);
          if (!detail) {
            fetchErrorSet.add(id);
          }
          return detail;
        })
      );

      const normalized = detailedOrders
        .map((order, index) => {
          if (!order) {
            return null;
          }

          const resolvedId = order.id || order._id || group.ids[index];
          if (!resolvedId) {
            fetchErrorSet.add(group.ids[index]);
            return null;
          }

          const createdAtValue = resolveCreatedAtValue(order);
          const timestamp = createdAtValue ? new Date(createdAtValue).getTime() : NaN;

          return {
            id: resolvedId,
            timestamp: Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER,
          };
        })
        .filter(Boolean);

      if (normalized.length === 0) {
        continue;
      }

      normalized.sort((a, b) => a.timestamp - b.timestamp);
      const keep = normalized[0];
      idsToKeepSet.add(keep.id);

      normalized.slice(1).forEach(({ id }) => {
        idsToDeleteSet.add(id);
      });
    }

    return {
      idsToDelete: Array.from(idsToDeleteSet),
      idsToKeep: Array.from(idsToKeepSet),
      fetchErrors: Array.from(fetchErrorSet),
    };
  };

  const promptDuplicateCleanup = (duplicateGroups, ids, options = {}) => {
    const idsSnapshot = [...ids];

    openConfirmationDialog({
      title: "Tandai Duplikat Purchase Order sebagai FAILED",
      message: formatDuplicateMessage(duplicateGroups),
      confirmText: "Tandai FAILED & Proses",
      cancelText: "Batal",
      type: "danger"
    }, () => handleDuplicateCleanup(duplicateGroups, idsSnapshot, options));
  };

  const handleDuplicateCleanup = async (duplicateGroups, originalIds, options = {}) => {
    const currentFailedCount = options.failedCount || 0;

    setLoading(true);
    setBulkProcessing(true);

    try {
      const { idsToDelete, idsToKeep, fetchErrors } = await determineDeletionTargets(duplicateGroups);

      if (fetchErrors.length > 0) {
        showWarning(`Tidak dapat memuat detail untuk ${fetchErrors.length} purchase order duplikat. Data tersebut tidak akan diupdate otomatis.`);
      }

      if (idsToDelete.length === 0) {
        if (fetchErrors.length > 0) {
          showError('Tidak dapat menentukan purchase order duplikat yang akan diupdate. Silakan periksa data secara manual.');
        } else {
          showWarning('Tidak ditemukan purchase order duplikat yang perlu diupdate.');
        }
        hideDialog();
        return;
      }

      const failedUpdates = [];

      // Update status duplikat menjadi FAILED PURCHASE ORDER
      for (const id of idsToDelete) {
        try {
          await purchaseOrderService.updatePurchaseOrder(id, { status_code: FAILED_STATUS_CODE });
        } catch (err) {
          failedUpdates.push({ id, error: err });
          console.error(`Failed to update duplicate purchase order ${id}:`, err);
        }
      }

      if (failedUpdates.length > 0) {
        const failedIds = failedUpdates.map(({ id }) => id).join(', ');
        showError(`Gagal mengupdate ${failedUpdates.length} purchase order duplikat (${failedIds}). Periksa kembali sebelum melanjutkan.`);
        return;
      }

      const failedSet = new Set(idsToDelete);
      setSelectedOrders((prev) => prev.filter((id) => !failedSet.has(id)));

      const idsToProcessSet = new Set((originalIds || []).filter((id) => !failedSet.has(id)));
      idsToKeep.forEach((id) => idsToProcessSet.add(id));

      const idsToProcess = Array.from(idsToProcessSet);

      if (idsToProcess.length === 0) {
        showSuccess(`Berhasil mengupdate ${idsToDelete.length} purchase order duplikat menjadi FAILED. Tidak ada data tersisa untuk diproses.`);
        await fetchPurchaseOrders();
        await fetchDataByTab(activeTab, tabPagination.currentPage, tabPagination.itemsPerPage);
        hideDialog();
        return;
      }

      const totalFailedCount = currentFailedCount + idsToDelete.length;

      await handleConfirmBulkProcess(idsToProcess, { failedCount: totalFailedCount });
    } catch (error) {
      console.error('Error resolving duplicate purchase orders:', error);
      showError(`Gagal menyelesaikan duplikat purchase orders: ${error.message}`);
    } finally {
      setLoading(false);
      setBulkProcessing(false);
    }
  };
  // Fetch data when component mounts
  useEffect(() => {
    fetchDataByTab(activeTab, 1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedOrders([]);
  }, [activeTab]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={() => fetchPurchaseOrders()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Purchase Orders</h3>
            <div className="flex items-center gap-2">
              {selectedOrders.length > 0 && (
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-gray-600">
                    {selectedOrders.length} dipilih
                  </span>
                  <button
                    onClick={handleBulkProcess}
                    disabled={bulkProcessing}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                  >
                    {bulkProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Proses ({selectedOrders.length})
                      </>
                    )}
                  </button>
                </div>
              )}
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Add Purchase Order
              </button>
            </div>
          </div>

          <PurchaseOrderSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChange}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
          />

          {/* Tabs for filtering by status */}
          <div className="mb-4">
            <TabContainer
              activeTab={activeTab}
              onTabChange={handleTabChange}
              variant="underline"
            >
              <Tab
                id="all"
                label="All"
                badge={tabPagination.totalItems}
              />
              <Tab
                id="pending"
                label="Pending"
              />
              <Tab
                id="processing"
                label="Processing"
              />
              <Tab
                id="processed"
                label="Processed"
              />
              <Tab
                id="completed"
                label="Completed"
              />
              <Tab
                id="failed"
                label="Failed"
              />
            </TabContainer>
          </div>

          <PurchaseOrderTable
            orders={tableOrders}
            pagination={tablePagination}
            onPageChange={handleTablePageChange}
            onLimitChange={handleTableLimitChange}
            onView={handleViewOrder}
            onEdit={handleEditModalOpen}
            onDelete={handleDeleteOrder}
            loading={tableLoading}
            selectedOrders={selectedOrders}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
          />
        </div>
      </div>

      {isAddModalOpen && (
        <AddPurchaseOrderModal
          isOpen={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          onFinished={handleAddFinished}
          createPurchaseOrder={createPurchaseOrder}
        />
      )}

      {selectedOrder && isEditModalOpen && (
        <EditPurchaseOrderModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleEditOrder}
          order={selectedOrder}
        />
      )}

      {isViewModalOpen && (
        <ViewPurchaseOrderModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          loading={!selectedOrder}
          onProcessed={() => {
            fetchPurchaseOrders();
            fetchDataByTab(activeTab, tabPagination.currentPage, tabPagination.itemsPerPage);
          }}
        />
      )}

      {/* Bulk Process Confirmation Dialog */}
      <ConfirmationDialog onConfirm={() => confirmActionRef.current?.()} />
      
      {/* Alert Component */}
      <AlertComponent />
    </div>
  );
};

export default PurchaseOrders;
