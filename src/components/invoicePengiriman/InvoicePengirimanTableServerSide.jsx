import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useInvoicePengirimanQuery } from '../../hooks/useInvoicePengirimanQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED INVOICE' },
  pending: { label: 'Pending', statusCode: 'PENDING INVOICE' },
  paid: { label: 'Paid', statusCode: 'PAID INVOICE' },
  overdue: { label: 'Overdue', statusCode: 'OVERDUE INVOICE' },
};

const InvoicePengirimanTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
  onTogglePenagihan,
  creatingPenagihanId,
  initialPage = 1,
  initialLimit = 10,
  activeTab = 'all',
}) => {
  const lockedFilters = useMemo(() => {
    const statusCode = TAB_STATUS_CONFIG[activeTab]?.statusCode;
    if (!statusCode || activeTab === 'all') {
      return [];
    }
    return [{ id: 'status', value: statusCode }];
  }, [activeTab]);

  const {
    data: invoices,
    pagination,
    setPage,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    resetFilters,
    tableOptions,
  } = useServerSideTable({
    queryHook: useInvoicePengirimanQuery,
    selectData: (response) => response?.invoicePengiriman ?? [],
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
        id: 'penagihan',
        header: 'Penagihan',
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            {creatingPenagihanId === row.original.id ? (
              <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                checked={Boolean(row.original.invoicePenagihanId)}
                disabled={
                  Boolean(row.original.invoicePenagihanId) ||
                  !onTogglePenagihan
                }
                onChange={() => {
                  if (!row.original.invoicePenagihanId && onTogglePenagihan) {
                    onTogglePenagihan(row.original);
                  }
                }}
              />
            )}
          </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('no_invoice', {
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
        cell: (info) => (
          <div className="font-medium text-gray-900">{info.getValue() || '-'}</div>
        ),
      }),
      columnHelper.accessor('tanggal', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal Invoice</div>
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
      columnHelper.accessor('purchaseOrder.customer.namaCustomer', {
        id: 'nama_customer',
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
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('grand_total', {
        header: 'Jumlah',
        cell: (info) => formatCurrency(info.getValue()),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('statusPembayaran.status_name', {
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
                  <option value="CANCELLED INVOICE">Cancelled</option>
                  <option value="PENDING INVOICE">Pending</option>
                  <option value="PAID INVOICE">Paid</option>
                  <option value="OVERDUE INVOICE">Overdue</option>
                </select>
              )}
            </div>
          );
        },
        cell: (info) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {info.getValue() || 'Unknown'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex space-x-2 justify-center">
            <button
              onClick={() => onView(row.original)}
              className="text-indigo-600 hover:text-indigo-900"
              title="Lihat detail"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onEdit(row.original)}
              className="text-green-600 hover:text-green-900"
              title="Edit"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(row.original.id)}
              disabled={deleteLoading}
              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ),
        enableSorting: false,
      }),
    ],
    [
      invoices,
      onView,
      onEdit,
      onDelete,
      deleteLoading,
      onTogglePenagihan,
      creatingPenagihanId,
      activeTab,
      setPage,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  const loading = isLoading || isFetching;

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
        isLoading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data invoice pengiriman..."
        emptyMessage="Tidak ada data invoice pengiriman."
        emptyFilteredMessage="Tidak ada data yang sesuai dengan pencarian."
        wrapperClassName="overflow-x-auto border border-gray-200 rounded-lg"
        tableClassName="min-w-full bg-white"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="divide-y divide-gray-200"
        rowClassName="hover:bg-gray-50"
        cellClassName="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
        emptyCellClassName="px-6 py-4 text-center text-sm text-gray-500"
      />

      {!loading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="invoice pengiriman"
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </div>
  );
};

export default InvoicePengirimanTableServerSide;
