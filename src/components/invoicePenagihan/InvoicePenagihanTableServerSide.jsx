import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useInvoicePenagihanQuery } from '../../hooks/useInvoicePenagihanQuery';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: { label: 'Pending', statusCode: 'PENDING INVOICE PENAGIHAN' },
  processing: { label: 'Processing', statusCode: 'PROCESSING INVOICE PENAGIHAN' },
  paid: { label: 'Paid', statusCode: 'PAID INVOICE PENAGIHAN' },
  overdue: { label: 'Overdue', statusCode: 'OVERDUE INVOICE PENAGIHAN' },
  completed: { label: 'Completed', statusCode: 'COMPLETED INVOICE PENAGIHAN' },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED INVOICE PENAGIHAN' },
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
  onGenerateKwitansi,
  generatingInvoiceId,
  onGenerateTandaTerimaFaktur,
  generatingTandaTerimaInvoiceId,
  onGenerateFakturPajak,
  generatingFakturInvoiceId,
  deleteLoading = false,
  initialPage = 1,
  initialLimit = 10,
  activeTab = 'all',
  selectedInvoiceId,
  onRowClick,
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
    queryHook: useInvoicePenagihanQuery,
    selectData: (response) => response?.invoices ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    lockedFilters,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_invoice_penagihan', {
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
        cell: (info) => (
          <div className="text-sm font-medium text-gray-900">
            {info.getValue() || '-'}
          </div>
        ),
      }),
      columnHelper.accessor('tanggal', {
        id: 'tanggal',
        header: 'Tanggal',
        cell: (info) => (
          <div className="text-sm text-gray-900">
            {formatDate(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('kepada', {
        id: 'kepada',
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
        cell: (info) => {
          const invoice = info.row.original;
          return (
            <div className="text-sm text-gray-900">
              {info.getValue() || invoice?.purchaseOrder?.customer?.namaCustomer || '-'}
            </div>
          );
        },
      }),
      columnHelper.accessor('grand_total', {
        id: 'grand_total',
        header: 'Grand Total',
        cell: (info) => (
          <div className="text-sm text-gray-900">
            {formatCurrency(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      }),
      columnHelper.accessor((row) => row.status?.status_name || row.status?.status_code, {
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
                  <option value="PENDING INVOICE PENAGIHAN">Pending</option>
                  <option value="PROCESSING INVOICE PENAGIHAN">Processing</option>
                  <option value="PAID INVOICE PENAGIHAN">Paid</option>
                  <option value="OVERDUE INVOICE PENAGIHAN">Overdue</option>
                  <option value="COMPLETED INVOICE PENAGIHAN">Completed</option>
                  <option value="CANCELLED INVOICE PENAGIHAN">Cancelled</option>
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
        id: 'kwitansi',
        header: () => <div className="text-center font-medium">{/* Generate Kwitansi */}Kwitansi</div>,
        cell: ({ row }) => {
          const invoice = row.original;
          const isGenerating = generatingInvoiceId === invoice.id;
          const hasKwitansi = Boolean(invoice?.kwitansiId || invoice?.kwitansi?.id);

          return (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center space-x-2">
                {isGenerating && (
                  <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                )}
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  checked={hasKwitansi}
                  onChange={(event) => {
                    if (event.target.checked && onGenerateKwitansi) {
                      onGenerateKwitansi(invoice);
                    }
                  }}
                  disabled={hasKwitansi || isGenerating}
                />
              </div>
              {invoice?.kwitansi?.no_kwitansi && (
                <span className="text-xs text-gray-500">
                  {invoice.kwitansi.no_kwitansi}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'tandaTerimaFaktur',
        header: () => <div className="text-center font-medium">{/* Generate Tanda Terima Faktur */}Tanda Terima Faktur</div>,
        cell: ({ row }) => {
          const invoice = row.original;
          const isGenerating = generatingTandaTerimaInvoiceId === invoice.id;
          const hasTTF = Boolean(invoice?.tandaTerimaFakturId || invoice?.tandaTerimaFaktur?.id);

          return (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center space-x-2">
                {isGenerating && (
                  <span className="w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
                )}
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                  checked={hasTTF}
                  onChange={(event) => {
                    if (event.target.checked && onGenerateTandaTerimaFaktur) {
                      onGenerateTandaTerimaFaktur(invoice);
                    }
                  }}
                  disabled={hasTTF || isGenerating}
                />
              </div>
              {invoice?.tandaTerimaFaktur?.code_supplier && (
                <span className="text-xs text-gray-500">
                  {invoice.tandaTerimaFaktur.code_supplier}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'fakturPajak',
        header: () => <div className="text-center font-medium">{/* Generate Faktur Pajak */}Faktur Pajak</div>,
        cell: ({ row }) => {
          const invoice = row.original;
          const isGenerating = generatingFakturInvoiceId === invoice.id;
          const hasFaktur = Boolean(invoice?.fakturPajakId || invoice?.fakturPajak?.id);

          return (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center space-x-2">
                {isGenerating && (
                  <span className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                )}
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                  checked={hasFaktur}
                  onChange={(event) => {
                    if (event.target.checked && onGenerateFakturPajak) {
                      onGenerateFakturPajak(invoice);
                    }
                  }}
                  disabled={hasFaktur || isGenerating}
                />
              </div>
              {invoice?.fakturPajak?.no_pajak && (
                <span className="text-xs text-gray-500">
                  {invoice.fakturPajak.no_pajak}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right font-medium">Aksi</div>,
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
                  <PencilIcon className="w-5 h-5" />
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
                  <TrashIcon className="w-5 h-5" />
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
      onGenerateKwitansi,
      onGenerateTandaTerimaFaktur,
      onGenerateFakturPajak,
      generatingInvoiceId,
      generatingTandaTerimaInvoiceId,
      generatingFakturInvoiceId,
      deleteLoading,
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
        wrapperClassName="overflow-x-auto border border-gray-200 rounded-lg"
        tableClassName="min-w-full divide-y divide-gray-200"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
        bodyClassName="bg-white divide-y divide-gray-200"
        rowClassName={(row) => {
          // Add null check for row.original
          if (!row || !row.original) {
            return 'hover:bg-gray-50 cursor-pointer transition-colors';
          }
          const isSelected = selectedInvoiceId === row.original.id;
          return `cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
          }`;
        }}
        onRowClick={(rowData, event) => {
          if (onRowClick) {
            onRowClick(rowData);
          }
        }}
        cellClassName="px-6 py-4 whitespace-nowrap"
        emptyCellClassName="px-6 py-8 text-center text-gray-500"
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
