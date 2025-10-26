import React, { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';

const columnHelper = createColumnHelper();

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  // Complete = Hijau
  if (value.includes('delivered') || value.includes('complete')) {
    return 'success';
  }

  // Failed = Merah
  if (value.includes('cancelled') || value.includes('failed') || value.includes('error')) {
    return 'danger';
  }

  // Processed = Biru (Shipped/Packed considered as processed)
  if (value.includes('shipped') || value.includes('packed')) {
    return 'primary';
  }

  // Processing/In Progress = Kuning
  if (value.includes('processing') || value.includes('in progress')) {
    return 'warning';
  }

  // Pending/Draft = Netral/Abu-abu
  if (value.includes('pending') || value.includes('draft')) {
    return 'secondary';
  }

  return 'default';
};

const processingStatusVariants = ['processing packing', 'processing packing order'];

const normalizeStatusValue = (value) => {
  if (!value) {
    return '';
  }

  return value.toString().trim().toLowerCase().replace(/_/g, ' ');
};

const isProcessingStatus = (packing) => {
  if (!packing?.status) {
    return false;
  }

  const normalizedName = normalizeStatusValue(packing.status.status_name);
  const normalizedCode = normalizeStatusValue(packing.status.status_code);

  return (
    processingStatusVariants.includes(normalizedName) ||
    processingStatusVariants.includes(normalizedCode)
  );
};

const PackingTableTanStack = ({
  packings,
  onViewById,
  onEdit,
  onDelete,
  deleteLoading = false,
  selectedPackings = [],
  onSelectPacking,
  onSelectAllPackings,
  onProcessSelected,
  onCompleteSelected,
  isProcessing = false,
  isCompleting = false,
  hasSelectedPackings = false,
}) => {
  const data = useMemo(() => packings || [], [packings]);

  // 🔍 Global Search State
  const [globalFilter, setGlobalFilter] = useState('');

  // 🔍 Column Filters State
  const [columnFilters, setColumnFilters] = useState([]);

  // 📊 Sorting State
  const [sorting, setSorting] = useState([]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => {
          const isAllSelected =
            packings.length > 0 && selectedPackings.length === packings.length;
          const isIndeterminate =
            selectedPackings.length > 0 && selectedPackings.length < packings.length;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={onSelectAllPackings}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedPackings.includes(row.original.id)}
            onChange={() => onSelectPacking(row.original.id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('packing_number', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Packing Number</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(e) => column.setFilterValue(e.target.value)}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => info.getValue() || 'N/A',
        filterFn: 'includesString',
      }),
      columnHelper.accessor('purchaseOrder.po_number', {
        id: 'po_number',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">PO Number</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(e) => column.setFilterValue(e.target.value)}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => info.getValue() || 'N/A',
        filterFn: 'includesString',
      }),
      columnHelper.accessor('tanggal_packing', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal Packing</div>
            <input
              type="date"
              value={column.getFilterValue() ?? ''}
              onChange={(e) => column.setFilterValue(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Status</div>
            <select
              value={column.getFilterValue() ?? ''}
              onChange={(e) => column.setFilterValue(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Semua</option>
              <option value="PENDING PACKING">Pending</option>
              <option value="PROCESSING PACKING">Processing</option>
              <option value="COMPLETED PACKING">Completed</option>
              <option value="FAILED PACKING">Failed</option>
            </select>
          </div>
        ),
        cell: (info) => (
          <StatusBadge
            status={info.getValue() || 'Unknown'}
            variant={resolveStatusVariant(info.getValue())}
            size="sm"
            dot
          />
        ),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('packingItems', {
        id: 'total_items',
        header: 'Total Items',
        cell: (info) => info.getValue()?.length || 0,
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const packing = row.original;
          const isProcessing = isProcessingStatus(packing);

          return (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => onViewById(packing.id)}
                className="text-indigo-600 hover:text-indigo-900"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => !isProcessing && onEdit(packing)}
                className={`p-1 ${
                  isProcessing
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-900'
                }`}
                title={
                  isProcessing
                    ? 'Packing sedang diproses dan tidak dapat diedit.'
                    : 'Edit'
                }
                disabled={isProcessing}
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(packing.id)}
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
      packings,
      selectedPackings,
      onSelectPacking,
      onSelectAllPackings,
      onViewById,
      onEdit,
      onDelete,
      deleteLoading,
    ]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
      columnFilters,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    globalFilterFn: 'includesString',
  });

  const actionDisabled = isProcessing || isCompleting;

  return (
    <div className="space-y-4">
      {/* 🔍 Global Search Bar */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari di semua kolom (packing number, PO number, status)..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {table.getFilteredRowModel().rows.length} dari {data.length} packing
          </span>
          {(globalFilter || columnFilters.length > 0) && (
            <button
              onClick={() => {
                setGlobalFilter('');
                setColumnFilters([]);
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Process Button */}
      {hasSelectedPackings && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedPackings.length} packing dipilih
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onProcessSelected}
              disabled={actionDisabled}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayIcon className="h-4 w-4" />
              <span>{isProcessing ? 'Memproses...' : 'Proses Packing'}</span>
            </button>
            <button
              onClick={onCompleteSelected}
              disabled={actionDisabled}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              <span>{isCompleting ? 'Menyelesaikan...' : 'Selesaikan Packing'}</span>
            </button>
          </div>
        </div>
      )}

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
                                {typeof header.column.columnDef.header === 'function'
                                  ? header.column.columnDef.header === 'string'
                                    ? header.column.columnDef.header
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )
                                  : header.column.columnDef.header}
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
                  {globalFilter || columnFilters.length > 0
                    ? 'Tidak ada data yang sesuai dengan pencarian'
                    : 'Tidak ada data packing'}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    selectedPackings.includes(row.original.id)
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

      {/* Info Footer */}
      {table.getFilteredRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            Menampilkan <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> packing
            {(globalFilter || columnFilters.length > 0) && (
              <span> (difilter dari <span className="font-medium">{data.length}</span> total)</span>
            )}
          </div>
          {sorting.length > 0 && (
            <div className="text-sm text-gray-500">
              Diurutkan berdasarkan:{' '}
              <span className="font-medium">
                {sorting.map(s => `${s.id} (${s.desc ? 'desc' : 'asc'})`).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PackingTableTanStack;

