import React, { useMemo, useCallback } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { formatDate, resolveStatusVariant } from '../../utils/modalUtils';
import { usePurchaseOrdersQuery } from '../../hooks/usePurchaseOrdersQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null, poType: null },
  pendingManual: { label: 'Pending - Manual', statusCode: 'PENDING PURCHASE ORDER', poType: 'MANUAL' },
  pendingAuto: { label: 'Pending - Auto', statusCode: 'PENDING PURCHASE ORDER', poType: 'AUTO' },
  processing: { label: 'Processing', statusCode: 'PROCESSING PURCHASE ORDER', poType: null },
  processed: { label: 'Processed', statusCode: 'PROCESSED PURCHASE ORDER', poType: null },
  completed: { label: 'Completed', statusCode: 'COMPLETED PURCHASE ORDER', poType: null },
  failed: { label: 'Failed', statusCode: 'FAILED PURCHASE ORDER', poType: null },
};

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

const PurchaseOrderTableServerSide = ({
  onViewDetail,
  onEdit,
  onDelete,
  deleteLoading = false,
  selectedOrders = [],
  onSelectionChange,
  onSelectAll,
  onBulkProcess,
  isProcessing = false,
  hasSelectedOrders = false,
  initialPage = 1,
  initialLimit = 10,
  activeTab = 'all',
  selectedOrderId = null,
}) => {
  const lockedFilters = useMemo(() => {
    const config = TAB_STATUS_CONFIG[activeTab] || {};
    const entries = [];

    if (config.statusCode) {
      entries.push({ id: 'status', value: config.statusCode });
    }

    if (config.poType) {
      entries.push({ id: 'po_type', value: config.poType });
    }

    return entries;
  }, [activeTab]);

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
    lockedFilters,
    getQueryParams,
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
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
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={handleSelectAllInternalToggle}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedOrders.includes(row.original.id)}
            onChange={(event) =>
              onSelectionChange &&
              onSelectionChange(row.original.id, event.target.checked)
            }
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('po_number', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">PO Number</div>
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
            {info.getValue() || 'N/A'}
          </div>
        ),
      }),
      columnHelper.accessor('customer.namaCustomer', {
        id: 'customer',
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
        cell: (info) => {
          const customer = info.row.original.customer;
          return (
            <div>
              <div className="text-sm text-gray-900">
                {customer?.namaCustomer || '-'}
              </div>
              {customer?.kodeCustomer && (
                <div className="text-xs text-gray-500">
                  {customer.kodeCustomer}
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('total_items', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Total Items</div>
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
          <div className="text-sm text-gray-900">
            {info.getValue() || 0}
          </div>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('tanggal_masuk_po', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal Masuk PO</div>
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
        cell: (info) =>
          info.getValue()
            ? formatDate(info.getValue())
            : '-',
      }),
      columnHelper.accessor('delivery_date', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Delivery Date</div>
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
        cell: (info) =>
          info.getValue()
            ? formatDate(info.getValue())
            : '-',
        enableColumnFilter: false,
      }),
      columnHelper.accessor('termOfPayment.kode_top', {
        id: 'top',
        header: 'TOP',
        cell: (info) => {
          const top = info.row.original.termOfPayment;
          return (
            <div>
              <div className="text-sm text-gray-900">
                {top?.kode_top || '-'}
              </div>
              {top?.batas_hari && (
                <div className="text-xs text-gray-500">
                  {top.batas_hari} hari
                </div>
              )}
            </div>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor('po_type', {
        header: ({ column }) => {
          const tabConfig = TAB_STATUS_CONFIG[activeTab];
          const lockedPoType = tabConfig?.poType;
          const isLocked =
            (activeTab === 'pendingManual' || activeTab === 'pendingAuto') &&
            lockedPoType;

          return (
            <div className="space-y-2">
              <div className="font-medium">Type</div>
              {isLocked ? (
                <div className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                  {lockedPoType}
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
                  <option value="MANUAL">MANUAL</option>
                  <option value="AUTO">AUTO</option>
                </select>
              )}
            </div>
          );
        },
        cell: (info) => (
          <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status',
        header: ({ column }) => {
          const tabConfig = TAB_STATUS_CONFIG[activeTab];
          const lockedStatus = tabConfig?.statusCode;
          const isLocked = activeTab !== 'all' && lockedStatus;

          return (
            <div className="space-y-2">
              <div className="font-medium">Status</div>
              {isLocked ? (
                <div className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                  {tabConfig?.label || 'N/A'}
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
                  <option value="PENDING PURCHASE ORDER">Pending</option>
                  <option value="PROCESSING PURCHASE ORDER">Processing</option>
                  <option value="PROCESSED PURCHASE ORDER">Processed</option>
                  <option value="COMPLETED PURCHASE ORDER">Completed</option>
                  <option value="FAILED PURCHASE ORDER">Failed</option>
                </select>
              )}
            </div>
          );
        },
        cell: (info) => {
          const statusName = info.getValue();
          return statusName ? (
            <StatusBadge
              status={statusName}
              variant={resolveStatusVariant(statusName)}
              size="sm"
              dot
            />
          ) : (
            <span className="text-sm text-gray-500">-</span>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const order = row.original;
          const editDisabled = isEditDisabled(order);

          return (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  !editDisabled && onEdit(order);
                }}
                className={`p-1 ${
                  editDisabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-900'
                }`}
                title={
                  editDisabled
                    ? 'Purchase order tidak dapat diedit.'
                    : 'Edit'
                }
                disabled={editDisabled}
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(order.id, order.po_number);
                }}
                disabled={deleteLoading}
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
      orders,
      selectedOrders,
      onSelectionChange,
      handleSelectAllInternalToggle,
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

      {hasSelectedOrders && onBulkProcess && (
        <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-green-900">
              {selectedOrders.length} purchase order dipilih
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onBulkProcess}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Proses ({selectedOrders.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <DataTable
        table={table}
        isLoading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data purchase orders..."
        emptyMessage="Tidak ada data purchase order."
        emptyFilteredMessage="Tidak ada data yang sesuai dengan pencarian."
        wrapperClassName="overflow-x-auto"
        tableClassName="min-w-full bg-white border border-gray-200"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-200"
        rowClassName="hover:bg-gray-50"
        getRowClassName={({ row }) => {
          if (selectedOrderId === row.original.id) {
            return 'bg-blue-50 border-l-4 border-blue-500';
          }
          if (selectedOrders.includes(row.original.id)) {
            return 'bg-green-50';
          }
          return undefined;
        }}
        cellClassName="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
        emptyCellClassName="px-6 py-4 text-center text-gray-500"
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
