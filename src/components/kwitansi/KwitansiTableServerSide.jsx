import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useKwitansiQuery } from '../../hooks/useKwitansiQuery';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: { label: 'Pending', statusCode: 'PENDING KWITANSI' },
  processing: { label: 'Processing', statusCode: 'PROCESSING KWITANSI' },
  paid: { label: 'Paid', statusCode: 'PAID KWITANSI' },
  overdue: { label: 'Overdue', statusCode: 'OVERDUE KWITANSI' },
  completed: { label: 'Completed', statusCode: 'COMPLETED KWITANSI' },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED KWITANSI' },
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('completed') || value.includes('paid')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed') || value.includes('overdue')) {
    return 'danger';
  }

  if (value.includes('processing')) {
    return 'warning';
  }

  if (value.includes('pending')) {
    return 'secondary';
  }

  return 'default';
};

const KwitansiTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  onExport,
  exportingId,
  deleteLoading = false,
  initialPage = 1,
  initialLimit = 10,
  activeTab = 'all',
  onRowClick,
  selectedKwitansiId,
}) => {
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
    data: kwitansis,
    pagination,
    setPage,
    resetFilters,
    hasActiveFilters,
    isLoading,
    error,
    tableOptions,
  } = useServerSideTable({
    queryHook: useKwitansiQuery,
    selectData: (response) => response?.kwitansis ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    lockedFilters,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('invoicePenagihan.no_invoice_penagihan', {
        id: 'no_invoice_penagihan',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">No Invoice</div>
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
      columnHelper.accessor('no_kwitansi', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Kwitansi</div>
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
        cell: (info) => {
          const statusCode = info.row.original?.status?.status_code;
          return (
            <div>
              <div className="text-sm font-medium text-gray-900">
                {info.getValue() || '-'}
              </div>
              {statusCode && (
                <StatusBadge
                  status={statusCode}
                  variant={resolveStatusVariant(statusCode)}
                  size="sm"
                  dot
                />
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('tanggal', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal</div>
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
      columnHelper.accessor('grand_total', {
        header: 'Grand Total',
        cell: (info) => formatCurrency(info.getValue()),
        enableSorting: true,
      }),
      columnHelper.accessor('kepada', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Kepada</div>
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
      columnHelper.accessor((row) => row.invoicePenagihan?.customer?.namaCustomer, {
        id: 'customer_name',
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
              placeholder="Filter customer..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const customer = info.row.original?.invoicePenagihan?.customer;
          return (
            <div>
              <div className="text-sm text-gray-900">{customer?.namaCustomer || '-'}</div>
              {customer?.kodeCustomer && (
                <div className="text-xs text-gray-500">{customer.kodeCustomer}</div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status_code',
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
                  <option value="PENDING KWITANSI">Pending</option>
                  <option value="PROCESSING KWITANSI">Processing</option>
                  <option value="PAID KWITANSI">Paid</option>
                  <option value="OVERDUE KWITANSI">Overdue</option>
                  <option value="COMPLETED KWITANSI">Completed</option>
                  <option value="CANCELLED KWITANSI">Cancelled</option>
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
      columnHelper.accessor('tanggal', {
        id: 'created_at',
        header: 'Dibuat',
        enableSorting: true,
        enableColumnFilter: false,
        cell: (info) => formatDateTime(info.getValue()),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const kwitansi = row.original;
          const isExporting = exportingId === kwitansi.id;

          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(kwitansi);
                }}
                className="text-green-600 hover:text-green-900"
                title="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(kwitansi);
                }}
                disabled={deleteLoading}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hapus"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExport(kwitansi);
                }}
                disabled={isExporting}
                className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export PDF"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [
      kwitansis,
      onEdit,
      onDelete,
      onExport,
      deleteLoading,
      exportingId,
      activeTab,
      setPage,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

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

      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data kwitansi..."
        emptyMessage="Belum ada data kwitansi."
        emptyFilteredMessage="Kwitansi tidak ditemukan."
        tableClassName="min-w-full bg-white border border-gray-200 divide-y divide-gray-200"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-200"
        rowClassName={(row) => {
          // Add null check for row.original
          if (!row || !row.original) {
            return 'hover:bg-gray-50 cursor-pointer transition-colors';
          }
          const isSelected = selectedKwitansiId === row.original.id;
          return `cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
          }`;
        }}
        onRowClick={(rowData, event) => {
          if (onRowClick) {
            onRowClick(rowData);
          }
        }}
        cellClassName="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
        emptyCellClassName="px-6 py-6 text-center text-sm text-gray-500"
      />

      {!isLoading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="kwitansi"
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </div>
  );
};

export default KwitansiTableServerSide;
