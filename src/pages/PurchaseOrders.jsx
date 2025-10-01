import React, { useState, useEffect, useRef } from 'react';
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

const PROCESS_STATUS_CODE = 'PROCESSING PURCHASE ORDER';

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
    return 'Ditemukan nomor PO duplikat. Hapus duplikat (menyisakan data paling awal) lalu lanjutkan proses?';
  }

  const details = groups
    .map((group) => `"${group.poNumber}" (${group.ids.length} data)`)
    .join(', ');

  return `Ditemukan ${groups.length} nomor PO duplikat: ${details}. Apakah Anda ingin menghapus duplikat (menyisakan data paling awal) lalu melanjutkan proses?`;
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
  const { showDialog, hideDialog, setLoading, ConfirmationDialog } = useConfirmationDialog();
  const { showSuccess, showError, showWarning, AlertComponent } = useAlert();
  const confirmActionRef = useRef(() => {});

  const openConfirmationDialog = (options, onConfirm) => {
    confirmActionRef.current = onConfirm;
    showDialog(options);
  };
  const navigate = useNavigate();

  // This function is now the callback for when the Add modal is finished.
  const handleAddFinished = () => {
    setAddModalOpen(false);
    fetchPurchaseOrders(); // Always refresh the list when the modal closes.
  };

  const handleEditOrder = async (id, formData) => {
    const result = await updatePurchaseOrder(id, formData);
    if (result) {
      setEditModalOpen(false);
      setSelectedOrder(null);
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

  // Bulk selection handlers
  const handleSelectionChange = (orderId, checked) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = purchaseOrders.map(order => order.id);
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders([]);
    }
  };

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
    const { deletionCount = 0 } = options;

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
        promptDuplicateCleanup(duplicateGroups, ids, { deletionCount });
        return;
      }

      const successCount = result.data?.success?.length || 0;
      const failedCount = result.data?.failed?.length || 0;

      const messageParts = [];

      if (deletionCount > 0) {
        messageParts.push(`Berhasil menghapus ${deletionCount} purchase order duplikat.`);
      }

      messageParts.push(`Berhasil memproses ${successCount} purchase order.`);

      if (failedCount > 0) {
        messageParts.push(`${failedCount} purchase order gagal diproses.`);
      }

      showSuccess(messageParts.join(' '));

      await fetchPurchaseOrders();
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
      title: "Hapus Duplikat Purchase Order",
      message: formatDuplicateMessage(duplicateGroups),
      confirmText: "Hapus & Proses",
      cancelText: "Batal",
      type: "danger"
    }, () => handleDuplicateCleanup(duplicateGroups, idsSnapshot, options));
  };

  const handleDuplicateCleanup = async (duplicateGroups, originalIds, options = {}) => {
    const currentDeletionCount = options.deletionCount || 0;

    setLoading(true);
    setBulkProcessing(true);

    try {
      const { idsToDelete, idsToKeep, fetchErrors } = await determineDeletionTargets(duplicateGroups);

      if (fetchErrors.length > 0) {
        showWarning(`Tidak dapat memuat detail untuk ${fetchErrors.length} purchase order duplikat. Data tersebut tidak akan dihapus otomatis.`);
      }

      if (idsToDelete.length === 0) {
        if (fetchErrors.length > 0) {
          showError('Tidak dapat menentukan purchase order duplikat yang akan dihapus. Silakan periksa data secara manual.');
        } else {
          showWarning('Tidak ditemukan purchase order duplikat yang perlu dihapus.');
        }
        hideDialog();
        return;
      }

      const failedDeletes = [];

      for (const id of idsToDelete) {
        try {
          await purchaseOrderService.deletePurchaseOrder(id);
        } catch (err) {
          failedDeletes.push({ id, error: err });
          console.error(`Failed to delete duplicate purchase order ${id}:`, err);
        }
      }

      if (failedDeletes.length > 0) {
        const failedIds = failedDeletes.map(({ id }) => id).join(', ');
        showError(`Gagal menghapus ${failedDeletes.length} purchase order duplikat (${failedIds}). Periksa kembali sebelum melanjutkan.`);
        return;
      }

      const deletedSet = new Set(idsToDelete);
      setSelectedOrders((prev) => prev.filter((id) => !deletedSet.has(id)));

      const idsToProcessSet = new Set((originalIds || []).filter((id) => !deletedSet.has(id)));
      idsToKeep.forEach((id) => idsToProcessSet.add(id));

      const idsToProcess = Array.from(idsToProcessSet);

      if (idsToProcess.length === 0) {
        showSuccess(`Berhasil menghapus ${idsToDelete.length} purchase order duplikat. Tidak ada data tersisa untuk diproses.`);
        await fetchPurchaseOrders();
        hideDialog();
        return;
      }

      const totalDeletionCount = currentDeletionCount + idsToDelete.length;

      await handleConfirmBulkProcess(idsToProcess, { deletionCount: totalDeletionCount });
    } catch (error) {
      console.error('Error resolving duplicate purchase orders:', error);
      showError(`Gagal menyelesaikan duplikat purchase orders: ${error.message}`);
    } finally {
      setLoading(false);
      setBulkProcessing(false);
    }
  };
  // Clear selection when data changes
  useEffect(() => {
    setSelectedOrders([]);
  }, [purchaseOrders]);

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

          <PurchaseOrderTable
            orders={purchaseOrders}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onView={handleViewOrder}
            onEdit={handleEditModalOpen}
            onDelete={deletePurchaseOrder}
            loading={loading}
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
