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
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useInvoicePengirimanQuery } from '../../hooks/useInvoicePengirimanQuery';

const columnHelper = createColumnHelper();

// Tab to status code mapping
const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED INVOICE' },
  pending: { label: 'Pending', statusCode: 'PENDING INVOICE' },
  paid: { label: 'Paid', statusCode: 'PAID INVOICE' },
  overdue: { label: 'Overdue', statusCode: 'OVERDUE INVOICE' },
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('paid') || value.includes('complete')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed') || value.includes('error')) {
    return 'danger';
  }

  if (value.includes('overdue') || value.includes('expired')) {
    return 'warning';
  }

  if (value.includes('pending') || value.includes('draft')) {
    return 'secondary';
  }

  return 'default';
};

const InvoicePengirimanTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
  selectedInvoices = [],
  onSelectInvoice,
  onSelectAllInvoices,
  onTogglePenagihan,
  creatingPenagihanId,
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
      const hasStatusFilter = columnFilters.some(f => f.id === 'status');
      if (!hasStatusFilter || columnFilters.find(f => f.id === 'status')?.value !== tabStatusCode) {
        setColumnFilters(prev => {
          const filtered = prev.filter(f => f.id !== 'status');
          return [...filtered, { id: 'status', value: tabStatusCode }];
        });
      }
    } else if (activeTab === 'all') {
      // In "All" tab, clear status filter to show all data
      setColumnFilters(prev => prev.filter(f => f.id !== 'status'));
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
  const { data, isLoading, isFetching, error } = useInvoicePengirimanQuery({
    page,
    limit,
    sorting,
    filters,
    globalFilter: debouncedGlobalFilter,
  });

  const invoicePengiriman = data?.invoicePengiriman || [];
  const pagination = data?.pagination || {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'penagihan',
        header: 'Penagihan',
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            {creatingPenagihanId === row.original.id ? (
              <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
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
      columnHelper.display({
        id: 'select',
        header: () => {
          const isAllSelected =
            invoicePengiriman.length > 0 && selectedInvoices.length === invoicePengiriman.length;
          const isIndeterminate =
            selectedInvoices.length > 0 && selectedInvoices.length < invoicePengiriman.length;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={onSelectAllInvoices}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedInvoices.includes(row.original.id)}
            onChange={() => onSelectInvoice(row.original.id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
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
          <div className="font-medium text-gray-900">{info.getValue() || '-'}</div>
        ),
      }),
      columnHelper.accessor('tanggal_invoice', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal Invoice</div>
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
      columnHelper.accessor('customer.namaCustomer', {
        id: 'nama_customer',
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
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('jumlah_invoice', {
        header: 'Jumlah',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status',
        header: ({ column }) => {
          const isLocked = activeTab !== 'all';

          return (
            <div className="space-y-2">
              <div className="font-medium">Status</div>
              {isLocked ? (
                <div className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                  {TAB_STATUS_CONFIG[activeTab]?.label || 'N/A'}
                </div>
              ) : (
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
          <span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {info.getValue() || 'Unknown'}
            </span>
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
      invoicePengiriman,
      selectedInvoices,
      onSelectInvoice,
      onSelectAllInvoices,
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
    data: invoicePengiriman,
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
          <span>Memuat data invoice pengiriman...</span>
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
                        : 'Tidak ada data invoice pengiriman'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        selectedInvoices.includes(row.original.id)
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
                dari <span className="font-medium">{pagination.totalItems}</span> invoice pengiriman
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

export default InvoicePengirimanTableServerSide;
