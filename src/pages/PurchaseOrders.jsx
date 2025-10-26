import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  PurchaseOrderTableServerSide,
  PurchaseOrderSearch,
  AddPurchaseOrderModal,
  EditPurchaseOrderModal,
  ViewPurchaseOrderModal,
} from '../components/purchaseOrders';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { useConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { useAlert } from '../components/ui/Alert';
import purchaseOrderService from '../services/purchaseOrderService';
import { TabContainer, Tab } from '../components/ui/Tabs';
import usePurchaseOrders from '../hooks/usePurchaseOrders';

const PROCESS_STATUS_CODE = 'PROCESSING PURCHASE ORDER';
const FAILED_STATUS_CODE = 'FAILED PURCHASE ORDER';

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null, poType: null },
  pendingManual: { label: 'Pending - Manual', statusCode: 'PENDING PURCHASE ORDER', poType: 'MANUAL' },
  pendingAuto: { label: 'Pending - Auto', statusCode: 'PENDING PURCHASE ORDER', poType: 'AUTO' },
  processing: { label: 'Processing', statusCode: 'PROCESSING PURCHASE ORDER', poType: null },
  processed: { label: 'Processed', statusCode: 'PROCESSED PURCHASE ORDER', poType: null },
  completed: { label: 'Completed', statusCode: 'COMPLETED PURCHASE ORDER', poType: null },
  failed: { label: 'Failed', statusCode: 'FAILED PURCHASE ORDER', poType: null },
};

const TAB_ORDER = ['all', 'pendingManual', 'pendingAuto', 'processing', 'processed', 'completed', 'failed'];

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
  const queryClient = useQueryClient();
  const {
    purchaseOrders,
    getPurchaseOrder,
    deletePurchaseOrder,
  } = usePurchaseOrders();

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const { showDialog, hideDialog, setLoading, ConfirmationDialog } = useConfirmationDialog();
  const { showSuccess, showError, showWarning, AlertComponent } = useAlert();

  const confirmActionRef = useRef(() => {});

  const openConfirmationDialog = (options, onConfirm) => {
    confirmActionRef.current = onConfirm;
    showDialog(options);
  };

  // Tab change handler
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    setSelectedOrders([]); // Clear selection when changing tabs
  }, []);

  // This function is now the callback for when the Add modal is finished.
  const handleAddFinished = () => {
    setAddModalOpen(false);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
  };

  const handleEditOrder = async (id, formData) => {
    try {
      await purchaseOrderService.updatePurchaseOrder(id, formData);
      setEditModalOpen(false);
      setSelectedOrder(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      showSuccess('Purchase order updated successfully');
    } catch (error) {
      showError(`Gagal mengupdate purchase order: ${error.message}`);
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

  const handleDeleteOrder = useCallback(async (id, poNumber) => {
    openConfirmationDialog({
      title: 'Hapus Purchase Order',
      message: `Apakah Anda yakin ingin menghapus Purchase Order "${poNumber}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
    }, async () => {
      setLoading(true);
      try {
        await deletePurchaseOrder(id);
        hideDialog();
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        showSuccess('Purchase order deleted successfully');
      } catch (error) {
        showError(`Gagal menghapus purchase order: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  }, [deletePurchaseOrder, hideDialog, openConfirmationDialog, setLoading, showError, showSuccess, queryClient]);

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
      // We'll get all order IDs from the current table view
      // The table component will handle this
      setSelectedOrders([]);
    } else {
      setSelectedOrders([]);
    }
  }, []);

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

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
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
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
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

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Purchase Orders</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Add Purchase Order
              </button>
            </div>
          </div>

          {/* Tabs for filtering by status */}
          <div className="mb-4">
            <TabContainer
              activeTab={activeTab}
              onTabChange={handleTabChange}
              variant="underline"
            >
              {TAB_ORDER.map((tabId) => (
                <Tab
                  key={tabId}
                  id={tabId}
                  label={TAB_STATUS_CONFIG[tabId].label}
                />
              ))}
            </TabContainer>
          </div>

          {/* TanStack Table with Server-Side Features */}
          <PurchaseOrderTableServerSide
            onView={handleViewOrder}
            onEdit={handleEditModalOpen}
            onDelete={handleDeleteOrder}
            selectedOrders={selectedOrders}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
            onBulkProcess={handleBulkProcess}
            isProcessing={bulkProcessing}
            hasSelectedOrders={selectedOrders.length > 0}
            activeTab={activeTab}
            initialPage={1}
            initialLimit={10}
          />
        </div>
      </div>

      {isAddModalOpen && (
        <AddPurchaseOrderModal
          isOpen={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          onFinished={handleAddFinished}
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
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
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
