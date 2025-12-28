import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import {
  PurchaseOrderTableServerSide,
  PurchaseOrderSearch,
  AddPurchaseOrderModal,
  EditPurchaseOrderModal,
  PurchaseOrderDetailCard,
} from '../components/purchaseOrders';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { useConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { useAlert } from '../components/ui/Alert';
import purchaseOrderService from '../services/purchaseOrderService';
import usePurchaseOrders from '../hooks/usePurchaseOrders';

const PROCESS_STATUS_CODE = 'PROCESSING PURCHASE ORDER';
const FAILED_STATUS_CODE = 'FAILED PURCHASE ORDER';
const CANCELED_STATUS_CODE = 'CANCELED PURCHASE ORDER';


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
  const [exportLoading, setExportLoading] = useState(false);
  const tableRef = useRef(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const { showDialog, hideDialog, setLoading, ConfirmationDialog } = useConfirmationDialog();
  const { showSuccess, showError, showWarning, AlertComponent } = useAlert();

  const confirmActionRef = useRef(() => { });

  const openConfirmationDialog = (options, onConfirm) => {
    confirmActionRef.current = onConfirm;
    showDialog(options);
  };

  // This function is now the callback for when the Add modal is finished.
  const handleAddFinished = async () => {
    setAddModalOpen(false);
    // Refetch queries to ensure fresh data is loaded
    await queryClient.refetchQueries({ queryKey: ['purchaseOrders'] });
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

  const handleViewDetail = async (order) => {
    if (selectedOrderForDetail?.id === order.id) {
      // If clicking the same row, close the detail card
      setSelectedOrderForDetail(null);
    } else {
      // Load full order data and show detail card
      const orderData = await getPurchaseOrder(order.id);
      setSelectedOrderForDetail(orderData);
    }
  };

  const handleCloseDetail = () => {
    setSelectedOrderForDetail(null);
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

  const handleCancelOrder = useCallback(async (id, poNumber) => {
    openConfirmationDialog({
      title: 'Cancel Purchase Order',
      message: `Apakah Anda yakin ingin membatalkan Purchase Order "${poNumber}"?`,
      confirmText: 'Confirm',
      cancelText: 'Batal',
      type: 'warning',
    }, async () => {
      setLoading(true);
      setCancelLoading(true);
      try {
        await purchaseOrderService.cancelPurchaseOrder(id);
        hideDialog();
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        showSuccess('Purchase order berhasil dibatalkan');
      } catch (error) {
        showError(`Gagal membatalkan purchase order: ${error.message}`);
      } finally {
        setLoading(false);
        setCancelLoading(false);
      }
    });
  }, [hideDialog, openConfirmationDialog, setLoading, showError, showSuccess, queryClient]);

  const handleExportExcel = async () => {
    openConfirmationDialog({
      title: 'Export Excel',
      message: 'Apakah Anda yakin ingin mengexport data Purchase Order ke Excel sesuai filter yang aktif?',
      confirmText: 'Export',
      cancelText: 'Batal',
      type: 'info'
    }, async () => {
      try {
        setExportLoading(true);
        hideDialog();

        // Get filters from table
        const filters = tableRef.current?.getFilters() || {};

        await purchaseOrderService.exportExcel(filters);
        showSuccess('Data berhasil diexport ke Excel');
      } catch (err) {
        console.error('Export failed:', err);
        showError(err.message || 'Gagal mengexport data');
      } finally {
        setExportLoading(false);
      }
    });
  };

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

  // Validasi harga item - calls backend endpoint for efficient validation
  const validateItemPrices = async (purchaseOrderIds) => {
    try {
      const response = await purchaseOrderService.validateItemPrices(purchaseOrderIds);
      return response?.data?.discrepancies || [];
    } catch (error) {
      console.error('Error validating item prices:', error);
      throw error;
    }
  };

  // Format pesan perbedaan harga
  const formatPriceDiscrepancyMessage = (discrepancies) => {
    if (discrepancies.length === 0) return '';

    const summary = `Ditemukan ${discrepancies.length} item dengan perbedaan harga antara PO dan master data:\n\n`;
    const details = discrepancies.slice(0, 5).map(item => {
      const sourceLabel = item.priceSource === 'scheduled' ? ' (Scheduled)' : ' (Current)';
      return `• ${item.itemName} (${item.plu})\n` +
        `  PO: Rp ${item.poPrice.toLocaleString('id-ID')} | ` +
        `Master: Rp ${item.masterPrice.toLocaleString('id-ID')}${sourceLabel}`;
    }).join('\n\n');

    const more = discrepancies.length > 5 ? `\n\n... dan ${discrepancies.length - 5} item lainnya` : '';

    return summary + details + more + '\n\nApakah Anda yakin ingin melanjutkan proses?';
  };

  // Bulk process handlers
  const handleBulkProcess = async () => {
    if (selectedOrders.length === 0) {
      showWarning('Pilih minimal satu purchase order untuk diproses.');
      return;
    }

    const idsSnapshot = [...selectedOrders];

    // Validasi harga item
    try {
      setLoading(true);
      const priceDiscrepancies = await validateItemPrices(idsSnapshot);
      setLoading(false);

      // Jika ada perbedaan harga, tampilkan konfirmasi
      if (priceDiscrepancies.length > 0) {
        openConfirmationDialog({
          title: "Perbedaan Harga Ditemukan",
          message: formatPriceDiscrepancyMessage(priceDiscrepancies),
          confirmText: "Lanjutkan Proses",
          cancelText: "Batal",
          type: "warning"
        }, () => handleConfirmBulkProcess(idsSnapshot));
      } else {
        // Tidak ada perbedaan, lanjutkan proses
        openConfirmationDialog({
          title: "Proses Purchase Orders",
          message: `Apakah Anda yakin ingin memproses ${idsSnapshot.length} purchase order yang dipilih?`,
          confirmText: "Proses",
          cancelText: "Batal",
          type: "warning"
        }, () => handleConfirmBulkProcess(idsSnapshot));
      }
    } catch (error) {
      setLoading(false);
      showError(`Gagal memvalidasi harga item: ${error.message}`);
    }
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
      // Send duplicate groups directly to backend - backend determines keep/delete
      const bulkResult = await purchaseOrderService.markDuplicatesFailed(duplicateGroups);
      const resultData = bulkResult?.data || bulkResult;

      if (resultData?.failedIds?.length > 0) {
        const maxDisplay = 3;
        const displayIds = resultData.failedIds.slice(0, maxDisplay).join(', ');
        const remaining = resultData.failedIds.length - maxDisplay;
        const failedIds = remaining > 0 ? `${displayIds}, ... dan ${remaining} lainnya` : displayIds;
        showError(`Gagal mengupdate ${resultData.failedIds.length} purchase order duplikat (${failedIds}). Periksa kembali sebelum melanjutkan.`);
        return;
      }

      // Use idsToKeep and idsMarkedFailed from backend response
      const idsMarkedFailed = resultData?.idsMarkedFailed || [];
      const idsToKeep = resultData?.idsToKeep || [];

      const failedSet = new Set(idsMarkedFailed);
      setSelectedOrders((prev) => prev.filter((id) => !failedSet.has(id)));

      const idsToProcessSet = new Set((originalIds || []).filter((id) => !failedSet.has(id)));
      idsToKeep.forEach((id) => idsToProcessSet.add(id));

      const idsToProcess = Array.from(idsToProcessSet);

      if (idsToProcess.length === 0) {
        showSuccess(`Berhasil mengupdate ${idsMarkedFailed.length} purchase order duplikat menjadi FAILED. Tidak ada data tersisa untuk diproses.`);
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        hideDialog();
        return;
      }

      const totalFailedCount = currentFailedCount + idsMarkedFailed.length;

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
    <div className="p-3 space-y-3">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-3 py-3">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Purchase Orders</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className="inline-flex items-center px-2.5 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                    Export Excel
                  </>
                )}
              </button>
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <HeroIcon name='plus' className='w-4 h-4 mr-1' />
                Add PO
              </button>
            </div>
          </div>

          {/* TanStack Table with Server-Side Features */}
          <PurchaseOrderTableServerSide
            ref={tableRef}
            onViewDetail={handleViewDetail}
            onEdit={handleEditModalOpen}
            onDelete={handleDeleteOrder}
            onCancel={handleCancelOrder}
            cancelLoading={cancelLoading}
            selectedOrders={selectedOrders}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
            onBulkProcess={handleBulkProcess}
            isProcessing={bulkProcessing}
            hasSelectedOrders={selectedOrders.length > 0}
            initialPage={1}
            initialLimit={10}
            selectedOrderId={selectedOrderForDetail?.id}
          />
        </div>
      </div>

      {selectedOrderForDetail && (
        <PurchaseOrderDetailCard
          order={selectedOrderForDetail}
          onClose={handleCloseDetail}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] })}
        />
      )}

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

      <ConfirmationDialog onConfirm={() => confirmActionRef.current?.()} />
      <AlertComponent />
    </div>
  );
};

export default PurchaseOrders;
