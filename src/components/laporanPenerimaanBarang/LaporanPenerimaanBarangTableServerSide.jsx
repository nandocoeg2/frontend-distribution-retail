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
  PlayIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useLaporanPenerimaanBarangQuery } from '../../hooks/useLaporanPenerimaanBarangQuery';
import { formatDate } from '../../utils/formatUtils';

const columnHelper = createColumnHelper();

// Tab to status code mapping
const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: {
    label: 'Pending',
    statusCode: 'PENDING LAPORAN PENERIMAAN BARANG',
  },
  processing: {
    label: 'Processing',
    statusCode: 'PROCESSING LAPORAN PENERIMAAN BARANG',
  },
  completed: {
    label: 'Completed',
    statusCode: 'COMPLETED LAPORAN PENERIMAAN BARANG',
  },
  failed: {
    label: 'Failed',
    statusCode: 'FAILED LAPORAN PENERIMAAN BARANG',
  },
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('complete')) {
    return 'success';
  }

  if (value.includes('failed') || value.includes('error')) {
    return 'danger';
  }

  if (value.includes('processing') || value.includes('in progress')) {
    return 'warning';
  }

  if (value.includes('pending') || value.includes('draft')) {
    return 'secondary';
  }

  return 'default';
};

const resolveReportId = (report) => {
  if (!report) {
    return null;
  }
  return report.id || report.lpbId || report._id || report.uuid || null;
};

const LaporanPenerimaanBarangTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
  selectedReports = [],
  onSelectReport,
  onSelectAllReports,
  onProcessSelected,
  onCompleteSelected,
  isProcessing = false,
  isCompleting = false,
  hasSelectedReports = false,
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
  const { data, isLoading, isFetching, error } = useLaporanPenerimaanBarangQuery({
    page,
    limit,
    sorting,
    filters,
    globalFilter: debouncedGlobalFilter,
  });

  const reports = data?.reports || [];
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
            reports.length > 0 && selectedReports.length === reports.length;
          const isIndeterminate =
            selectedReports.length > 0 && selectedReports.length < reports.length;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={onSelectAllReports}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => {
          const reportId = resolveReportId(row.original);
          return (
            <input
              type="checkbox"
              checked={selectedReports.includes(reportId)}
              onChange={() => onSelectReport(reportId, !selectedReports.includes(reportId))}
              disabled={!reportId}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('purchaseOrder.po_number', {
        id: 'po_number',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">No. PO</div>
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
        cell: (info) =>
          info.getValue() ||
          info.row.original?.purchaseOrderId ||
          'N/A',
      }),
      columnHelper.accessor('tanggal_po', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal PO</div>
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
        cell: (info) =>
          formatDate(info.getValue() || info.row.original?.purchaseOrder?.tanggal_po),
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
        cell: (info) =>
          info.getValue() ||
          info.row.original?.customerId ||
          'N/A',
      }),
      columnHelper.accessor('termOfPayment.kode_top', {
        id: 'termin_bayar',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Termin Bayar</div>
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
        cell: (info) =>
          info.getValue() ||
          info.row.original?.termin_bayar ||
          'N/A',
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status_code',
        header: ({ column }) => {
          const isLocked = activeTab !== 'all';
          
          return (
            <div className="space-y-2">
              <div className="font-medium">Status</div>
              {isLocked ? (
                // Locked: Show read-only display
                <div className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                  {TAB_STATUS_CONFIG[activeTab]?.label || 'N/A'}
                </div>
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
                  <option value="PENDING LAPORAN PENERIMAAN BARANG">Pending</option>
                  <option value="PROCESSING LAPORAN PENERIMAAN BARANG">Processing</option>
                  <option value="COMPLETED LAPORAN PENERIMAAN BARANG">Completed</option>
                  <option value="FAILED LAPORAN PENERIMAAN BARANG">Failed</option>
                </select>
              )}
            </div>
          );
        },
        cell: (info) => {
          const statusName =
            info.getValue() ||
            info.row.original?.status?.status_code ||
            info.row.original?.statusId ||
            'Unknown';
          
          return (
            <StatusBadge
              status={statusName}
              variant={resolveStatusVariant(statusName)}
              size="sm"
              dot
            />
          );
        },
      }),
      columnHelper.accessor('files', {
        id: 'total_files',
        header: 'File',
        cell: (info) => {
          const files = info.getValue();
          return Array.isArray(files) ? files.length : 0;
        },
        enableColumnFilter: false,
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const report = row.original;
          const reportId = resolveReportId(report);

          return (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => onView(report)}
                className="text-indigo-600 hover:text-indigo-900"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(report)}
                className="text-green-600 hover:text-green-900"
                title="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => reportId && onDelete(reportId)}
                disabled={deleteLoading || !reportId}
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
      reports,
      selectedReports,
      onSelectReport,
      onSelectAllReports,
      onView,
      onEdit,
      onDelete,
      deleteLoading,
      activeTab,
    ]
  );

  const table = useReactTable({
    data: reports,
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

  const actionDisabled = isProcessing || isCompleting;

  const hasActiveFilters = globalFilter || columnFilters.some(f => f.id !== 'status_code' || activeTab === 'all');

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

      {/* Process/Complete Buttons */}
      {hasSelectedReports && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedReports.length} laporan dipilih
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onProcessSelected}
              disabled={actionDisabled}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayIcon className="h-4 w-4" />
              <span>{isProcessing ? 'Memproses...' : 'Proses'}</span>
            </button>
            <button
              onClick={onCompleteSelected}
              disabled={actionDisabled}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              <span>{isCompleting ? 'Menyelesaikan...' : 'Selesaikan'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="w-8 h-8 mr-3 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span>Memuat data laporan...</span>
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
                        : 'Tidak ada data laporan penerimaan barang'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const reportId = resolveReportId(row.original);
                    return (
                      <tr
                        key={row.id}
                        className={
                          selectedReports.includes(reportId)
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
                    );
                  })
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
                dari <span className="font-medium">{pagination.totalItems}</span> laporan
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

export default LaporanPenerimaanBarangTableServerSide;

