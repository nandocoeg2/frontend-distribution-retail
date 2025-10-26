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
import { useInvoicePenagihanQuery } from '../../hooks/useInvoicePenagihanQuery';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

const columnHelper = createColumnHelper();

// Tab to status code mapping
const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: { label: 'Pending', statusCode: 'PENDING INVOICE PENAGIHAN' },
  processing: { label: 'Processing', statusCode: 'PROCESSING INVOICE PENAGIHAN' },
  paid: { label: 'Paid', statusCode: 'PAID INVOICE PENAGIHAN' },
  overdue: { label: 'Overdue', statusCode: 'OVERDUE INVOICE PENAGIHAN' },
  completed: { label: 'Completed', statusCode: 'COMPLETED INVOICE PENAGIHAN' },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED INVOICE PENAGIHAN' },
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('completed') || value.includes('paid')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed')) {
    return 'danger';
  }

  if (value.includes('processing') || value.includes('overdue')) {
    return 'warning';
  }

  if (value.includes('pending')) {
    return 'secondary';
  }

  return 'default';
};

const InvoicePenagihanTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  onGenerateKwitansi,
  generatingInvoiceId,
  onGenerateTandaTerimaFaktur,
  generatingTandaTerimaInvoiceId,
  onGenerateFakturPajak,
  generatingFakturInvoiceId,
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
  const { data, isLoading, isFetching, error } = useInvoicePenagihanQuery({
    page,
    limit,
    sorting,
    filters,
    globalFilter: '',
  });

  const invoices = data?.invoices || [];
  const pagination = data?.pagination || {
    currentPage: page,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_invoice_penagihan', {
        id: 'no_invoice_penagihan',
        header: ({ column }) => (
          <div className="space-y-2">
            <button
              onClick={() => column.toggleSorting()}
              className="flex items-center space-x-1 font-medium hover:text-blue-600"
            >
              <span>No Invoice</span>
              {column.getIsSorted() === 'asc' ? (
                <ArrowUpIcon className="w-4 h-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDownIcon className="w-4 h-4" />
              ) : null}
            </button>
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
          <div className="text-sm font-medium text-gray-900">
            {info.getValue() || '-'}
          </div>
        ),
      }),
      columnHelper.accessor('tanggal', {
        id: 'tanggal',
        header: ({ column }) => (
          <div className="space-y-2">
            <button
              onClick={() => column.toggleSorting()}
              className="flex items-center space-x-1 font-medium hover:text-blue-600"
            >
              <span>Tanggal</span>
              {column.getIsSorted() === 'asc' ? (
                <ArrowUpIcon className="w-4 h-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDownIcon className="w-4 h-4" />
              ) : null}
            </button>
          </div>
        ),
        cell: (info) => (
          <div className="text-sm text-gray-900">
            {formatDate(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('kepada', {
        id: 'kepada',
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
        cell: (info) => {
          const invoice = info.row.original;
          return (
            <div className="text-sm text-gray-900">
              {info.getValue() || invoice?.purchaseOrder?.customer?.namaCustomer || '-'}
            </div>
          );
        },
      }),
      columnHelper.accessor('grand_total', {
        id: 'grand_total',
        header: ({ column }) => (
          <div className="space-y-2">
            <button
              onClick={() => column.toggleSorting()}
              className="flex items-center space-x-1 font-medium hover:text-blue-600"
            >
              <span>Grand Total</span>
              {column.getIsSorted() === 'asc' ? (
                <ArrowUpIcon className="w-4 h-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDownIcon className="w-4 h-4" />
              ) : null}
            </button>
          </div>
        ),
        cell: (info) => (
          <div className="text-sm text-gray-900">
            {formatCurrency(info.getValue())}
          </div>
        ),
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
                  <option value="PENDING INVOICE PENAGIHAN">Pending</option>
                  <option value="PROCESSING INVOICE PENAGIHAN">Processing</option>
                  <option value="PAID INVOICE PENAGIHAN">Paid</option>
                  <option value="OVERDUE INVOICE PENAGIHAN">Overdue</option>
                  <option value="COMPLETED INVOICE PENAGIHAN">Completed</option>
                  <option value="CANCELLED INVOICE PENAGIHAN">Cancelled</option>
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
        id: 'kwitansi',
        header: () => <div className="text-center font-medium">Generate Kwitansi</div>,
        cell: ({ row }) => {
          const invoice = row.original;
          const isGenerating = generatingInvoiceId === invoice.id;
          const hasKwitansi = Boolean(invoice?.kwitansiId || invoice?.kwitansi?.id);
          
          return (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center space-x-2">
                {isGenerating && (
                  <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></span>
                )}
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  checked={hasKwitansi}
                  onChange={(e) => {
                    if (e.target.checked && onGenerateKwitansi) {
                      onGenerateKwitansi(invoice);
                    }
                  }}
                  disabled={hasKwitansi || isGenerating}
                />
              </div>
              {invoice?.kwitansi?.no_kwitansi && (
                <span className="text-xs text-gray-500">
                  {invoice.kwitansi.no_kwitansi}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'tandaTerimaFaktur',
        header: () => <div className="text-center font-medium">Generate TTF</div>,
        cell: ({ row }) => {
          const invoice = row.original;
          const isGenerating = generatingTandaTerimaInvoiceId === invoice.id;
          const hasTTF = Boolean(invoice?.tandaTerimaFakturId || invoice?.tandaTerimaFaktur?.id);
          
          return (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center space-x-2">
                {isGenerating && (
                  <span className="w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></span>
                )}
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                  checked={hasTTF}
                  onChange={(e) => {
                    if (e.target.checked && onGenerateTandaTerimaFaktur) {
                      onGenerateTandaTerimaFaktur(invoice);
                    }
                  }}
                  disabled={hasTTF || isGenerating}
                />
              </div>
              {invoice?.tandaTerimaFaktur?.code_supplier && (
                <span className="text-xs text-gray-500">
                  {invoice.tandaTerimaFaktur.code_supplier}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'fakturPajak',
        header: () => <div className="text-center font-medium">Generate Faktur Pajak</div>,
        cell: ({ row }) => {
          const invoice = row.original;
          const isGenerating = generatingFakturInvoiceId === invoice.id;
          const hasFaktur = Boolean(invoice?.fakturPajakId || invoice?.fakturPajak?.id);
          
          return (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center space-x-2">
                {isGenerating && (
                  <span className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></span>
                )}
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                  checked={hasFaktur}
                  onChange={(e) => {
                    if (e.target.checked && onGenerateFakturPajak) {
                      onGenerateFakturPajak(invoice);
                    }
                  }}
                  disabled={hasFaktur || isGenerating}
                />
              </div>
              {invoice?.fakturPajak?.no_pajak && (
                <span className="text-xs text-gray-500">
                  {invoice.fakturPajak.no_pajak}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right font-medium">Aksi</div>,
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="flex items-center justify-end space-x-2">
              {onView && (
                <button
                  onClick={() => onView(invoice)}
                  className="p-1 text-blue-600 hover:text-blue-900"
                  title="Lihat Detail"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(invoice)}
                  className="p-1 text-yellow-600 hover:text-yellow-900"
                  title="Edit"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(invoice)}
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
      invoices,
      onView,
      onEdit,
      onDelete,
      onGenerateKwitansi,
      onGenerateTandaTerimaFaktur,
      onGenerateFakturPajak,
      generatingInvoiceId,
      generatingTandaTerimaInvoiceId,
      generatingFakturInvoiceId,
      deleteLoading,
      activeTab,
    ]
  );

  const table = useReactTable({
    data: invoices,
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
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
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
                  {isLoading ? 'Memuat data...' : 'Tidak ada data invoice penagihan'}
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

export default InvoicePenagihanTableServerSide;

