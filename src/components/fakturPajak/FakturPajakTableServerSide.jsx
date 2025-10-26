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
import { useFakturPajakQuery } from '../../hooks/useFakturPajakQuery';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

const columnHelper = createColumnHelper();

// Tab to status code mapping
const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: { label: 'Pending', statusCode: 'PENDING FAKTUR PAJAK' },
  processing: { label: 'Processing', statusCode: 'PROCESSING FAKTUR PAJAK' },
  issued: { label: 'Issued', statusCode: 'ISSUED FAKTUR PAJAK' },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED FAKTUR PAJAK' },
  completed: { label: 'Completed', statusCode: 'COMPLETED FAKTUR PAJAK' },
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('completed') || value.includes('issued')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed')) {
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

const FakturPajakTableServerSide = ({
  onView,
  onEdit,
  onDelete,
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
  const { data, isLoading, isFetching, error } = useFakturPajakQuery({
    page,
    limit,
    sorting,
    filters,
    globalFilter: '',
  });

  const fakturPajaks = data?.fakturPajaks || [];
  const pagination = data?.pagination || {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_pajak', {
        id: 'no_pajak',
        header: 'Nomor Faktur',
        enableSorting: true,
        cell: (info) => {
          const item = info.row.original;
          return (
            <div>
              <div className="text-sm font-medium text-gray-900">
                {info.getValue() || '-'}
              </div>
              {item.createdAt && (
                <div className="text-xs text-gray-500">
                  Dibuat {formatDate(item.createdAt)}
                </div>
              )}
            </div>
          );
        },
        meta: {
          filterType: 'text',
          filterPlaceholder: 'Filter nomor faktur...',
        },
      }),
      columnHelper.accessor((row) => row.invoicePenagihan?.no_invoice_penagihan, {
        id: 'no_invoice_penagihan',
        header: 'Nomor Invoice',
        enableSorting: false,
        cell: (info) => (
          <div className="text-sm text-gray-900">
            {info.getValue() || '-'}
          </div>
        ),
        meta: {
          filterType: 'text',
          filterPlaceholder: 'Filter nomor invoice...',
        },
      }),
      columnHelper.accessor('tanggal_invoice', {
        id: 'tanggal_invoice',
        header: 'Tanggal Invoice',
        enableSorting: true,
        cell: (info) => (
          <div className="text-sm text-gray-900">
            {formatDate(info.getValue())}
          </div>
        ),
        meta: {
          filterType: 'date',
        },
      }),
      columnHelper.accessor((row) => row.laporanPenerimaanBarang?.no_lpb, {
        id: 'no_lpb',
        header: 'Nomor LPB',
        enableSorting: false,
        cell: (info) => {
          const item = info.row.original;
          return (
            <div>
              <div className="text-sm text-gray-900">
                {info.getValue() || '-'}
              </div>
              {item?.laporanPenerimaanBarang?.tanggal_terima && (
                <div className="text-xs text-gray-500">
                  {formatDate(item.laporanPenerimaanBarang.tanggal_terima)}
                </div>
              )}
            </div>
          );
        },
        meta: {
          filterType: 'text',
          filterPlaceholder: 'Filter nomor LPB...',
        },
      }),
      columnHelper.accessor((row) => row.customer?.namaCustomer, {
        id: 'customer',
        header: 'Nama Customer',
        enableSorting: false,
        cell: (info) => {
          const item = info.row.original;
          return (
            <div>
              <div className="text-sm text-gray-900">
                {info.getValue() || '-'}
              </div>
              {item?.customer?.kodeCustomer && (
                <div className="text-xs text-gray-500">
                  {item.customer.kodeCustomer}
                </div>
              )}
            </div>
          );
        },
        meta: {
          filterType: 'text',
          filterPlaceholder: 'Filter customer...',
        },
      }),
      columnHelper.accessor('total_harga_jual', {
        id: 'total_harga_jual',
        header: 'Total Harga Jual',
        enableSorting: true,
        cell: (info) => (
          <div className="text-sm text-gray-900 text-right">
            {formatCurrency(info.getValue())}
          </div>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('potongan_harga', {
        id: 'potongan_harga',
        header: 'Potongan Harga',
        enableSorting: true,
        cell: (info) => (
          <div className="text-sm text-gray-900 text-right">
            {formatCurrency(info.getValue())}
          </div>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('dasar_pengenaan_pajak', {
        id: 'dasar_pengenaan_pajak',
        header: 'Dasar Pengenaan Pajak',
        enableSorting: true,
        cell: (info) => (
          <div className="text-sm text-gray-900 text-right">
            {formatCurrency(info.getValue())}
          </div>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('ppn_rp', {
        id: 'ppn_rp',
        header: 'PPN Rupiah',
        enableSorting: true,
        cell: (info) => {
          const item = info.row.original;
          return (
            <div className="text-right">
              <div className="text-sm text-gray-900">
                {formatCurrency(info.getValue())}
              </div>
              {item.ppn_percentage != null && (
                <div className="text-xs text-gray-500">
                  {item.ppn_percentage}% dari DPP
                </div>
              )}
            </div>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor((row) => row.termOfPayment?.kode_top, {
        id: 'top',
        header: 'TOP',
        enableSorting: false,
        cell: (info) => {
          const item = info.row.original;
          return (
            <div>
              <div className="text-sm text-gray-900">
                {info.getValue() || '-'}
              </div>
              {item?.termOfPayment?.batas_hari != null && (
                <div className="text-xs text-gray-500">
                  {item.termOfPayment.batas_hari} hari
                </div>
              )}
            </div>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor((row) => row.status?.status_name || row.status?.status_code, {
        id: 'status',
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
                  <option value="PENDING FAKTUR PAJAK">Pending</option>
                  <option value="PROCESSING FAKTUR PAJAK">Processing</option>
                  <option value="ISSUED FAKTUR PAJAK">Issued</option>
                  <option value="CANCELLED FAKTUR PAJAK">Cancelled</option>
                  <option value="COMPLETED FAKTUR PAJAK">Completed</option>
                </select>
              )}
            </div>
          );
        },
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
        id: 'actions',
        header: () => <div className="text-right font-medium">Aksi</div>,
        cell: ({ row }) => {
          const fakturPajak = row.original;
          return (
            <div className="flex items-center justify-end space-x-2">
              {onView && (
                <button
                  onClick={() => onView(fakturPajak)}
                  className="p-1 text-blue-600 hover:text-blue-900"
                  title="Lihat Detail"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(fakturPajak)}
                  className="p-1 text-yellow-600 hover:text-yellow-900"
                  title="Edit"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(fakturPajak)}
                  className="p-1 text-red-600 hover:text-red-900"
                  title="Hapus"
                  disabled={deleteLoading}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [
      fakturPajaks,
      onView,
      onEdit,
      onDelete,
      deleteLoading,
      activeTab,
    ]
  );

  const table = useReactTable({
    data: fakturPajaks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: pagination.totalPages,
    state: {
      sorting,
      columnFilters,
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
    onPaginationChange: (updater) => {
      const newPaginationState = typeof updater === 'function' 
        ? updater({ pageIndex: page - 1, pageSize: limit })
        : updater;
      
      setPage(newPaginationState.pageIndex + 1); // Convert back to 1-indexed
      setLimit(newPaginationState.pageSize);
    },
  });

  const hasActiveFilters = columnFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setColumnFilters([]);
              setPage(1);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {(isLoading || isFetching) && (
        <div className="flex items-center justify-center py-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Terjadi kesalahan: {error?.message || 'Gagal memuat data'}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();
                  const canFilter = header.column.getCanFilter();
                  const filterMeta = header.column.columnDef.meta;

                  return (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
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
                          
                          {/* Column Filter */}
                          {canFilter && filterMeta && (
                            filterMeta.filterType === 'text' ? (
                              <input
                                type="text"
                                value={header.column.getFilterValue() ?? ''}
                                onChange={(e) => {
                                  header.column.setFilterValue(e.target.value);
                                  setPage(1);
                                }}
                                placeholder={filterMeta.filterPlaceholder || 'Filter...'}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : filterMeta.filterType === 'date' ? (
                              <input
                                type="date"
                                value={header.column.getFilterValue() ?? ''}
                                onChange={(e) => {
                                  header.column.setFilterValue(e.target.value);
                                  setPage(1);
                                }}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : null
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
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {isLoading ? 'Memuat data...' : 'Tidak ada data faktur pajak'}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Menampilkan{' '}
            <span className="font-medium">
              {Math.min((page - 1) * limit + 1, pagination.totalItems)}
            </span>{' '}
            -{' '}
            <span className="font-medium">
              {Math.min(page * limit, pagination.totalItems)}
            </span>{' '}
            dari <span className="font-medium">{pagination.totalItems}</span> data
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Items per page selector */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10 / halaman</option>
            <option value={25}>25 / halaman</option>
            <option value={50}>50 / halaman</option>
            <option value={100}>100 / halaman</option>
          </select>

          {/* Page navigation */}
          <div className="flex space-x-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ««
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              «
            </button>
            <span className="px-4 py-1 border border-gray-300 rounded-lg bg-gray-50">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              »
            </button>
            <button
              onClick={() => setPage(pagination.totalPages)}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              »»
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FakturPajakTableServerSide;

