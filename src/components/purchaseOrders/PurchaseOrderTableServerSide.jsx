import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { PencilIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { formatDate, resolveStatusVariant } from '../../utils/modalUtils';
import { usePurchaseOrdersQuery } from '../../hooks/usePurchaseOrdersQuery';
import { termOfPaymentService } from '../../services/termOfPaymentService';
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

const PurchaseOrderTableServerSide = ({
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
}) => {
  const globalFilterConfig = useMemo(
    () => ({
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    }),
    []
  );

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

  const getQueryParams = useMemo(
    () => ({ filters, ...rest }) => {
      const mappedFilters = { ...filters };

      if (mappedFilters.status) {
        mappedFilters.status_code = mappedFilters.status;
        delete mappedFilters.status;
      }

      if (mappedFilters.customer) {
        mappedFilters.customer_name = mappedFilters.customer;
        delete mappedFilters.customer;
      }

      if (mappedFilters.top) {
        mappedFilters.termin_bayar = mappedFilters.top;
        delete mappedFilters.top;
      }

      return {
        ...rest,
        filters: mappedFilters,
      };
    },
    []
  );

  const [termOfPayments, setTermOfPayments] = useState([]);

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
        size: 100,
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">Customer</div>
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
        cell: (info) => <span className="text-xs truncate">{info.row.original.customer?.namaCustomer || '-'}</span>,
      }),
      columnHelper.accessor('tanggal_masuk_po', {
        size: 90,
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">Tgl Masuk</div>
            <input
              type="date"
              value={column.getFilterValue() ?? ''}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => <span className="text-xs text-gray-600">{info.getValue() ? formatDate(info.getValue()) : '-'}</span>,
      }),
      columnHelper.accessor('delivery_date', {
        size: 70,
        header: () => <div className="font-medium text-xs">Delivery</div>,
        cell: (info) => <span className="text-xs text-gray-600">{info.getValue() ? formatDate(info.getValue()) : '-'}</span>,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('termOfPayment.kode_top', {
        id: 'top',
        size: 50,
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">TOP</div>
            <select
              value={column.getFilterValue() ?? ''}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">All</option>
              {termOfPayments.map((t) => <option key={t.id} value={t.id}>{t.kode_top}</option>)}
            </select>
          </div>
        ),
        cell: (info) => <span className="text-xs">{info.row.original.termOfPayment?.kode_top || '-'}</span>,
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => !filterValue || row.original.termin_bayar === filterValue,
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
        size: 90,
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">Status</div>
            <select
              value={column.getFilterValue() ?? ''}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">All</option>
              <option value="PENDING PURCHASE ORDER">Pending</option>
              <option value="PROCESSING PURCHASE ORDER">Process</option>
              <option value="PROCESSED PURCHASE ORDER">Done</option>
              <option value="COMPLETED PURCHASE ORDER">Complete</option>
              <option value="FAILED PURCHASE ORDER">Failed</option>
              <option value="CANCELED PURCHASE ORDER">Cancel</option>
            </select>
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
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

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
        wrapperClassName="overflow-x-auto"
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
};

export default PurchaseOrderTableServerSide;
