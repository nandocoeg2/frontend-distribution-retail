import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useLaporanPenerimaanBarangQuery } from '../../hooks/useLaporanPenerimaanBarangQuery';
import { formatDate } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

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
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('complete')) {
    return 'success';
  }

  if (value.includes('failed') || value.includes('error')) {
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
}) => {
  const lockedFilters = useMemo(() => {
    const statusCode = TAB_STATUS_CONFIG[activeTab]?.statusCode;
    if (!statusCode || activeTab === 'all') {
      return [];
    }
    return [{ id: 'status_code', value: statusCode }];
  }, [activeTab]);

  const {
    data: reports,
    pagination,
    setPage,
    resetFilters,
    hasActiveFilters,
    isLoading,
    error,
    tableOptions,
  } = useServerSideTable({
    queryHook: useLaporanPenerimaanBarangQuery,
    selectData: (response) => response?.reports ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: {
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    },
    lockedFilters,
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => {
          const isAllSelected =
            reports.length > 0 && selectedReports.length === reports.length;
          const isIndeterminate =
            selectedReports.length > 0 && selectedReports.length < reports.length;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={onSelectAllReports}
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
              disabled={!reportId}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('purchaseOrder.po_number', {
        id: 'po_number',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">No. PO</div>
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
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('no_lpb', {
        id: 'no_lpb',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">No. LPB</div>
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
        cell: (info) => info.getValue() || '-',
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
      onSelectAllReports,
      onView,
      onEdit,
      onDelete,
      deleteLoading,
      activeTab,
      setPage,
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
        rowClassName="hover:bg-gray-50"
        getRowClassName={({ row }) => {
          const reportId = resolveReportId(row.original);
          return reportId && selectedReports.includes(reportId)
            ? 'bg-blue-50 hover:bg-blue-100'
            : undefined;
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
    </div>
  );
};

export default LaporanPenerimaanBarangTableServerSide;
