import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  LinkIcon,
  LinkSlashIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useLaporanPenerimaanBarangQuery } from '../../hooks/useLaporanPenerimaanBarangQuery';
import { formatDate, formatCurrency } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import AssignPurchaseOrderModal from './AssignPurchaseOrderModal';
import useLaporanPenerimaanBarangOperations from '../../hooks/useLaporanPenerimaanBarangOperations';
import laporanPenerimaanBarangService from '../../services/laporanPenerimaanBarangService';
import toastService from '../../services/toastService';
import statusService from '../../services/statusService';
import customerService from '../../services/customerService';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import authService from '../../services/authService';

const columnHelper = createColumnHelper();

// Grandtotal filter component with local state for onBlur behavior
const GrandTotalFilter = ({ column, label, setPage }) => {
  const filterValue = column.getFilterValue() || { min: '', max: '' };
  const [localMin, setLocalMin] = useState(filterValue.min ?? '');
  const [localMax, setLocalMax] = useState(filterValue.max ?? '');

  useEffect(() => { setLocalMin(filterValue.min ?? ''); }, [filterValue.min]);
  useEffect(() => { setLocalMax(filterValue.max ?? ''); }, [filterValue.max]);

  return (
    <div className="space-y-0.5">
      <div className="font-medium text-xs">{label}</div>
      <div className="flex flex-col gap-0.5">
        <input
          type="number"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onBlur={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); } }}
          placeholder="Min"
          className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
        <input
          type="number"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); } }}
          placeholder="Max"
          className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
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
  onCompleteSelected,
  isCompleting = false,
  hasSelectedReports = false,
  initialPage = 1,
  initialLimit = 10,
  selectedReportId = null,
  onFiltersChange,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLpbForAssign, setSelectedLpbForAssign] = useState(null);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
  const [lpbToUnassign, setLpbToUnassign] = useState(null);
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  const [showUnassignConfirmation, setShowUnassignConfirmation] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lpbStatuses, setLpbStatuses] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Fetch statuses from API
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await statusService.getLaporanPenerimaanBarangStatuses();
        if (response?.data) {
          setLpbStatuses(response.data);
        }
      } catch (error) {
        console.error('Error fetching LPB statuses:', error);
      }
    };
    fetchStatuses();
  }, []);

  // Fetch customers for autocomplete filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllCustomers(1, 100);
        const data = response?.data?.data || response?.data || [];
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  const { isAssigning, isUnassigning, assignPurchaseOrder, unassignPurchaseOrder } =
    useLaporanPenerimaanBarangOperations();

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
    filters,
  } = useServerSideTable({
    queryHook: useLaporanPenerimaanBarangQuery,
    selectData: (response) => response?.reports ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    getQueryParams: useCallback(({ filters, ...rest }) => {
      const companyId = authService.getCompanyData()?.id;
      const mappedFilters = { ...filters };

      if (companyId) {
        mappedFilters.companyId = companyId;
      }

      return {
        ...rest,
        filters: mappedFilters,
      };
    }, []),
  });

  // Notify parent of filter changes for export
  useEffect(() => {
    if (typeof onFiltersChange === 'function') {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

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
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('tanggal_po', {
        id: 'tanggal_po',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Tanggal</div>
              <div className="flex flex-col gap-0.5">
                <input
                  type="date"
                  value={filterValue.from ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, from: e.target.value }); setPage(1); }}
                  className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                  title="Dari tanggal"
                />
                <input
                  type="date"
                  value={filterValue.to ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, to: e.target.value }); setPage(1); }}
                  className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                  title="Sampai tanggal"
                />
              </div>
            </div>
          );
        },
        cell: (info) => <span className="text-xs text-gray-600">{info.getValue() ? formatDate(info.getValue()) : '-'}</span>,
      }),
      columnHelper.accessor('no_lpb', {
        id: 'no_lpb',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">No LPB</div>
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
          <div className="space-y-1">
            <div className="font-medium text-xs">No PO</div>
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
        id: 'customerIds',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Customer</div>
            <AutocompleteCheckboxLimitTag
              options={customers}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="namaCustomer"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className="font-medium truncate">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor((row) => row.purchaseOrder?.invoice?.no_invoice ?? null, {
        id: 'invoice',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Invoice</div>
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
      columnHelper.accessor('status.status_name', {
        id: 'status_codes',
        header: ({ column }) => (
          <div className="space-y-0.5 max-w-[120px]" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Status</div>
            <AutocompleteCheckboxLimitTag
              options={lpbStatuses.map((status) => ({
                id: status.status_code,
                name: status.status_name,
              }))}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="Aktif"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => (
          <StatusBadge
            status={info.getValue() || 'Unknown'}
            variant={resolveStatusVariant(info.getValue())}
            size="sm"
            dot
          />
        ),
      }),
      columnHelper.accessor((row) => row.detailInvoice?.grand_total ?? null, {
        id: 'grandtotal_lpb',
        header: ({ column }) => (
          <GrandTotalFilter column={column} label="Grandtotal LPB" setPage={setPage} />
        ),
        cell: (info) => {
          const value = info.getValue();
          return <span className="font-medium">{value != null ? formatCurrency(value) : '-'}</span>;
        },
      }),
      columnHelper.accessor((row) => row.purchaseOrder?.invoice?.grand_total ?? null, {
        id: 'grandtotal_invoice',
        header: ({ column }) => (
          <GrandTotalFilter column={column} label="Grandtotal Invoice" setPage={setPage} />
        ),
        cell: (info) => {
          const value = info.getValue();
          return <span className="font-medium">{value != null ? formatCurrency(value) : '-'}</span>;
        },
      }),
      columnHelper.display({
        id: 'selisih',
        header: () => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Selisih</div>
          </div>
        ),
        cell: ({ row }) => {
          const grandtotalLpb = parseFloat(row.original?.detailInvoice?.grand_total) || 0;
          const grandtotalInvoice = parseFloat(row.original?.purchaseOrder?.invoice?.grand_total) || 0;
          const selisih = grandtotalLpb - grandtotalInvoice;
          const isNegative = selisih < 0;
          const isPositive = selisih > 0;
          return (
            <span className={`font-medium ${isNegative ? 'text-red-600' : isPositive ? 'text-green-600' : 'text-gray-500'}`}>
              {formatCurrency(selisih)}
            </span>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
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
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(report)}
                className="text-green-600 hover:text-green-900"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              {!hasPurchaseOrder ? (
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(report)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Assign Purchase Order"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUnassignClick(report)}
                  className="text-orange-600 hover:text-orange-900"
                  title="Unassign Purchase Order"
                >
                  <LinkSlashIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => reportId && onDelete(reportId)}
                disabled={deleteLoading || !reportId}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
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
      setPage,
      handleOpenAssignModal,
      handleUnassignClick,
      lpbStatuses,
      customers,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  const actionDisabled = isCompleting;

  return (
    <div className="space-y-2">
      {(hasActiveFilters || hasSelectedReports) && (
        <div className="flex justify-between items-center">
          {hasSelectedReports ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-700">{selectedReports.length} dipilih</span>
              <button onClick={handlePrintSelected} disabled={isPrinting} className="inline-flex items-center px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50">
                <PrinterIcon className="h-3 w-3 mr-1" />{isPrinting ? '...' : 'Print'}
              </button>
              <button onClick={onCompleteSelected} disabled={actionDisabled} className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                <CheckIcon className="h-3 w-3 mr-1" />{isCompleting ? '...' : 'Selesai'}
              </button>
            </div>
          ) : <div />}
          {hasActiveFilters && (
            <button onClick={resetFilters} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50">Reset Filter</button>
          )}
        </div>
      )}

      <div className="min-h-[350px] overflow-visible">
        <DataTable
          table={table}
          isLoading={isLoading}
          error={error}
          hasActiveFilters={hasActiveFilters}
          loadingMessage="Memuat..."
          emptyMessage="Tidak ada data"
          emptyFilteredMessage="Tidak ada data sesuai filter"
          tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed overflow-visible"
          headerRowClassName="bg-gray-50"
          headerCellClassName="px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider overflow-visible"
          bodyClassName="bg-white divide-y divide-gray-100"
          rowClassName="hover:bg-gray-50 cursor-pointer h-7"
          onRowClick={(rowData) => rowData && onView && onView(rowData)}
          getRowClassName={({ row }) => {
            const reportId = resolveReportId(row.original);
            if (reportId === selectedReportId) return 'bg-blue-50 border-l-2 border-blue-500';
            if (reportId && selectedReports.includes(reportId)) return 'bg-green-50';
            return undefined;
          }}
          cellClassName="px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900"
          emptyCellClassName="px-1.5 py-0.5 text-center text-gray-500"
          wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)]"
        />
      </div>

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
