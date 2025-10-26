import React, { useMemo, useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useKwitansiQuery } from '../../hooks/useKwitansiQuery';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';

const columnHelper = createColumnHelper();

// Tab to status code mapping
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

  // Auto-set status filter based on active tab
  useEffect(() => {
    const tabStatusCode = TAB_STATUS_CONFIG[activeTab]?.statusCode;
    
    if (activeTab !== 'all' && tabStatusCode) {
      // Lock status filter to tab's status code
      const hasStatusFilter = columnFilters.some(f => f.id === 'status_code');
      if (!hasStatusFilter || columnFilters.find(f => f.id === 'status_code')?.value !== tabStatusCode) {
        setColumnFilters(prev => {
          const filtered = prev.filter(f => f.id !== 'status_code');
          return [...filtered, { id: 'status_code', value: tabStatusCode }];
        });
      }
    } else if (activeTab === 'all') {
      // In "All" tab, clear status filter to show all data
      setColumnFilters(prev => prev.filter(f => f.id !== 'status_code'));
    }
  }, [activeTab]);

  // Convert columnFilters to backend format
  const filters = useMemo(() => {
    const filterObj = {};
    columnFilters.forEach((filter) => {
      filterObj[filter.id] = filter.value;
    });
    return filterObj;
  }, [columnFilters]);

  // Fetch data from backend
  const { data, isLoading, isFetching, error } = useKwitansiQuery({
    page,
    limit,
    sorting,
    filters,
    globalFilter: debouncedGlobalFilter,
  });

  const kwitansis = data?.kwitansis || [];
  const pagination = data?.pagination || {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
  };

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
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('no_kwitansi', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Kwitansi</div>
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
        cell: (info) => (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {info.getValue() || '-'}
            </div>
            {info.row.original?.status?.status_code && (
              <StatusBadge
                status={info.row.original.status.status_code}
                variant={resolveStatusVariant(info.row.original.status.status_code)}
                size="sm"
                dot
              />
            )}
          </div>
        ),
      }),
      columnHelper.accessor('tanggal', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal</div>
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
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('kepada', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Kepada</div>
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
        cell: (info) => (
          <div>
            <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
            {info.row.original.invoicePenagihan?.customer?.nama_customer && (
              <div className="text-xs text-gray-500">
                {info.row.original.invoicePenagihan.customer.nama_customer}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('grand_total', {
        header: 'Grand Total',
        cell: (info) => formatCurrency(info.getValue()),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => formatDateTime(info.getValue()),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Updated',
        cell: (info) => formatDateTime(info.getValue()),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('termOfPayment.kode_top', {
        id: 'termOfPaymentId',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">TOP</div>
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
        cell: (info) => (
          <div>
            <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
            {info.row.original?.termOfPayment?.batas_hari != null && (
              <div className="text-xs text-gray-500">
                {info.row.original.termOfPayment.batas_hari} hari
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const item = row.original;
          const isExporting = exportingId === item.id;
          const actionDisabled = deleteLoading;

          return (
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => onExport?.(item)}
                className="p-1 text-blue-600 hover:text-blue-900 disabled:text-blue-300"
                title="Export kwitansi ke PDF"
                disabled={actionDisabled || isExporting || !onExport}
              >
                {isExporting ? (
                  <span className="block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <ArrowDownTrayIcon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => onView?.(item)}
                className="p-1 text-indigo-600 hover:text-indigo-900 disabled:text-indigo-300"
                title="Lihat detail kwitansi"
                disabled={actionDisabled}
              >
                <EyeIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit?.(item)}
                className="p-1 text-indigo-600 hover:text-indigo-900 disabled:text-indigo-300"
                title="Ubah kwitansi"
                disabled={actionDisabled}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(item.id)}
                className="p-1 text-red-600 hover:text-red-900 disabled:text-red-300"
                title="Hapus kwitansi"
                disabled={actionDisabled}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [activeTab, onView, onEdit, onDelete, onExport, exportingId, deleteLoading]
  );

  const table = useReactTable({
    data: kwitansis,
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="w-8 h-8 mr-3 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span>Memuat data kwitansi...</span>
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
            <table className="min-w-full bg-white border border-gray-200 divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const isSorted = header.column.getIsSorted();

                      return (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
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
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      {hasActiveFilters
                        ? 'Kwitansi tidak ditemukan.'
                        : 'Belum ada data kwitansi.'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
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
                dari <span className="font-medium">{pagination.totalItems}</span> kwitansi
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

export default KwitansiTableServerSide;

