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
import { useTandaTerimaFakturQuery } from '../../hooks/useTandaTerimaFakturQuery';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/utils/formatUtils';

const columnHelper = createColumnHelper();

// Tab to status code mapping
const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: {
    label: 'Pending',
    statusCode: 'PENDING TANDA TERIMA FAKTUR',
  },
  processing: {
    label: 'Processing',
    statusCode: 'PROCESSING TANDA TERIMA FAKTUR',
  },
  delivered: {
    label: 'Delivered',
    statusCode: 'DELIVERED TANDA TERIMA FAKTUR',
  },
  received: {
    label: 'Received',
    statusCode: 'RECEIVED TANDA TERIMA FAKTUR',
  },
  cancelled: {
    label: 'Cancelled',
    statusCode: 'CANCELLED TANDA TERIMA FAKTUR',
  },
  completed: {
    label: 'Completed',
    statusCode: 'COMPLETED TANDA TERIMA FAKTUR',
  },
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('delivered') || value.includes('complete') || value.includes('received')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed') || value.includes('error')) {
    return 'danger';
  }

  if (value.includes('shipped') || value.includes('packed')) {
    return 'primary';
  }

  if (value.includes('processing') || value.includes('in progress')) {
    return 'warning';
  }

  if (value.includes('pending') || value.includes('draft')) {
    return 'secondary';
  }

  return 'default';
};

const TandaTerimaFakturTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
  initialPage = 1,
  initialLimit = 10,
  activeTab = 'all',
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
      const hasStatusFilter = columnFilters.some((f) => f.id === 'status');
      if (!hasStatusFilter || columnFilters.find((f) => f.id === 'status')?.value !== tabStatusCode) {
        setColumnFilters((prev) => {
          const filtered = prev.filter((f) => f.id !== 'status');
          return [...filtered, { id: 'status', value: tabStatusCode }];
        });
      }
    } else if (activeTab === 'all') {
      // In "All" tab, clear status filter to show all data
      setColumnFilters((prev) => prev.filter((f) => f.id !== 'status'));
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
  const { data, isLoading, isFetching, error } = useTandaTerimaFakturQuery({
    page,
    limit,
    sorting,
    filters,
    globalFilter: debouncedGlobalFilter,
  });

  const tandaTerimaFakturs = data?.tandaTerimaFakturs || [];
  const pagination = data?.pagination || {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('tanggal', {
        header: ({ column }) => (
          <div className='space-y-2'>
            <div className='font-medium'>Tanggal</div>
            <input
              type='date'
              value={column.getFilterValue() ?? ''}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('termOfPayment.kode_top', {
        id: 'kode_top',
        header: ({ column }) => (
          <div className='space-y-2'>
            <div className='font-medium'>TOP</div>
            <input
              type='text'
              value={column.getFilterValue() ?? ''}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder='Filter...'
              className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className='text-sm text-gray-900'>{info.getValue() || '-'}</div>
              {row?.termOfPayment?.batas_hari != null && (
                <div className='text-xs text-gray-500'>
                  {row.termOfPayment.batas_hari} hari
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('customer.namaCustomer', {
        id: 'customer_name',
        header: ({ column }) => (
          <div className='space-y-2'>
            <div className='font-medium'>Nama Customer</div>
            <input
              type='text'
              value={column.getFilterValue() ?? ''}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder='Filter...'
              className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('customer.kodeCustomer', {
        id: 'customer_code',
        header: ({ column }) => (
          <div className='space-y-2'>
            <div className='font-medium'>Kode Customer</div>
            <input
              type='text'
              value={column.getFilterValue() ?? ''}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder='Filter...'
              className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('company.nama_perusahaan', {
        id: 'company_name',
        header: ({ column }) => (
          <div className='space-y-2'>
            <div className='font-medium'>Nama Company</div>
            <input
              type='text'
              value={column.getFilterValue() ?? ''}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder='Filter...'
              className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className='text-sm text-gray-900'>{info.getValue() || '-'}</div>
              {row?.company?.kode_company && (
                <div className='text-xs text-gray-500'>{row.company.kode_company}</div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('code_supplier', {
        header: ({ column }) => (
          <div className='space-y-2'>
            <div className='font-medium'>Kode Supplier</div>
            <input
              type='text'
              value={column.getFilterValue() ?? ''}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder='Filter...'
              className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className='text-sm font-medium text-gray-900'>{info.getValue() || '-'}</div>
              <div className='text-xs text-gray-500'>ID: {row.id || '-'}</div>
            </div>
          );
        },
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status',
        header: ({ column }) => {
          const isLocked = activeTab !== 'all';
          const lockedStatus = TAB_STATUS_CONFIG[activeTab]?.statusCode;

          return (
            <div className='space-y-2'>
              <div className='font-medium'>Status</div>
              {isLocked ? (
                // Locked: Show read-only display
                <div className='w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700'>
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
                  className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value=''>Semua</option>
                  <option value='PENDING TANDA TERIMA FAKTUR'>Pending</option>
                  <option value='PROCESSING TANDA TERIMA FAKTUR'>Processing</option>
                  <option value='DELIVERED TANDA TERIMA FAKTUR'>Delivered</option>
                  <option value='RECEIVED TANDA TERIMA FAKTUR'>Received</option>
                  <option value='CANCELLED TANDA TERIMA FAKTUR'>Cancelled</option>
                  <option value='COMPLETED TANDA TERIMA FAKTUR'>Completed</option>
                </select>
              )}
            </div>
          );
        },
        cell: (info) => (
          <StatusBadge
            status={info.getValue() || 'Unknown'}
            variant={resolveStatusVariant(info.getValue())}
            size='sm'
            dot
          />
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
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className='flex space-x-2'>
              <button
                type='button'
                onClick={() => onView(item)}
                className='text-indigo-600 hover:text-indigo-900'
                title='Lihat detail'
              >
                <EyeIcon className='h-5 w-5' />
              </button>
              <button
                type='button'
                onClick={() => onEdit(item)}
                className='text-green-600 hover:text-green-900'
                title='Ubah'
              >
                <PencilIcon className='h-5 w-5' />
              </button>
              <button
                type='button'
                onClick={() => onDelete(item.id)}
                disabled={deleteLoading}
                className='text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed'
                title='Hapus'
              >
                <TrashIcon className='h-5 w-5' />
              </button>
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [tandaTerimaFakturs, onView, onEdit, onDelete, deleteLoading, activeTab]
  );

  const table = useReactTable({
    data: tandaTerimaFakturs,
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
      const newPaginationState =
        typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: limit }) : updater;

      setPage(newPaginationState.pageIndex + 1); // Convert back to 1-indexed
      setLimit(newPaginationState.pageSize);
    },
  });

  const hasActiveFilters = globalFilter || columnFilters.length > 0;

  return (
    <div className='space-y-4'>
      {/* Reset Filter Button (only shown when filters active) */}
      {hasActiveFilters && (
        <div className='flex justify-end'>
          <button
            onClick={() => {
              setGlobalFilter('');
              setColumnFilters([]);
              setPage(1);
            }}
            className='px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50'
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className='flex items-center justify-center p-8 text-gray-500'>
          <div className='w-8 h-8 mr-3 border-b-2 border-blue-600 rounded-full animate-spin'></div>
          <span>Memuat data tanda terima faktur...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
          <p className='text-sm text-red-800'>Terjadi kesalahan: {error.message}</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <div className='overflow-x-auto'>
            <table className='min-w-full bg-white border border-gray-200'>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className='bg-gray-50'>
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const isSorted = header.column.getIsSorted();

                      return (
                        <th
                          key={header.id}
                          className='px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider'
                        >
                          {header.isPlaceholder ? null : (
                            <div className='space-y-2'>
                              {canSort ? (
                                <div
                                  className='cursor-pointer select-none flex items-center space-x-1 hover:text-gray-700 font-medium'
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  <span className='flex-1'>
                                    {typeof header.column.columnDef.header === 'string'
                                      ? header.column.columnDef.header
                                      : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                        )}
                                  </span>
                                  <span className='text-gray-400'>
                                    {isSorted === 'asc' ? (
                                      <ArrowUpIcon className='h-4 w-4' />
                                    ) : isSorted === 'desc' ? (
                                      <ArrowDownIcon className='h-4 w-4' />
                                    ) : (
                                      <span className='opacity-50'>⇅</span>
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <div className='font-medium'>
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
              <tbody className='bg-white divide-y divide-gray-200'>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className='px-6 py-4 text-center text-gray-500'>
                      {hasActiveFilters
                        ? 'Tidak ada data yang sesuai dengan pencarian'
                        : 'Tidak ada data tanda terima faktur'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className='hover:bg-gray-50'>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'
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
          <div className='flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200'>
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-700'>
                Menampilkan{' '}
                <span className='font-medium'>
                  {pagination.currentPage === pagination.totalPages
                    ? pagination.totalItems
                    : pagination.currentPage * pagination.itemsPerPage}
                </span>{' '}
                dari <span className='font-medium'>{pagination.totalItems}</span> tanda terima
                faktur
              </span>
            </div>

            <div className='flex items-center space-x-2'>
              {/* Page size selector */}
              <div className='flex items-center space-x-2'>
                <label htmlFor='pageSize' className='text-sm text-gray-700'>
                  Per halaman:
                </label>
                <select
                  id='pageSize'
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className='px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                >
                  {[5, 10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pagination controls */}
              <div className='flex items-center space-x-1'>
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className='px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  title='First page'
                >
                  {'<<'}
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className='px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  title='Previous page'
                >
                  {'<'}
                </button>

                <span className='px-3 py-1 text-sm text-gray-700'>
                  Halaman{' '}
                  <strong>
                    {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                  </strong>
                </span>

                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className='px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  title='Next page'
                >
                  {'>'}
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className='px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  title='Last page'
                >
                  {'>>'}
                </button>
              </div>

              {/* Go to page input */}
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-700'>Ke halaman:</span>
                <input
                  type='number'
                  min='1'
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
                  className='w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TandaTerimaFakturTableServerSide;

