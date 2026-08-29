import React, { useMemo, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { PencilIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useInvoicePenagihanQuery } from '../../hooks/useInvoicePenagihanQuery';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination, TableFooterCell } from '../table';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import groupCustomerService from '../../services/groupCustomerService';
import authService from '../../services/authService';
import DateFilter from '../common/DateFilter';
import TextColumnFilter from '../common/TextColumnFilter';
import RangeColumnFilter from '../common/RangeColumnFilter';

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

const InvoicePenagihanTableServerSide = forwardRef(({
  selectedInvoices = [],
  onSelectionChange,
  onBulkCancel,
  onBulkDelete,
  isCancelling = false,
  isDeleting = false,
  hasSelectedInvoices = false,
  selectedInvoiceId = null,
  onRowClick,
}, ref) => {
  const companyId = authService.getCompanyData()?.id;
  const [groupCustomers, setGroupCustomers] = useState([]);

  useEffect(() => {
    const fetchGroupCustomers = async () => {
      try {
        const response = await groupCustomerService.getAllGroupCustomers(1, 100, companyId);
        const data = response?.data?.data || response?.data || [];
        setGroupCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch group customers:', error);
      }
    };
    fetchGroupCustomers();
  }, [companyId]);

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
        filters: {
          ...mappedFilters,
          ...(companyId ? { companyId } : {}),
        },
      };
    },
    [companyId]
  );

  const todayStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const initialColumnFilters = useMemo(() => [
    {
      id: 'tanggal',
      value: { from: todayStr, to: todayStr },
    },
  ], [todayStr]);

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
    columnFilters,
  } = useServerSideTable({
    queryHook: useInvoicePenagihanQuery,
    selectData: (response) => response?.invoices ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage: 1,
    initialLimit: 9999,
    initialColumnFilters,
    getQueryParams,
    columnFilterDebounceMs: 0,
    storageKey: 'invoice-penagihan',
  });

  const statusOptions = useMemo(() => {
    const map = new Map();
    (invoices || []).forEach((item) => {
      const code = item.status?.status_code;
      const name = item.status?.status_name || code;
      if (code && !map.has(code)) {
        map.set(code, { id: code, name: name });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'status_codes');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        const fallback = STATUS_OPTIONS.find((s) => s.id === val);
        map.set(val, { id: val, name: fallback?.name || val });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [invoices, columnFilters]);

  const handleSelectAllInternalToggle = useCallback(() => {
    const currentPageInvoiceIds = invoices.map((inv) => inv.id).filter(Boolean);

    const allCurrentPageSelected = currentPageInvoiceIds.every((id) =>
      selectedInvoices.includes(id)
    );

    if (allCurrentPageSelected) {
      currentPageInvoiceIds.forEach((id) => {
        if (selectedInvoices.includes(id) && onSelectionChange) {
          onSelectionChange(id, false);
        }
      });
    } else {
      currentPageInvoiceIds.forEach((id) => {
        if (!selectedInvoices.includes(id) && onSelectionChange) {
          onSelectionChange(id, true);
        }
      });
    }
  }, [invoices, selectedInvoices, onSelectionChange]);

  // Expose getFilters method to parent via ref
  useImperativeHandle(ref, () => ({
    getFilters: () => {
      // Get current column filters from table state
      const columnFilters = tableOptions?.state?.columnFilters || [];
      const filters = {};

      columnFilters.forEach(({ id, value }) => {
        if (value !== undefined && value !== null && value !== '') {
          // Handle special filter formats
          if (id === 'no_invoice_penagihan' && typeof value === 'object') {
            if (value.start) filters.no_invoice_penagihan_start = value.start;
            if (value.end) filters.no_invoice_penagihan_end = value.end;
          } else if (id === 'tanggal' && typeof value === 'object') {
            if (value.from) filters.tanggal_start = value.from;
            if (value.to) filters.tanggal_end = value.to;
          } else if (id === 'grand_total' && typeof value === 'object') {
            if (value.min) filters.grand_total_min = value.min;
            if (value.max) filters.grand_total_max = value.max;
          } else if (id === 'status_codes' && Array.isArray(value) && value.length > 0) {
            filters.status_codes = value;
          } else if (id === 'group_customers' && Array.isArray(value) && value.length > 0) {
            filters.group_customers = value;
          } else {
            filters[id] = value;
          }
        }
      });

      if (companyId) {
        filters.companyId = companyId;
      }

      return filters;
    },
  }));

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        size: 40,
        header: () => {
          const currentPageInvoiceIds = invoices.map((inv) => inv.id).filter(Boolean);

          const isAllSelected =
            invoices.length > 0 &&
            currentPageInvoiceIds.length > 0 &&
            currentPageInvoiceIds.every((id) => selectedInvoices.includes(id));

          const isIndeterminate =
            currentPageInvoiceIds.some((id) => selectedInvoices.includes(id)) &&
            !isAllSelected;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => { if (input) input.indeterminate = isIndeterminate; }}
              onChange={handleSelectAllInternalToggle}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedInvoices.includes(row.original.id)}
            onChange={(e) => onSelectionChange?.(row.original.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('tanggal', {
        id: 'tanggal',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-1">
              <div className="font-medium text-xs">Tanggal</div>
              <div className="flex flex-col gap-0.5">
                <DateFilter
                  value={filterValue.from ?? ''}
                  onChange={(val) => { column.setFilterValue({ ...filterValue, from: val }); setPage(1); }}
                  placeholder="Dari"
                />
                <DateFilter
                  value={filterValue.to ?? ''}
                  onChange={(val) => { column.setFilterValue({ ...filterValue, to: val }); setPage(1); }}
                  placeholder="Sampai"
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
      columnHelper.accessor('no_invoice_penagihan', {
        id: 'no_invoice_penagihan',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">No Invoice</div>
            <TextColumnFilter column={column} placeholder="Filter..." />
          </div>
        ),
        cell: (info) => (
          <div className="text-xs font-medium text-gray-900">
            {info.getValue() || '-'}
          </div>
        ),
      }),
      columnHelper.accessor('purchaseOrder.customer.namaCustomer', {
        id: 'kepada',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Customer</div>
            <TextColumnFilter column={column} placeholder="Filter..." />
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
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">Total</div>
            <RangeColumnFilter column={column} setPage={setPage} />
          </div>
        ),
        cell: (info) => (
          <div className="text-xs text-gray-900">
            {formatCurrency(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor((row) => row.status?.status_name || row.status?.status_code, {
        id: 'status_codes',
        header: ({ column }) => (
          <div className="space-y-0.5 max-w-[120px]" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Status</div>
            <AutocompleteCheckboxLimitTag
              options={statusOptions}
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
            <TextColumnFilter column={column} placeholder="Filter..." />
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
            <TextColumnFilter column={column} placeholder="Filter..." />
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
    ],
    [
      invoices,
      selectedInvoices,
      onSelectionChange,
      setPage,
      statusOptions,
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
      {(hasActiveFilters || hasSelectedInvoices) && (
        <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100">
          {hasSelectedInvoices ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-700">
                {selectedInvoices.length} dipilih
              </span>
              {onBulkCancel && (
                <button
                  onClick={onBulkCancel}
                  disabled={isCancelling || isDeleting}
                  className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white rounded transition-colors ${
                    isCancelling || isDeleting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {isCancelling ? (
                    <>
                      <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Membatalkan...
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </>
                  )}
                </button>
              )}
              {onBulkDelete && (
                <button
                  onClick={onBulkDelete}
                  disabled={isCancelling || isDeleting}
                  className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white rounded transition-colors ${
                    isCancelling || isDeleting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-3.5 w-3.5 mr-1" />
                      Hapus
                    </>
                  )}
                </button>
              )}
            </div>
          ) : <div />}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Reset Filter
            </button>
          )}
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
        wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)]"
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-gray-50 cursor-pointer h-8"
        getRowClassName={({ row }) => {
          if (!row || !row.original) {
            return undefined;
          }
          const isSelected = selectedInvoiceId === row.original.id;
          const isChecked = selectedInvoices.includes(row.original.id);
          if (isSelected) {
            return 'bg-blue-200 border-l-4 border-blue-600 font-medium text-gray-900';
          }
          if (isChecked) {
            return 'bg-emerald-100 border-l-2 border-emerald-500 text-gray-900';
          }
          return undefined;
        }}
        onRowClick={(rowData, event) => {
          if (onRowClick) {
            onRowClick(rowData);
          }
        }}
        selectedRowId={selectedInvoiceId}
        cellClassName="px-2 py-1 whitespace-nowrap text-xs text-gray-900"
        emptyCellClassName="px-2 py-1 text-center text-xs text-gray-500"
        footerRowClassName={`bg-gray-200 font-bold sticky bottom-0 ${(pagination?.totalItems || 0) > 0 ? 'z-10' : 'z-0'}`}
        footerContent={
          <tr>
            {table.getVisibleLeafColumns().map((column) => (
              <td
                key={column.id}
                className="px-2 py-1 text-xs border-t border-gray-300 text-center"
              >
                <TableFooterCell column={column} table={table} />
              </td>
            ))}
          </tr>
        }
      />
    </div>
  );
});

export default InvoicePenagihanTableServerSide;
