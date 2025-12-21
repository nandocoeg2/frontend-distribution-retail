import React, { useMemo, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { PencilIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { formatDate, resolveStatusVariant } from '../../utils/modalUtils';
import { usePurchaseOrdersQuery } from '../../hooks/usePurchaseOrdersQuery';
import { termOfPaymentService } from '../../services/termOfPaymentService';
import customerService from '../../services/customerService';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

const isEditDisabled = (order) => {
  if (!order?.status) {
    return false;
  }

  const normalize = (value) => {
    if (!value) {
      return '';
    }
    return value.toString().trim().toLowerCase().replace(/_/g, ' ');
  };

  const normalizedName = normalize(order.status.status_name);
  const normalizedCode = normalize(order.status.status_code);
  return (
    normalizedName === 'processing purchase order' ||
    normalizedCode === 'processing purchase order' ||
    normalizedName === 'failed purchase order' ||
    normalizedCode === 'failed purchase order' ||
    normalizedName === 'processed purchase order' ||
    normalizedCode === 'processed purchase order' ||
    normalizedName === 'completed purchase order' ||
    normalizedCode === 'completed purchase order'
  );
};

const isCancelAllowed = (order) => {
  if (!order?.status) {
    return false;
  }

  const normalize = (value) => {
    if (!value) {
      return '';
    }
    return value.toString().trim().toLowerCase().replace(/_/g, ' ');
  };

  const normalizedCode = normalize(order.status.status_code);
  // Cancel hanya diizinkan untuk status PROCESSING PURCHASE ORDER
  return normalizedCode === 'processing purchase order';
};

const PurchaseOrderTableServerSide = forwardRef(({
  onViewDetail,
  onEdit,
  onDelete,
  onCancel,
  deleteLoading = false,
  cancelLoading = false,
  selectedOrders = [],
  onSelectionChange,
  onSelectAll,
  onBulkProcess,
  isProcessing = false,
  hasSelectedOrders = false,
  initialPage = 1,
  initialLimit = 10,
  selectedOrderId = null,
}, ref) => {
  const globalFilterConfig = useMemo(
    () => ({
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    }),
    []
  );

  const getQueryParams = useMemo(
    () => ({ filters, ...rest }) => {
      const mappedFilters = { ...filters };

      if (mappedFilters.customer) {
        if (Array.isArray(mappedFilters.customer) && mappedFilters.customer.length > 0) {
          mappedFilters.customerIds = mappedFilters.customer;
        }
        delete mappedFilters.customer;
      }

      if (mappedFilters.top) {
        if (Array.isArray(mappedFilters.top) && mappedFilters.top.length > 0) {
          mappedFilters.termin_bayar_ids = mappedFilters.top;
        }
        delete mappedFilters.top;
      }

      if (mappedFilters.status) {
        if (Array.isArray(mappedFilters.status) && mappedFilters.status.length > 0) {
          mappedFilters.status_codes = mappedFilters.status;
        }
        delete mappedFilters.status;
      }

      if (mappedFilters.tanggal_masuk_po && typeof mappedFilters.tanggal_masuk_po === 'object') {
        if (mappedFilters.tanggal_masuk_po.from) {
          mappedFilters.tanggal_masuk_po_from = mappedFilters.tanggal_masuk_po.from;
        }
        if (mappedFilters.tanggal_masuk_po.to) {
          mappedFilters.tanggal_masuk_po_to = mappedFilters.tanggal_masuk_po.to;
        }
        delete mappedFilters.tanggal_masuk_po;
      }

      if (mappedFilters.delivery_date && typeof mappedFilters.delivery_date === 'object') {
        if (mappedFilters.delivery_date.from) {
          mappedFilters.delivery_date_from = mappedFilters.delivery_date.from;
        }
        if (mappedFilters.delivery_date.to) {
          mappedFilters.delivery_date_to = mappedFilters.delivery_date.to;
        }
        delete mappedFilters.delivery_date;
      }

      return {
        ...rest,
        filters: mappedFilters,
      };
    },
    []
  );

  const {
    data: orders,
    pagination,
    setPage,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    resetFilters,
    tableOptions,
  } = useServerSideTable({
    queryHook: usePurchaseOrdersQuery,
    selectData: (response) => response?.purchaseOrders ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    getQueryParams,
  });

  const handleSelectAllInternalToggle = useCallback(() => {
    const currentPageOrderIds = orders.map((order) => order.id).filter(Boolean);

    const allCurrentPageSelected = currentPageOrderIds.every((id) =>
      selectedOrders.includes(id)
    );

    if (allCurrentPageSelected) {
      // Deselect all on current page
      currentPageOrderIds.forEach((id) => {
        if (selectedOrders.includes(id) && onSelectionChange) {
          onSelectionChange(id, false);
        }
      });
    } else {
      // Select all on current page
      currentPageOrderIds.forEach((id) => {
        if (!selectedOrders.includes(id) && onSelectionChange) {
          onSelectionChange(id, true);
        }
      });
    }
  }, [orders, selectedOrders, onSelectionChange]);

  const [termOfPayments, setTermOfPayments] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Status options for multi-select filter
  const statusOptions = useMemo(() => [
    { id: 'PENDING PURCHASE ORDER', name: 'Pending' },
    { id: 'PROCESSING PURCHASE ORDER', name: 'Processing' },
    { id: 'PROCESSED PURCHASE ORDER', name: 'Processed' },
    { id: 'COMPLETED PURCHASE ORDER', name: 'Complete' },
    { id: 'FAILED PURCHASE ORDER', name: 'Failed' },
    { id: 'CANCELED PURCHASE ORDER', name: 'Canceled' },
  ], []);

  useEffect(() => {
    const fetchTermOfPayments = async () => {
      try {
        const response = await termOfPaymentService.getAllTermOfPayments(1, 100);
        const data = response?.data?.data || response?.data || [];
        setTermOfPayments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch term of payments:', error);
        setTermOfPayments([]);
      }
    };
    fetchTermOfPayments();
  }, []);

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



  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        size: 40,
        header: () => {
          const currentPageOrderIds = orders.map((order) => order.id).filter(Boolean);

          const isAllSelected =
            orders.length > 0 &&
            currentPageOrderIds.length > 0 &&
            currentPageOrderIds.every((id) => selectedOrders.includes(id));

          const isIndeterminate =
            currentPageOrderIds.some((id) => selectedOrders.includes(id)) &&
            !isAllSelected;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => { if (input) input.indeterminate = isIndeterminate; }}
              onChange={handleSelectAllInternalToggle}
              onClick={(e) => e.stopPropagation()}
              className="h-3 w-3 text-blue-600 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedOrders.includes(row.original.id)}
            onChange={(e) => onSelectionChange?.(row.original.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-3 w-3 text-blue-600 border-gray-300 rounded"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('po_number', {
        size: 55,
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">PO#</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="..."
              className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => <span className="text-xs font-medium">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('customer.namaCustomer', {
        id: 'customer',
        size: 160,
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
        cell: (info) => <span className="text-xs truncate">{info.row.original.customer?.namaCustomer || '-'}</span>,
      }),
      columnHelper.accessor('tanggal_masuk_po', {
        size: 110,
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Tgl Masuk</div>
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
      columnHelper.accessor('delivery_date', {
        size: 110,
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Delivery</div>
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
      columnHelper.accessor('termOfPayment.kode_top', {
        id: 'top',
        size: 55,
        header: ({ column }) => (
          <div className="space-y-0.5 max-w-[120px]" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">TOP</div>
            <AutocompleteCheckboxLimitTag
              options={termOfPayments}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="kode_top"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
              sx={{ minWidth: '120px' }}
            />
          </div>
        ),
        cell: (info) => <span className="text-xs">{info.row.original.termOfPayment?.kode_top || '-'}</span>,
        enableColumnFilter: true,
      }),
      columnHelper.accessor('po_type', {
        size: 60,
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">Type</div>
            <select
              value={column.getFilterValue() ?? ''}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">All</option>
              <option value="MANUAL">MAN</option>
              <option value="AUTO">AUTO</option>
            </select>
          </div>
        ),
        cell: (info) => {
          const type = info.getValue();
          return type ? <StatusBadge status={type} variant={type === 'MANUAL' ? 'primary' : 'info'} size="xs" dot /> : <span className="text-xs text-gray-500">-</span>;
        },
        enableSorting: false,
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status',
        size: 85,
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
              sx={{ minWidth: '120px' }}
            />
          </div>
        ),
        cell: (info) => {
          const s = info.getValue();
          return s ? <StatusBadge status={s} variant={resolveStatusVariant(s)} size="xs" dot /> : <span className="text-xs text-gray-500">-</span>;
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        size: 70,
        header: () => <div className="font-medium text-xs">Act</div>,
        cell: ({ row }) => {
          const order = row.original;
          const editDisabled = isEditDisabled(order);
          const cancelAllowed = isCancelAllowed(order);
          return (
            <div className="flex gap-0.5">
              <button type="button" onClick={(e) => { e.stopPropagation(); !editDisabled && onEdit(order); }} className={`p-0.5 ${editDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900'}`} disabled={editDisabled} title="Edit">
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
              {cancelAllowed && onCancel && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onCancel(order.id, order.po_number); }} disabled={cancelLoading} className="p-0.5 text-orange-600 hover:text-orange-900 disabled:opacity-50" title="Cancel">
                  <XCircleIcon className="h-3.5 w-3.5" />
                </button>
              )}
              <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(order.id, order.po_number); }} disabled={deleteLoading} className="p-0.5 text-red-600 hover:text-red-900 disabled:opacity-50" title="Delete">
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [
      orders,
      selectedOrders,
      onSelectionChange,
      handleSelectAllInternalToggle,
      onEdit,
      onDelete,
      onCancel,
      deleteLoading,
      cancelLoading,
      setPage,
      termOfPayments,
      customers,
      statusOptions,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  useImperativeHandle(ref, () => ({
    getFilters: () => {
      const state = table.getState();
      const filters = {};

      // Map column filters
      state.columnFilters.forEach((filter) => {
        filters[filter.id] = filter.value;
      });

      // Add global filter
      if (state.globalFilter) {
        filters.search = state.globalFilter;
      }

      // Convert using getQueryParams logic
      const { filters: mappedFilters } = getQueryParams({ filters });

      return mappedFilters;
    }
  }));

  const loading = isLoading || isFetching;

  return (
    <div className="space-y-2">
      {(hasActiveFilters || hasSelectedOrders) && (
        <div className="flex justify-between items-center">
          {hasSelectedOrders && onBulkProcess ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-700">
                {selectedOrders.length} dipilih
              </span>
              <button
                onClick={onBulkProcess}
                disabled={isProcessing}
                className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? 'Proses...' : `Proses (${selectedOrders.length})`}
              </button>
            </div>
          ) : <div />}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
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
        loadingMessage="Memuat data..."
        emptyMessage="Tidak ada data."
        emptyFilteredMessage="Tidak ada data sesuai filter."
        wrapperClassName="overflow-x-auto overflow-y-visible min-h-[300px]"
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-gray-50 h-7"
        getRowClassName={({ row }) => {
          if (selectedOrderId === row.original.id) return 'bg-blue-50 border-l-2 border-blue-500';
          if (selectedOrders.includes(row.original.id)) return 'bg-green-50';
          return undefined;
        }}
        cellClassName="px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900"
        emptyCellClassName="px-1.5 py-0.5 text-center text-gray-500"
        onRowClick={onViewDetail}
      />

      {!loading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="purchase order"
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </div>
  );
});

PurchaseOrderTableServerSide.displayName = 'PurchaseOrderTableServerSide';

export default PurchaseOrderTableServerSide;
