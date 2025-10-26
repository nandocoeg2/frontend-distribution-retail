import React, { useMemo, useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { resolveStatusVariant } from '../../utils/modalUtils';
import { usePurchaseOrdersQuery } from '../../hooks/usePurchaseOrdersQuery';

const columnHelper = createColumnHelper();

// Tab to status code mapping
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
  onView,
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
  activeTab = 'all', // Tab aktif untuk lock status filter
}) => {
  // Server-side state
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Debounce global filter
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
      setPage(1); // Reset to page 1 when search changes
    }, 500);

    return () => clearTimeout(timeout);
  }, [globalFilter]);

  // Auto-set status and po_type filters based on active tab
  useEffect(() => {
    const tabConfig = TAB_STATUS_CONFIG[activeTab];
    const tabStatusCode = tabConfig?.statusCode;
    const tabPoType = tabConfig?.poType;
    
    if (activeTab !== 'all') {
      setColumnFilters(prev => {
        let filtered = [...prev];
        
        // Handle status filter - always set for non-"all" tabs
        if (tabStatusCode) {
          const hasStatusFilter = filtered.some(f => f.id === 'status');
          if (!hasStatusFilter || filtered.find(f => f.id === 'status')?.value !== tabStatusCode) {
            filtered = filtered.filter(f => f.id !== 'status');
            filtered.push({ id: 'status', value: tabStatusCode });
          }
        }
        
        // Handle po_type filter - only set for pendingManual and pendingAuto tabs
        if (activeTab === 'pendingManual' || activeTab === 'pendingAuto') {
          if (tabPoType) {
            const hasPoTypeFilter = filtered.some(f => f.id === 'po_type');
            if (!hasPoTypeFilter || filtered.find(f => f.id === 'po_type')?.value !== tabPoType) {
              filtered = filtered.filter(f => f.id !== 'po_type');
              filtered.push({ id: 'po_type', value: tabPoType });
            }
          }
        }
        // For other tabs (processing, processed, completed, failed), don't clear po_type filter
        
        return filtered;
      });
    } else if (activeTab === 'all') {
      // In "All" tab, clear status and po_type filters to show all data
      setColumnFilters(prev => prev.filter(f => f.id !== 'status' && f.id !== 'po_type'));
    }
  }, [activeTab]);

  // Convert columnFilters to backend format
  const filters = useMemo(() => {
    const filterObj = {};
    columnFilters.forEach((filter) => {
      // Map filter IDs to backend parameter names
      if (filter.id === 'status') {
        filterObj['status_code'] = filter.value;
      } else if (filter.id === 'customer') {
        filterObj['customer_name'] = filter.value;
      } else if (filter.id === 'po_type') {
        filterObj['po_type'] = filter.value;
      } else {
        filterObj[filter.id] = filter.value;
      }
    });
    return filterObj;
  }, [columnFilters]);

  // Fetch data from backend
  const { data, isLoading, isFetching, error } = usePurchaseOrdersQuery({
    page,
    limit,
    sorting,
    filters,
    globalFilter: debouncedGlobalFilter,
  });

  const orders = data?.purchaseOrders || [];
  const pagination = data?.pagination || {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => {
          const isAllSelected =
            orders.length > 0 && selectedOrders.length === orders.length;
          const isIndeterminate =
            selectedOrders.length > 0 && selectedOrders.length < orders.length;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={() => onSelectAll && onSelectAll(!isAllSelected)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedOrders.includes(row.original.id)}
            onChange={(e) => onSelectionChange && onSelectionChange(row.original.id, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('po_number', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">PO Number</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1); // Reset to page 1
              }}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
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
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
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
        header: 'Total Items',
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
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => (
          <div className="text-sm text-gray-900">
            {info.getValue()
              ? new Date(info.getValue()).toLocaleDateString('id-ID')
              : '-'}
          </div>
        ),
      }),
      columnHelper.accessor('tanggal_batas_kirim', {
        header: 'Tanggal Batas Kirim',
        cell: (info) => (
          <div className="text-sm text-gray-900">
            {info.getValue()
              ? new Date(info.getValue()).toLocaleDateString('id-ID')
              : '-'}
          </div>
        ),
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
          // Only lock po_type in pendingManual and pendingAuto tabs
          const isLocked = (activeTab === 'pendingManual' || activeTab === 'pendingAuto') && lockedPoType;
          
          return (
            <div className="space-y-2">
              <div className="font-medium">Type</div>
              {isLocked ? (
                // Locked: Show read-only display with the locked value
                <div className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                  {lockedPoType}
                </div>
              ) : (
                // Unlocked: Show dropdown
                <select
                  value={column.getFilterValue() ?? ''}
                  onChange={(e) => {
                    column.setFilterValue(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
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
          <div className="text-sm text-gray-900">
            {info.getValue() || '-'}
          </div>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status',
        header: ({ column }) => {
          const isLocked = activeTab !== 'all';
          const tabConfig = TAB_STATUS_CONFIG[activeTab];
          const lockedStatus = tabConfig?.statusCode;
          
          return (
            <div className="space-y-2">
              <div className="font-medium">Status</div>
              {isLocked && lockedStatus ? (
                // Locked with value: Show read-only display with status label
                <div className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                  {tabConfig?.label || 'N/A'}
                </div>
              ) : isLocked && !lockedStatus ? (
                // Locked without value (shouldn't happen but handle it): Show disabled dropdown
                <select
                  value={column.getFilterValue() ?? ''}
                  disabled
                  className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700 cursor-not-allowed"
                >
                  <option value="">Semua</option>
                  <option value="PENDING PURCHASE ORDER">Pending</option>
                  <option value="PROCESSING PURCHASE ORDER">Processing</option>
                  <option value="PROCESSED PURCHASE ORDER">Processed</option>
                  <option value="COMPLETED PURCHASE ORDER">Completed</option>
                  <option value="FAILED PURCHASE ORDER">Failed</option>
                </select>
              ) : (
                // Unlocked: Show dropdown (only in "All" tab)
                <select
                  value={column.getFilterValue() ?? ''}
                  onChange={(e) => {
                    column.setFilterValue(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
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
                onClick={() => onView(order)}
                className="text-indigo-600 hover:text-indigo-900"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => !editDisabled && onEdit(order)}
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
                onClick={() => onDelete(order.id, order.po_number)}
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
      onSelectAll,
      onView,
      onEdit,
      onDelete,
      deleteLoading,
      activeTab,
    ]
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: pagination.totalPages,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: page - 1, // TanStack uses 0-indexed pages
        pageSize: limit,
      },
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1); // Reset to page 1 when sort changes
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const newPaginationState = typeof updater === 'function' 
        ? updater({ pageIndex: page - 1, pageSize: limit })
        : updater;
      
      setPage(newPaginationState.pageIndex + 1); // Convert back to 1-indexed
      setLimit(newPaginationState.pageSize);
    },
  });

  const hasActiveFilters = globalFilter || columnFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Reset Filter Button (only shown when filters active) */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setGlobalFilter('');
              setColumnFilters([]);
              setPage(1);
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* Bulk Process Button */}
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="w-8 h-8 mr-3 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span>Memuat data purchase orders...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm text-red-800">
            Terjadi kesalahan: {error.message}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-50">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const isSorted = header.column.getIsSorted();

                      return (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
                        >
                          {header.isPlaceholder ? null : (
                            <div className="space-y-2">
                              {canSort ? (
                                <div
                                  className="cursor-pointer select-none flex items-center space-x-1 hover:text-gray-700 font-medium"
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  <span className="flex-1">
                                    {typeof header.column.columnDef.header === 'string'
                                      ? header.column.columnDef.header
                                      : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                        )}
                                  </span>
                                  <span className="text-gray-400">
                                    {isSorted === 'asc' ? (
                                      <ArrowUpIcon className="h-4 w-4" />
                                    ) : isSorted === 'desc' ? (
                                      <ArrowDownIcon className="h-4 w-4" />
                                    ) : (
                                      <span className="opacity-50">⇅</span>
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <div className="font-medium">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {hasActiveFilters
                        ? 'Tidak ada data yang sesuai dengan pencarian'
                        : 'Tidak ada data purchase orders'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        selectedOrders.includes(row.original.id)
                          ? 'bg-blue-50 hover:bg-blue-100'
                          : 'hover:bg-gray-50'
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TanStack Table Built-in Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Menampilkan{' '}
                <span className="font-medium">
                  {pagination.currentPage === pagination.totalPages
                    ? pagination.totalItems
                    : pagination.currentPage * pagination.itemsPerPage}
                </span>{' '}
                dari <span className="font-medium">{pagination.totalItems}</span> purchase orders
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Page size selector */}
              <div className="flex items-center space-x-2">
                <label htmlFor="pageSize" className="text-sm text-gray-700">
                  Per halaman:
                </label>
                <select
                  id="pageSize"
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {[5, 10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  {'<<'}
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  {'<'}
                </button>

                <span className="px-3 py-1 text-sm text-gray-700">
                  Halaman{' '}
                  <strong>
                    {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                  </strong>
                </span>

                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  {'>'}
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  {'>>'}
                </button>
              </div>

              {/* Go to page input */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Ke halaman:</span>
                <input
                  type="number"
                  min="1"
                  max={table.getPageCount()}
                  defaultValue={table.getState().pagination.pageIndex + 1}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    
                    const pageNumber = Number(value);
                    const maxPage = table.getPageCount();
                    
                    // Validate: must be between 1 and maxPage
                    if (pageNumber >= 1 && pageNumber <= maxPage) {
                      table.setPageIndex(pageNumber - 1);
                    } else {
                      // Reset to current page if invalid
                      e.target.value = table.getState().pagination.pageIndex + 1;
                    }
                  }}
                  onKeyDown={(e) => {
                    // Also trigger on Enter key
                    if (e.key === 'Enter') {
                      e.target.blur(); // Trigger onBlur
                    }
                  }}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PurchaseOrderTableServerSide;

