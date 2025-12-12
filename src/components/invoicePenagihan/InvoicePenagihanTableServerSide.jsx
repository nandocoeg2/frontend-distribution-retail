import React, { useMemo, useState, useEffect } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { PencilIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useInvoicePenagihanQuery } from '../../hooks/useInvoicePenagihanQuery';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import groupCustomerService from '../../services/groupCustomerService';

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

const STATUS_OPTIONS = [
  { id: 'PENDING INVOICE PENAGIHAN', name: 'Pending' },
  { id: 'PROCESSING INVOICE PENAGIHAN', name: 'Processing' },
  { id: 'PAID INVOICE PENAGIHAN', name: 'Paid' },
  { id: 'OVERDUE INVOICE PENAGIHAN', name: 'Overdue' },
  { id: 'COMPLETED INVOICE PENAGIHAN', name: 'Completed' },
  { id: 'CANCELLED INVOICE PENAGIHAN', name: 'Cancelled' },
];

// Helper function to check if cancel is allowed
const isCancelAllowed = (invoice) => {
  if (!invoice?.status) {
    return false;
  }

  const normalize = (value) => {
    if (!value) {
      return '';
    }
    return value.toString().trim().toLowerCase().replace(/_/g, ' ');
  };

  const normalizedCode = normalize(invoice.status.status_code);
  const normalizedName = normalize(invoice.status.status_name);

  // Cancel NOT allowed for already cancelled or completed invoices
  const disallowedStatuses = ['cancelled invoice penagihan', 'completed invoice penagihan', 'paid invoice penagihan'];

  return !disallowedStatuses.some(s => normalizedCode.includes(s) || normalizedName.includes(s));
};

const InvoicePenagihanTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  onCancel,
  deleteLoading = false,
  cancelLoading = false,
  initialPage = 1,
  initialLimit = 10,
  selectedInvoiceId,
  onRowClick,
}) => {
  const [groupCustomers, setGroupCustomers] = useState([]);

  useEffect(() => {
    const fetchGroupCustomers = async () => {
      try {
        const response = await groupCustomerService.getAllGroupCustomers(1, 100);
        const data = response?.data?.data || response?.data || [];
        setGroupCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch group customers:', error);
      }
    };
    fetchGroupCustomers();
  }, []);

  const getQueryParams = useMemo(
    () => ({ filters, ...rest }) => {
      const mappedFilters = { ...filters };

      // Handle date range
      if (mappedFilters.tanggal) {
        if (mappedFilters.tanggal.from) mappedFilters.tanggal_start = mappedFilters.tanggal.from;
        if (mappedFilters.tanggal.to) mappedFilters.tanggal_end = mappedFilters.tanggal.to;
        delete mappedFilters.tanggal;
      }

      // Handle grand total range
      if (mappedFilters.grand_total) {
        if (mappedFilters.grand_total.min) mappedFilters.grand_total_min = mappedFilters.grand_total.min;
        if (mappedFilters.grand_total.max) mappedFilters.grand_total_max = mappedFilters.grand_total.max;
        delete mappedFilters.grand_total;
      }

      // Handle status codes array
      if (mappedFilters.status_codes) {
        if (Array.isArray(mappedFilters.status_codes) && mappedFilters.status_codes.length > 0) {
          // keep as status_codes
        } else {
          delete mappedFilters.status_codes;
        }
      }

      // Handle group customers array
      if (mappedFilters.group_customers) {
        if (Array.isArray(mappedFilters.group_customers) && mappedFilters.group_customers.length > 0) {
          // keep
        } else {
          delete mappedFilters.group_customers;
        }
      }

      return {
        ...rest,
        filters: mappedFilters,
      };
    },
    []
  );

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
    getQueryParams,
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
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-1">
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
        cell: (info) => (
          <div className="text-xs text-gray-900">
            {formatDate(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      }),

      columnHelper.accessor('purchaseOrder.customer.namaCustomer', {
        id: 'kepada',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Customer</div>
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
          const customer = info.row.original?.purchaseOrder?.customer;
          const customerName = customer?.namaCustomer || '-';
          const customerCode = customer?.kodeCustomer || '-';
          const groupName = customer?.groupCustomer?.nama_group || '';
          return (
            <div>
              <div className="text-xs text-gray-900">{`${customerName} (${customerCode})`}</div>
              {groupName && (
                <div className="text-xs text-gray-500">{groupName}</div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('grand_total', {
        id: 'grand_total',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { min: '', max: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Total</div>
              <div className="flex flex-col gap-0.5">
                <input
                  type="number"
                  value={filterValue.min ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                  placeholder="Min"
                  className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="number"
                  value={filterValue.max ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                  placeholder="Max"
                  className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          );
        },
        cell: (info) => (
          <div className="text-xs text-gray-900">
            {formatCurrency(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      }),
      columnHelper.accessor((row) => row.status?.status_name || row.status?.status_code, {
        id: 'status_codes',
        header: ({ column }) => (
          <div className="space-y-0.5 max-w-[120px]" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Status</div>
            <AutocompleteCheckboxLimitTag
              options={STATUS_OPTIONS}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
              sx={{ minWidth: '100px' }}
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
          const cancelAllowed = isCancelAllowed(invoice);
          return (
            <div className="flex items-center justify-end space-x-1">
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
              {cancelAllowed && onCancel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(invoice.id, invoice.no_invoice_penagihan);
                  }}
                  disabled={cancelLoading}
                  className="p-1 text-orange-600 hover:text-orange-900 disabled:opacity-50"
                  title="Batalkan"
                >
                  <XCircleIcon className="h-4 w-4" />
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
      onCancel,
      deleteLoading,
      cancelLoading,
      setPage,
      groupCustomers,
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
