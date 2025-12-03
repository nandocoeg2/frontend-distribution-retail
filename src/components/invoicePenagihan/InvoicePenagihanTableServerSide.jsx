import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useInvoicePenagihanQuery } from '../../hooks/useInvoicePenagihanQuery';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

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

  if (value.includes('processed')) {
    return 'primary';
  }

  if (value.includes('processing')) {
    return 'warning';
  }

  if (value.includes('pending')) {
    return 'secondary';
  }

  return 'default';
};

const InvoicePenagihanTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
  initialPage = 1,
  initialLimit = 10,
  selectedInvoiceId,
  onRowClick,
}) => {

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
    queryHook: useInvoicePenagihanQuery,
    selectData: (response) => response?.invoices ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_invoice_penagihan', {
        id: 'no_invoice_penagihan',
        header: ({ column }) => {
          const filterValue = column.getFilterValue();
          const startValue = (typeof filterValue === 'object' && filterValue?.start) || '';
          const endValue = (typeof filterValue === 'object' && filterValue?.end) || '';

          return (
            <div className="space-y-1">
              <div className="font-medium text-xs">No Invoice</div>
              <input
                type="text"
                value={startValue}
                onChange={(event) => {
                  const newValue = event.target.value;
                  const currentFilter = column.getFilterValue() || {};
                  const newFilterValue = {
                    start: newValue,
                    end: (typeof currentFilter === 'object' && currentFilter.end) || '',
                  };
                  // Set to undefined if both are empty to clear the filter
                  column.setFilterValue(
                    !newFilterValue.start && !newFilterValue.end ? undefined : newFilterValue
                  );
                  setPage(1);
                }}
                placeholder="Filter Start..."
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(event) => event.stopPropagation()}
              />
              <input
                type="text"
                value={endValue}
                onChange={(event) => {
                  const newValue = event.target.value;
                  const currentFilter = column.getFilterValue() || {};
                  const newFilterValue = {
                    start: (typeof currentFilter === 'object' && currentFilter.start) || '',
                    end: newValue,
                  };
                  // Set to undefined if both are empty to clear the filter
                  column.setFilterValue(
                    !newFilterValue.start && !newFilterValue.end ? undefined : newFilterValue
                  );
                  setPage(1);
                }}
                placeholder="Filter End..."
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          );
        },
        cell: (info) => (
          <div className="text-xs font-medium text-gray-900">
            {info.getValue() || '-'}
          </div>
        ),
      }),
      columnHelper.accessor('tanggal', {
        id: 'tanggal',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Tanggal</div>
            {/* date picker */}
            <input
              type="date"
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
          <div className="text-xs text-gray-900">
            {formatDate(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('purchaseOrder.customer.groupCustomer.nama_group', {
        id: 'group_customer',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Group</div>
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
          <div className="text-xs text-gray-900">
            {info.getValue() || '-'}
          </div>
        ),
      }),
      columnHelper.accessor('kepada', {
        id: 'kepada',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Kepada</div>
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
          <div className="text-xs text-gray-900">
            {info.getValue() || '-'}
          </div>
        ),
      }),
      columnHelper.accessor('grand_total', {
        id: 'grand_total',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Total</div>
            {/* amount filter, cannot be negative */}
            <input
              type="number"
              min="0"
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
          <div className="text-xs text-gray-900">
            {formatCurrency(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      }),
      columnHelper.accessor((row) => row.status?.status_name || row.status?.status_code, {
        id: 'status_code',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Status</div>
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
              <option value="PENDING INVOICE PENAGIHAN">Pending</option>
              <option value="PROCESSING INVOICE PENAGIHAN">Processing</option>
              <option value="PAID INVOICE PENAGIHAN">Paid</option>
              <option value="OVERDUE INVOICE PENAGIHAN">Overdue</option>
              <option value="COMPLETED INVOICE PENAGIHAN">Completed</option>
              <option value="CANCELLED INVOICE PENAGIHAN">Cancelled</option>
            </select>
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
      columnHelper.display({
        id: 'kwitansi',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Kwitansi</div>
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
        cell: ({ row }) => {
          const invoice = row.original;
          const hasKwitansi = Boolean(invoice?.kwitansiId || invoice?.kwitansi?.id);

          return (
            <div className="flex flex-col items-center justify-center space-y-1">
              {hasKwitansi && invoice?.kwitansi?.no_kwitansi ? (
                <div className="text-center">
                  <div className="text-xs text-gray-900">
                    {invoice.kwitansi.no_kwitansi}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'fakturPajak',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Faktur Pajak</div>
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
        cell: ({ row }) => {
          const invoice = row.original;
          const hasFaktur = Boolean(invoice?.fakturPajakId || invoice?.fakturPajak?.id);

          return (
            <div className="flex flex-col items-center justify-center space-y-1">
              {hasFaktur && (invoice?.fakturPajak?.no_pajak || invoice?.fakturPajak?.no_faktur_pajak) ? (
                <div className="text-center">
                  <div className="text-xs text-gray-900">
                    {invoice.fakturPajak.no_pajak || invoice.fakturPajak.no_faktur_pajak}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="flex items-center justify-end space-x-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(invoice);
                  }}
                  className="p-1 text-yellow-600 hover:text-yellow-900"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(invoice.id);
                  }}
                  className="p-1 text-red-600 hover:text-red-900"
                  title="Hapus"
                  disabled={deleteLoading}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [
      invoices,
      onView,
      onEdit,
      onDelete,
      deleteLoading,
      setPage,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  const loading = isLoading || isFetching;

  // Calculate accumulated grand total
  const totalGrandTotal = useMemo(() => {
    if (!invoices || invoices.length === 0) return 0;
    return invoices.reduce((sum, invoice) => {
      const grandTotal = parseFloat(invoice.grand_total) || 0;
      return sum + grandTotal;
    }, 0);
  }, [invoices]);

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
        loadingMessage="Memuat data invoice penagihan..."
        emptyMessage="Tidak ada data invoice penagihan."
        emptyFilteredMessage="Tidak ada data yang sesuai dengan pencarian."
        wrapperClassName="overflow-x-auto"
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-gray-50 cursor-pointer h-8"
        getRowClassName={({ row }) => {
          if (!row || !row.original) {
            return undefined;
          }
          if (selectedInvoiceId === row.original.id) {
            return 'bg-blue-50 border-l-4 border-blue-500';
          }
          return undefined;
        }}
        onRowClick={(rowData, event) => {
          if (onRowClick) {
            onRowClick(rowData);
          }
        }}
        cellClassName="px-2 py-1 whitespace-nowrap text-xs text-gray-900"
        emptyCellClassName="px-2 py-1 text-center text-xs text-gray-500"
        footerRowClassName="bg-gray-50 sticky bottom-0"
        footerContent={
          invoices && invoices.length > 0 ? (
            <tr>
              <td className="px-2 py-1.5 text-xs text-gray-500">{invoices.length} invoice</td>
              <td className="px-2 py-1.5"></td>
              <td className="px-2 py-1.5"></td>
              <td className="px-2 py-1.5"></td>
              <td className="px-2 py-1.5 text-xs font-semibold text-gray-900">
                {formatCurrency(totalGrandTotal)}
              </td>
              <td className="px-2 py-1.5"></td>
              <td className="px-2 py-1.5"></td>
              <td className="px-2 py-1.5"></td>
              <td className="px-2 py-1.5"></td>
            </tr>
          ) : null
        }
      />

      {!loading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="invoice penagihan"
          pageSizeOptions={[10, 25, 50, 100]}
          firstLabel="««"
          prevLabel="«"
          nextLabel="»"
          lastLabel="»»"
        />
      )}
    </div>
  );
};

export default InvoicePenagihanTableServerSide;
