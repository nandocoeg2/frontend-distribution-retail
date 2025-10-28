import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { usePackingsQuery } from '../../hooks/usePackingsQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: { label: 'Pending', statusCode: 'PENDING PACKING' },
  processing: { label: 'Processing', statusCode: 'PROCESSING PACKING' },
  completed: { label: 'Completed', statusCode: 'COMPLETED PACKING' },
  failed: { label: 'Failed', statusCode: 'FAILED PACKING' },
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('delivered') || value.includes('complete')) {
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

const PackingTableServerSide = ({
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
  initialPage = 1,
  initialLimit = 10,
  activeTab = 'all',
}) => {
  const lockedFilters = useMemo(() => {
    const statusCode = TAB_STATUS_CONFIG[activeTab]?.statusCode;
    if (!statusCode || activeTab === 'all') {
      return [];
    }
    return [{ id: 'status', value: statusCode }];
  }, [activeTab]);

  const globalFilterConfig = useMemo(
    () => ({
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    }),
    []
  );

  const {
    data: packings,
    pagination,
    setPage,
    hasActiveFilters,
    resetFilters,
    isLoading,
    error,
    tableOptions,
  } = useServerSideTable({
    queryHook: usePackingsQuery,
    selectData: (response) => response?.packings ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    lockedFilters,
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => {
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
        cell: (info) => info.getValue() || 'N/A',
      }),
      columnHelper.accessor('purchaseOrder.po_number', {
        id: 'po_number',
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
        cell: (info) => info.getValue() || 'N/A',
      }),
      columnHelper.accessor('tanggal_packing', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal Packing</div>
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
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status',
        header: ({ column }) => {
          const statusConfig = TAB_STATUS_CONFIG[activeTab];
          const isLocked = activeTab !== 'all' && statusConfig?.statusCode;

          return (
            <div className="space-y-2">
              <div className="font-medium">Status</div>
              {isLocked ? (
                <div className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                  {statusConfig?.label || 'N/A'}
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
                  <option value="PENDING PACKING">Pending</option>
                  <option value="PROCESSING PACKING">Processing</option>
                  <option value="COMPLETED PACKING">Completed</option>
                  <option value="FAILED PACKING">Failed</option>
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
      columnHelper.accessor('packingItems', {
        id: 'total_items',
        header: 'Total Items',
        cell: (info) => info.getValue()?.length || 0,
        enableColumnFilter: false,
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const packing = row.original;
          const processing = isProcessingStatus(packing);

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
                onClick={() => !processing && onEdit(packing)}
                className={`p-1 ${
                  processing
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-900'
                }`}
                title={
                  processing
                    ? 'Packing sedang diproses dan tidak dapat diedit.'
                    : 'Edit'
                }
                disabled={processing}
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
      activeTab,
      setPage,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  const actionDisabled = isProcessing || isCompleting;

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

      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data packing..."
        emptyMessage="Tidak ada data packing"
        emptyFilteredMessage="Tidak ada data yang sesuai dengan pencarian"
        tableClassName="min-w-full bg-white border border-gray-200"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-200"
        rowClassName="hover:bg-gray-50"
        getRowClassName={({ row }) =>
          selectedPackings.includes(row.original.id)
            ? 'bg-blue-50 hover:bg-blue-100'
            : undefined
        }
        cellClassName="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
        emptyCellClassName="px-6 py-4 text-center text-gray-500"
      />

      {!isLoading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="packing"
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </div>
  );
};

export default PackingTableServerSide;
