import React, { useMemo, useState, useCallback } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  CheckIcon,
  LinkIcon,
  LinkSlashIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useLaporanPenerimaanBarangQuery } from '../../hooks/useLaporanPenerimaanBarangQuery';
import { formatDate } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import AssignPurchaseOrderModal from './AssignPurchaseOrderModal';
import useLaporanPenerimaanBarangOperations from '../../hooks/useLaporanPenerimaanBarangOperations';
import laporanPenerimaanBarangService from '../../services/laporanPenerimaanBarangService';
import toastService from '../../services/toastService';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: {
    label: 'Pending',
    statusCode: 'PENDING LAPORAN PENERIMAAN BARANG',
  },
  processing: {
    label: 'Processing',
    statusCode: 'PROCESSING LAPORAN PENERIMAAN BARANG',
  },
  completed: {
    label: 'Completed',
    statusCode: 'COMPLETED LAPORAN PENERIMAAN BARANG',
  },
  failed: {
    label: 'Failed',
    statusCode: 'FAILED LAPORAN PENERIMAAN BARANG',
  },
  failed: {
    label: 'Indikasi Pengganti',
    statusCode: 'INDIKASI PENGGANTI',
  },
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('complete')) {
    return 'success';
  }

  if (value.includes('failed') || value.includes('error') || value.includes('pengganti') || value.includes('indikasi')) {
    return 'danger';
  }

  if (value.includes('processing') || value.includes('in progress')) {
    return 'warning';
  }

  if (value.includes('pending') || value.includes('draft')) {
    return 'secondary';
  }

  return 'default';
};

const resolveReportId = (report) => {
  if (!report) {
    return null;
  }

  return report.id || report.lpbId || report._id || report.uuid || null;
};

const LaporanPenerimaanBarangTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
  selectedReports = [],
  onSelectReport,
  onSelectAllReports,
  onProcessSelected,
  onCompleteSelected,
  isProcessing = false,
  isCompleting = false,
  hasSelectedReports = false,
  initialPage = 1,
  initialLimit = 10,
  activeTab = 'all',
  selectedReportId = null,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLpbForAssign, setSelectedLpbForAssign] = useState(null);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
  const [lpbToUnassign, setLpbToUnassign] = useState(null);
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  const [showUnassignConfirmation, setShowUnassignConfirmation] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { isAssigning, isUnassigning, assignPurchaseOrder, unassignPurchaseOrder } =
    useLaporanPenerimaanBarangOperations();

  const lockedFilters = useMemo(() => {
    const statusCode = TAB_STATUS_CONFIG[activeTab]?.statusCode;
    if (!statusCode || activeTab === 'all') {
      return [];
    }
    return [{ id: 'status_code', value: statusCode }];
  }, [activeTab]);

  const globalFilterConfig = useMemo(
    () => ({
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    }),
    []
  );

  const {
    data: reports,
    pagination,
    setPage,
    resetFilters,
    hasActiveFilters,
    isLoading,
    error,
    tableOptions,
    refetch,
  } = useServerSideTable({
    queryHook: useLaporanPenerimaanBarangQuery,
    selectData: (response) => response?.reports ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    lockedFilters,
  });

  // Handler untuk membuka modal assign
  const handleOpenAssignModal = (report) => {
    setSelectedLpbForAssign(report);
    setShowAssignModal(true);
  };

  // Handler untuk menutup modal assign
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedLpbForAssign(null);
  };

  // Handler untuk proses assign dari modal (sebelum konfirmasi)
  const handleAssignFromModal = (purchaseOrderId) => {
    setShowAssignModal(false);
    setSelectedPurchaseOrderId(purchaseOrderId);
    setShowAssignConfirmation(true);
  };

  // Handler untuk konfirmasi assign
  const handleConfirmAssign = async () => {
    const reportId = resolveReportId(selectedLpbForAssign);
    if (!reportId || !selectedPurchaseOrderId) return;

    try {
      await assignPurchaseOrder(reportId, selectedPurchaseOrderId);
      setShowAssignConfirmation(false);
      setSelectedLpbForAssign(null);
      setSelectedPurchaseOrderId(null);
      // Cache will be automatically invalidated by the mutation
    } catch (error) {
      console.error('Error assigning purchase order:', error);
    }
  };

  // Handler untuk cancel assign confirmation
  const handleCancelAssignConfirmation = () => {
    setShowAssignConfirmation(false);
    setSelectedPurchaseOrderId(null);
  };

  // Handler untuk tombol unassign
  const handleUnassignClick = (report) => {
    setLpbToUnassign(report);
    setShowUnassignConfirmation(true);
  };

  // Handler untuk konfirmasi unassign
  const handleConfirmUnassign = async () => {
    const reportId = resolveReportId(lpbToUnassign);
    if (!reportId) return;

    try {
      await unassignPurchaseOrder(reportId);
      setShowUnassignConfirmation(false);
      setLpbToUnassign(null);
      // Cache will be automatically invalidated by the mutation
    } catch (error) {
      console.error('Error unassigning purchase order:', error);
    }
  };

  // Handler untuk cancel unassign confirmation
  const handleCancelUnassignConfirmation = () => {
    setShowUnassignConfirmation(false);
    setLpbToUnassign(null);
  };

  // Handler untuk print LPB
  const handlePrintSelected = async () => {
    if (!selectedReports || selectedReports.length === 0) {
      toastService.error('Tidak ada laporan yang dipilih');
      return;
    }

    setIsPrinting(true);
    try {
      toastService.info(`Mendownload ${selectedReports.length} file LPB...`);

      let successCount = 0;
      let failCount = 0;

      // Loop through selected reports and download LPB files
      for (let i = 0; i < selectedReports.length; i++) {
        const reportId = selectedReports[i];
        
        try {
          // Get report data to extract no_lpb
          const report = reports.find(r => resolveReportId(r) === reportId);
          const noLpb = report?.no_lpb || reportId;
          
          // Generate current datetime for filename
          const now = new Date();
          const datetime = now.toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .split('.')[0];
          
          const result = await laporanPenerimaanBarangService.exportLPB(reportId);
          
          // Create a URL for the blob
          const blobUrl = window.URL.createObjectURL(result.blob);
          
          // Download file directly (works better in Electron)
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${noLpb}_${datetime}.pdf`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 100);

          successCount++;

          // Small delay between downloads
          if (i < selectedReports.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          failCount++;
          console.error(`Error downloading LPB ${reportId}:`, error);
        }
      }

      if (successCount > 0) {
        toastService.success(
          `Berhasil mendownload ${successCount} file LPB${failCount > 0 ? `. ${failCount} gagal.` : ''}. Silakan buka file untuk print.`
        );
      } else {
        toastService.error('Gagal mendownload file LPB');
      }
    } catch (error) {
      console.error('Error in bulk download LPB:', error);
      toastService.error(error.message || 'Gagal mendownload LPB');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSelectAllInternalToggle = useCallback(() => {
    const currentPageReportIds = reports
      .map((report) => resolveReportId(report))
      .filter(Boolean);
    
    const allCurrentPageSelected = currentPageReportIds.every((id) =>
      selectedReports.includes(id)
    );

    if (allCurrentPageSelected) {
      // Deselect all on current page
      currentPageReportIds.forEach((id) => {
        if (selectedReports.includes(id)) {
          onSelectReport(id, false);
        }
      });
    } else {
      // Select all on current page
      currentPageReportIds.forEach((id) => {
        if (!selectedReports.includes(id)) {
          onSelectReport(id, true);
        }
      });
    }
  }, [reports, selectedReports, onSelectReport]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => {
          const currentPageReportIds = reports
            .map((report) => resolveReportId(report))
            .filter(Boolean);
          
          const isAllSelected =
            reports.length > 0 &&
            currentPageReportIds.length > 0 &&
            currentPageReportIds.every((id) => selectedReports.includes(id));
          
          const isIndeterminate =
            currentPageReportIds.some((id) => selectedReports.includes(id)) &&
            !isAllSelected;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={handleSelectAllInternalToggle}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => {
          const reportId = resolveReportId(row.original);
          return (
            <input
              type="checkbox"
              checked={selectedReports.includes(reportId)}
              onChange={() =>
                onSelectReport(reportId, !selectedReports.includes(reportId))
              }
              onClick={(e) => e.stopPropagation()}
              disabled={!reportId}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('no_lpb', {
        id: 'no_lpb',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">No LPB</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('purchaseOrder.po_number', {
        id: 'po_number',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">No PO</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('customer.namaCustomer', {
        id: 'customer',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Customer</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('purchaseOrder.invoice.no_invoice', {
        id: 'invoice',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Invoice</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('tanggal_po', {
        id: 'tanggal_po',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal LPB</div>
            <input
              type="date"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status',
        header: ({ column }) => {
          const statusConfig = TAB_STATUS_CONFIG[activeTab];
          const isLocked = activeTab !== 'all' && statusConfig?.statusCode;

          return (
            <div className="space-y-2">
              <div className="font-medium">Status</div>
              {isLocked ? (
                <div className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                  {statusConfig?.label || 'N/A'}
                </div>
              ) : (
                <select
                  value={column.getFilterValue() ?? ''}
                  onChange={(event) => {
                    column.setFilterValue(event.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(event) => event.stopPropagation()}
                >
                  <option value="">Semua</option>
                  <option value="PENDING LAPORAN PENERIMAAN BARANG">Pending</option>
                  <option value="PROCESSING LAPORAN PENERIMAAN BARANG">Processing</option>
                  <option value="COMPLETED LAPORAN PENERIMAAN BARANG">Completed</option>
                  <option value="FAILED LAPORAN PENERIMAAN BARANG">Failed</option>
                </select>
              )}
            </div>
          );
        },
        cell: (info) => (
          <StatusBadge
            status={info.getValue() || 'Unknown'}
            variant={resolveStatusVariant(info.getValue())}
            size="sm"
            dot
          />
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const report = row.original;
          const reportId = resolveReportId(report);
          const hasPurchaseOrder = report.purchaseOrderId || report.purchaseOrder;

          return (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => onView(report)}
                className="text-indigo-600 hover:text-indigo-900"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(report)}
                className="text-green-600 hover:text-green-900"
                title="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              {!hasPurchaseOrder ? (
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(report)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Assign Purchase Order"
                >
                  <LinkIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUnassignClick(report)}
                  className="text-orange-600 hover:text-orange-900"
                  title="Unassign Purchase Order"
                >
                  <LinkSlashIcon className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => reportId && onDelete(reportId)}
                disabled={deleteLoading || !reportId}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [
      reports,
      selectedReports,
      onSelectReport,
      handleSelectAllInternalToggle,
      onView,
      onEdit,
      onDelete,
      deleteLoading,
      activeTab,
      setPage,
      handleOpenAssignModal,
      handleUnassignClick,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  const actionDisabled = isProcessing || isCompleting;

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {hasSelectedReports && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedReports.length} laporan dipilih
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintSelected}
              disabled={isPrinting}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>{isPrinting ? 'Mendownload...' : 'Print LPB'}</span>
            </button>
            <button
              onClick={onProcessSelected}
              disabled={actionDisabled}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayIcon className="h-4 w-4" />
              <span>{isProcessing ? 'Memproses...' : 'Proses'}</span>
            </button>
            <button
              onClick={onCompleteSelected}
              disabled={actionDisabled}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              <span>{isCompleting ? 'Menyelesaikan...' : 'Selesaikan'}</span>
            </button>
          </div>
        </div>
      )}

      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data laporan..."
        emptyMessage="Tidak ada data laporan penerimaan barang"
        emptyFilteredMessage="Tidak ada data yang sesuai dengan pencarian"
        tableClassName="min-w-full bg-white border border-gray-200"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-200"
        rowClassName="hover:bg-gray-50 cursor-pointer"
        onRowClick={(rowData) => {
          // rowData is row.original from DataTable
          if (rowData && onView) {
            onView(rowData);
          }
        }}
        getRowClassName={({ row }) => {
          const reportId = resolveReportId(row.original);
          
          if (reportId === selectedReportId) {
            return 'bg-indigo-100 hover:bg-indigo-150 border-l-4 border-indigo-500';
          }
          
          if (reportId && selectedReports.includes(reportId)) {
            return 'bg-blue-50 hover:bg-blue-100';
          }
          
          return undefined;
        }}
        cellClassName="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
        emptyCellClassName="px-6 py-4 text-center text-gray-500"
      />

      {!isLoading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="laporan"
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}

      {/* Assign Purchase Order Modal */}
      <AssignPurchaseOrderModal
        show={showAssignModal}
        onClose={handleCloseAssignModal}
        onAssign={handleAssignFromModal}
        isSubmitting={isAssigning}
        lpbData={selectedLpbForAssign}
      />

      {/* Assign Confirmation Dialog */}
      <ConfirmationDialog
        show={showAssignConfirmation}
        onClose={handleCancelAssignConfirmation}
        onConfirm={handleConfirmAssign}
        title="Konfirmasi Assign Purchase Order"
        message={`Apakah Anda yakin ingin meng-assign Purchase Order ke LPB ${selectedLpbForAssign?.no_lpb || ''}? Data customer, term of payment, dan tanggal PO akan otomatis di-sync dari Purchase Order.`}
        confirmText="Ya, Assign"
        cancelText="Batal"
        type="success"
        loading={isAssigning}
      />

      {/* Unassign Confirmation Dialog */}
      <ConfirmationDialog
        show={showUnassignConfirmation}
        onClose={handleCancelUnassignConfirmation}
        onConfirm={handleConfirmUnassign}
        title="Konfirmasi Unassign Purchase Order"
        message={`Apakah Anda yakin ingin meng-unassign Purchase Order dari LPB ${lpbToUnassign?.no_lpb || ''}? Hubungan dengan Purchase Order akan dilepas.`}
        confirmText="Ya, Unassign"
        cancelText="Batal"
        type="warning"
        loading={isUnassigning}
      />
    </div>
  );
};

export default LaporanPenerimaanBarangTableServerSide;
