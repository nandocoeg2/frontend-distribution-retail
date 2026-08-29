import React, { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDownTrayIcon, EyeIcon, PrinterIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import {
  PurchaseOrderTableServerSide,
  AddPurchaseOrderModal,
  PurchaseOrderDetailCard,
  PurchaseOrderExportPreviewModal,
} from '../components/purchaseOrders';
import PdfPreviewModal from '../components/common/PdfPreviewModal';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { useConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { useAlert } from '../components/ui/Alert';
import purchaseOrderService from '../services/purchaseOrderService';
import usePurchaseOrders from '../hooks/usePurchaseOrders';

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
    return 'Ditemukan nomor PO duplikat. Batalkan duplikat (menyisakan data paling awal) lalu lanjutkan proses?';
  }

  const details = groups
    .map((group) => `"${group.poNumber}" (${group.ids.length} data)`)
    .join(', ');

  return `Ditemukan ${groups.length} nomor PO duplikat: ${details}. Apakah Anda ingin membatalkan duplikat (menyisakan data paling awal) lalu melanjutkan proses?`;
};

const PurchaseOrders = () => {
  const queryClient = useQueryClient();
  const {
    createPurchaseOrder,
    getPurchaseOrder,
  } = usePurchaseOrders();

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewHtmlContent, setPreviewHtmlContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [isPreviewPoLoading, setIsPreviewPoLoading] = useState(false);
  const tableRef = useRef(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkCancelling, setBulkCancelling] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  // Bulk Cancel handler
  const handleBulkCancel = useCallback(async () => {
    if (selectedOrders.length === 0) {
      showWarning('Pilih minimal satu purchase order untuk dibatalkan.');
      return;
    }

    const idsSnapshot = [...selectedOrders];

    openConfirmationDialog({
      title: 'Cancel Purchase Orders',
      message: `Apakah Anda yakin ingin membatalkan ${idsSnapshot.length} Purchase Order yang dipilih?`,
      confirmText: 'Cancel',
      cancelText: 'Batal',
      type: 'warning',
    }, async () => {
      setLoading(true);
      setBulkCancelling(true);
      try {
        const result = await purchaseOrderService.bulkCancelPurchaseOrders(idsSnapshot);
        const resultData = result?.data || result;
        
        hideDialog();
        
        const successCount = resultData?.successCount || 0;
        const failedCount = resultData?.failedIds?.length || 0;

        if (successCount > 0 && failedCount === 0) {
          showSuccess(`Berhasil membatalkan ${successCount} purchase order.`);
        } else if (successCount > 0 && failedCount > 0) {
          showWarning(`Berhasil membatalkan ${successCount} purchase order. ${failedCount} gagal dibatalkan.`);
        } else {
          showError(`Gagal membatalkan purchase order.`);
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        setSelectedOrders([]);
      } catch (error) {
        showError(`Gagal membatalkan purchase orders: ${error.message}`);
      } finally {
        setLoading(false);
        setBulkCancelling(false);
      }
    });
  }, [selectedOrders, hideDialog, openConfirmationDialog, setLoading, showError, showSuccess, showWarning, queryClient]);

  // Bulk Delete handler
  const handleBulkDelete = useCallback(async () => {
    if (selectedOrders.length === 0) {
      showWarning('Pilih minimal satu purchase order untuk dihapus.');
      return;
    }

    const idsSnapshot = [...selectedOrders];

    openConfirmationDialog({
      title: 'Hapus Purchase Orders',
      message: `Apakah Anda yakin ingin menghapus ${idsSnapshot.length} Purchase Order yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
    }, async () => {
      setLoading(true);
      setBulkDeleting(true);
      try {
        const result = await purchaseOrderService.bulkDeletePurchaseOrders(idsSnapshot);
        const resultData = result?.data || result;
        
        hideDialog();
        
        const successCount = resultData?.successCount || 0;
        const failedCount = resultData?.failedIds?.length || 0;

        if (successCount > 0 && failedCount === 0) {
          showSuccess(`Berhasil menghapus ${successCount} purchase order.`);
        } else if (successCount > 0 && failedCount > 0) {
          showWarning(`Berhasil menghapus ${successCount} purchase order. ${failedCount} gagal dihapus.`);
        } else {
          showError(`Gagal menghapus purchase order.`);
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        setSelectedOrders([]);
      } catch (error) {
        showError(`Gagal menghapus purchase orders: ${error.message}`);
      } finally {
        setLoading(false);
        setBulkDeleting(false);
      }
    });
  }, [selectedOrders, hideDialog, openConfirmationDialog, setLoading, showError, showSuccess, showWarning, queryClient]);

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

  const handlePreviewExcel = async () => {
    try {
      setIsPreviewModalOpen(true);
      setPreviewLoading(true);
      const filters = tableRef.current?.getFilters() || {};
      const response = await purchaseOrderService.previewExportExcel(filters);
      setPreviewData(response.data || response);
    } catch (err) {
      console.error('Preview export failed:', err);
      showError(err.message || 'Gagal memuat preview data');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExportFromPreview = async () => {
    try {
      const filters = tableRef.current?.getFilters() || {};
      await purchaseOrderService.exportExcel(filters);
      showSuccess('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      showError(err.message || 'Gagal mengexport data');
    }
  };

  // Preview PO in HTML document format (Formulir Pesanan Pembelian)
  const handlePreviewPoHtml = useCallback(async (targetOrderId = null) => {
    let ids = [];
    if (typeof targetOrderId === 'string') {
      ids = [targetOrderId];
    } else if (targetOrderId && targetOrderId.id) {
      ids = [targetOrderId.id];
    } else if (selectedOrders.length > 0) {
      ids = selectedOrders;
    } else if (selectedOrderForDetail?.id) {
      ids = [selectedOrderForDetail.id];
    }

    if (ids.length === 0) {
      showWarning('Pilih minimal satu Purchase Order untuk melihat preview Formulir Pesanan Pembelian.');
      return;
    }

    setIsPreviewPoLoading(true);
    try {
      const activeCompanyId = localStorage.getItem('companyData')
        ? JSON.parse(localStorage.getItem('companyData'))?.id
        : undefined;

      let html = '';
      let title = '';
      let fileName = '';

      if (ids.length === 1) {
        const id = ids[0];
        html = await purchaseOrderService.exportPurchaseOrder(id, activeCompanyId);
        title = `Preview Formulir Purchase Order`;
        fileName = `Purchase_Order_${id}.pdf`;
      } else {
        html = await purchaseOrderService.exportPurchaseOrderBulk(ids, activeCompanyId);
        title = `Preview Formulir Purchase Order Bulk (${ids.length} Dokumen)`;
        fileName = `Purchase_Order_Bulk_${ids.length}_dokumen.pdf`;
      }

      setPreviewHtmlContent(html);
      setPreviewTitle(title);
      setPreviewFileName(fileName);
      setPdfPreviewOpen(true);
    } catch (error) {
      console.error('Failed to preview PO HTML:', error);
      showError(error.message || 'Gagal memuat preview HTML Purchase Order.');
    } finally {
      setIsPreviewPoLoading(false);
    }
  }, [selectedOrders, selectedOrderForDetail, showWarning, showError]);

  // Bulk selection handlers
  const handleSelectionChange = (orderId, checked) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

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

    // Validasi Tanggal Terbit vs Expired PO yang sama di client-side
    const selectedOrdersData = (tableRef.current?.getOrders?.() || []).filter(order => idsSnapshot.includes(order.id));
    const sameDateOrders = selectedOrdersData.filter(order => {
      const startDate = order.tanggal_masuk_po || order.po_date;
      const endDate = order.tanggal_batas_kirim || order.delivery_date;
      if (!startDate || !endDate) return false;
      return new Date(startDate).toISOString().slice(0, 10) === new Date(endDate).toISOString().slice(0, 10);
    });

    if (sameDateOrders.length > 0) {
      const poNumbers = sameDateOrders.map(o => `"${o.po_number}"`).join(', ');
      openConfirmationDialog({
        title: "Peringatan: Tanggal PO & Expired Sama",
        message: `PO berikut: ${poNumbers} memiliki Tanggal Terbit dan Tanggal Expired/Delivery yang sama. PO dengan tanggal yang sama tidak akan diproses.`,
        confirmText: "Mengerti",
        cancelText: "",
        type: "warning"
      }, () => {
        hideDialog();
      });
      return;
    }

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
          confirmText: "Proses",
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
        messageParts.push(`Berhasil membatalkan ${failedCount} purchase order duplikat.`);
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
      title: "Batalkan Duplikat Purchase Order",
      message: formatDuplicateMessage(duplicateGroups),
      confirmText: "Batalkan Duplikat & Proses",
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
        showError(`Gagal membatalkan ${resultData.failedIds.length} purchase order duplikat (${failedIds}). Periksa kembali sebelum melanjutkan.`);
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
        showSuccess(`Berhasil membatalkan ${idsMarkedFailed.length} purchase order duplikat. Tidak ada data tersisa untuk diproses.`);
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
    <div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-3 py-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Purchase Orders</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePreviewPoHtml()}
                disabled={isPreviewPoLoading}
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                title="Preview Formulir Pesanan Pembelian (HTML)"
              >
                {isPreviewPoLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                    Memuat PO...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                    Preview PO
                  </>
                )}
              </button>
              <button
                onClick={handlePreviewExcel}
                disabled={previewLoading}
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {previewLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                    Memuat...
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-4 w-4 mr-1.5" />
                    Preview Excel
                  </>
                )}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
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
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <HeroIcon name='plus' className='w-4 h-4 mr-1.5' />
                Add PO
              </button>
            </div>
          </div>

          {/* TanStack Table with Server-Side Features */}
          <PurchaseOrderTableServerSide
            ref={tableRef}
            onViewDetail={handleViewDetail}
            selectedOrders={selectedOrders}
            onSelectionChange={handleSelectionChange}
            onBulkProcess={handleBulkProcess}
            onBulkCancel={handleBulkCancel}
            onBulkDelete={handleBulkDelete}
            isProcessing={bulkProcessing}
            isCancelling={bulkCancelling}
            isDeleting={bulkDeleting}
            hasSelectedOrders={selectedOrders.length > 0}
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
          createPurchaseOrder={createPurchaseOrder}
        />
      )}

      {isPreviewModalOpen && (
        <PurchaseOrderExportPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          previewData={previewData}
          previewLoading={previewLoading}
          onExport={handleExportFromPreview}
        />
      )}

      <PdfPreviewModal
        isOpen={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        htmlContent={previewHtmlContent}
        title={previewTitle}
        fileName={previewFileName}
      />

      <ConfirmationDialog onConfirm={() => confirmActionRef.current?.()} />
      <AlertComponent />
    </div>
  );
};

export default PurchaseOrders;
