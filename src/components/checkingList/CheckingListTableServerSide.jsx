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
import { useCheckingListQuery } from '../../hooks/useCheckingListQuery';
import { formatDateTime } from '../../utils/formatUtils';

const columnHelper = createColumnHelper();

const resolveChecklistId = (item) => {
  if (!item || typeof item !== 'object') {
    return null;
  }
  return (
    item.id ||
    item.checklistId ||
    item._id ||
    (typeof item === 'string' ? item : null)
  );
};

const CheckingListTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
  initialPage = 1,
  initialLimit = 10,
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

  // Convert columnFilters to backend format
  const filters = useMemo(() => {
    const filterObj = {};
    columnFilters.forEach((filter) => {
      filterObj[filter.id] = filter.value;
    });
    return filterObj;
  }, [columnFilters]);

  // Fetch data from backend
  const { data, isLoading, isFetching, error } = useCheckingListQuery({
    page,
    limit,
    sorting,
    filters,
    globalFilter: debouncedGlobalFilter,
  });

  const checklists = data?.checklists || [];
  const pagination = data?.pagination || {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Checklist ID</div>
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
        cell: (info) => info.getValue() || '-',
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
        cell: (info) => formatDateTime(info.getValue()),
      }),
      columnHelper.accessor('checker', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Checker</div>
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
      columnHelper.accessor('driver', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Driver</div>
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
      columnHelper.accessor('mobil', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Kendaraan</div>
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
      columnHelper.accessor('kota', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Kota</div>
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
      columnHelper.accessor('suratJalan', {
        id: 'surat_jalan',
        header: 'Surat Jalan',
        cell: (info) => {
          const suratJalanList = Array.isArray(info.getValue())
            ? info.getValue()
            : info.getValue()
              ? [info.getValue()]
              : [];
          const primarySuratJalan = suratJalanList[0];
          const additionalCount = suratJalanList.length > 1 ? suratJalanList.length - 1 : 0;

          return (
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {primarySuratJalan?.no_surat_jalan || info.row.original?.suratJalanId || '-'}
              </p>
              {primarySuratJalan?.deliver_to && (
                <p className="text-xs text-gray-500">{primarySuratJalan.deliver_to}</p>
              )}
              {additionalCount > 0 && (
                <p className="text-xs text-gray-400">+{additionalCount} surat jalan lainnya</p>
              )}
            </div>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor('status', {
        header: 'Status Checklist',
        cell: (info) => {
          const status = info.getValue();
          return (
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {status?.status_name || status?.status_code || '-'}
              </p>
              {(status?.status_code || info.row.original?.statusId) && (
                <p className="text-xs text-gray-500">
                  {status?.status_code || info.row.original?.statusId}
                </p>
              )}
            </div>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const checklist = row.original;
          const checklistId = resolveChecklistId(checklist);

          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onView && onView(checklist)}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              >
                <EyeIcon className="mr-1 h-4 w-4" />
                Detail
              </button>
              <button
                type="button"
                onClick={() => onEdit && onEdit(checklist)}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                <PencilIcon className="mr-1 h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete && checklistId && onDelete(checklistId)}
                disabled={deleteLoading}
                className="inline-flex items-center rounded-md border border-transparent bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="mr-1 h-4 w-4" />
                Hapus
              </button>
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [onView, onEdit, onDelete, deleteLoading]
  );

  const table = useReactTable({
    data: checklists,
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
      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setGlobalFilter('');
              setColumnFilters([]);
              setPage(1);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="w-8 h-8 mr-3 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span>Memuat data checklist surat jalan...</span>
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
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
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
              <tbody className="divide-y divide-gray-200 bg-white">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      {hasActiveFilters
                        ? 'Tidak ada checklist surat jalan yang cocok dengan pencarian.'
                        : 'Belum ada checklist surat jalan.'}
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
                dari <span className="font-medium">{pagination.totalItems}</span> checklist
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

export default CheckingListTableServerSide;

