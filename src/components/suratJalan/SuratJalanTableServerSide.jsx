import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { EyeIcon, PencilIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useSuratJalanQuery } from '../../hooks/useSuratJalanQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  draft: { label: 'Draft', statusCode: 'DRAFT SURAT JALAN' },
  readyToShip: { label: 'Ready to Ship', statusCode: 'READY TO SHIP SURAT JALAN' },
  delivered: { label: 'Delivered', statusCode: 'DELIVERED SURAT JALAN' },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED SURAT JALAN' },
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('delivered') || value.includes('completed')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed')) {
    return 'danger';
  }

  if (value.includes('ready') || value.includes('ship')) {
    return 'primary';
  }

  if (value.includes('draft') || value.includes('pending')) {
    return 'secondary';
  }

  return 'default';
};

const SuratJalanTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
  selectedSuratJalan = [],
  onSelectSuratJalan,
  onSelectAllSuratJalan,
  onProcessSelected,
  isProcessing = false,
  hasSelectedSuratJalan = false,
  initialPage = 1,
  initialLimit = 10,
  activeTab = 'all',
}) => {
  const lockedFilters = useMemo(() => {
    const statusCode = TAB_STATUS_CONFIG[activeTab]?.statusCode;
    if (!statusCode || activeTab === 'all') {
      return [];
    }
    return [{ id: 'status_code', value: statusCode }];
  }, [activeTab]);

  const {
    data: suratJalan,
    pagination,
    setPage,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    resetFilters,
    tableOptions,
  } = useServerSideTable({
    queryHook: useSuratJalanQuery,
    selectData: (response) => response?.suratJalan ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: {
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    },
    lockedFilters,
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => {
          const isAllSelected =
            suratJalan.length > 0 && selectedSuratJalan.length === suratJalan.length;
          const isIndeterminate =
            selectedSuratJalan.length > 0 && selectedSuratJalan.length < suratJalan.length;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={() => onSelectAllSuratJalan && onSelectAllSuratJalan(suratJalan)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedSuratJalan.includes(row.original.id)}
            onChange={() => onSelectSuratJalan && onSelectSuratJalan(row.original.id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('no_surat_jalan', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">No Surat Jalan</div>
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
      columnHelper.accessor('deliver_to', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Deliver To</div>
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
      columnHelper.accessor('PIC', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">PIC</div>
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
      columnHelper.accessor('invoice.no_invoice', {
        id: 'no_invoice',
        header: 'Invoice Number',
        cell: (info) => info.getValue() || 'N/A',
        enableColumnFilter: false,
      }),
      columnHelper.accessor('purchaseOrder.po_number', {
        id: 'po_number',
        header: 'PO Number',
        cell: (info) => info.getValue() || 'N/A',
        enableColumnFilter: false,
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status_code',
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
                  <option value="DRAFT SURAT JALAN">Draft</option>
                  <option value="READY TO SHIP SURAT JALAN">Ready to Ship</option>
                  <option value="DELIVERED SURAT JALAN">Delivered</option>
                  <option value="CANCELLED SURAT JALAN">Cancelled</option>
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
      columnHelper.accessor('is_printed', {
        header: 'Printed',
        cell: (info) => (
          <span className={info.getValue() ? 'text-green-600' : 'text-gray-400'}>
            {info.getValue() ? 'Yes' : 'No'}
          </span>
        ),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created At',
        cell: (info) => {
          const date = new Date(info.getValue());
          return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        },
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const suratJalanItem = row.original;

          return (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => onView(suratJalanItem)}
                className="text-indigo-600 hover:text-indigo-900"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(suratJalanItem)}
                className="text-green-600 hover:text-green-900"
                title="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(suratJalanItem.id)}
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
      suratJalan,
      selectedSuratJalan,
      onSelectSuratJalan,
      onSelectAllSuratJalan,
      onView,
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

  const loading = isLoading || isFetching;

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

      {hasSelectedSuratJalan && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedSuratJalan.length} surat jalan dipilih
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onProcessSelected}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TruckIcon className="h-4 w-4" />
              <span>{isProcessing ? 'Memproses...' : 'Proses Pengiriman'}</span>
            </button>
          </div>
        </div>
      )}

      <DataTable
        table={table}
        isLoading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data surat jalan..."
        emptyMessage="Tidak ada data surat jalan."
        emptyFilteredMessage="Tidak ada data yang sesuai dengan pencarian."
        wrapperClassName="overflow-x-auto"
        tableClassName="min-w-full bg-white border border-gray-200"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-200"
        rowClassName="hover:bg-gray-50"
        getRowClassName={({ row }) =>
          selectedSuratJalan.includes(row.original.id)
            ? 'bg-blue-50 hover:bg-blue-100'
            : undefined
        }
        cellClassName="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
        emptyCellClassName="px-6 py-4 text-center text-gray-500"
      />

      {!loading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="surat jalan"
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </div>
  );
};

export default SuratJalanTableServerSide;
