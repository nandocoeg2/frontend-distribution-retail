import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useCheckingListQuery } from '../../hooks/useCheckingListQuery';
import { formatDateTime } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

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

const resolveStatusVariant = (status) => {
  const statusText = typeof status === 'string' 
    ? status 
    : status?.status_name || status?.status_code || '';
  
  const value = statusText.toLowerCase();

  if (!value) {
    return 'secondary';
  }

  if (value.includes('completed') || value.includes('selesai') || value.includes('success')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('canceled') || value.includes('failed') || value.includes('batal')) {
    return 'danger';
  }

  if (value.includes('processed') && !value.includes('processing')) {
    return 'primary';
  }

  if (value.includes('processing') || value.includes('proses') || value.includes('in progress')) {
    return 'warning';
  }

  if (value.includes('pending') || value.includes('menunggu') || value.includes('waiting')) {
    return 'secondary';
  }

  return 'default';
};

const resolveStatusText = (status) => {
  if (typeof status === 'string') {
    return status;
  }
  if (!status) {
    return null;
  }
  return status.status_name || status.status_code || null;
};

const CheckingListTableServerSide = ({
  onViewDetail,
  onEdit,
  onDelete,
  deleteLoading = false,
  selectedChecklistId = null,
  initialPage = 1,
  initialLimit = 10,
}) => {
  const globalFilterConfig = useMemo(
    () => ({
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    }),
    []
  );

  const {
    data: checklists,
    pagination,
    setPage,
    hasActiveFilters,
    isLoading,
    error,
    resetFilters,
    tableOptions,
  } = useServerSideTable({
    queryHook: useCheckingListQuery,
    selectData: (response) => response?.checklists ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('tanggal', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal Checklist</div>
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
      columnHelper.accessor('no_checklist_surat_jalan', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">No Checklist</div>
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
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Surat Jalan</div>
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
      columnHelper.accessor('status', {
        header: 'Status Checklist',
        cell: (info) => {
          const status = info.getValue();
          const statusText = resolveStatusText(status);
          
          if (!statusText) {
            return <span className="text-sm text-gray-400">-</span>;
          }

          return (
            <StatusBadge
              status={statusText}
              variant={resolveStatusVariant(status)}
              size="sm"
              dot
            />
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
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(checklist);
                }}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                <PencilIcon className="mr-1 h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && checklistId && onDelete(checklistId);
                }}
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
    [onEdit, onDelete, deleteLoading]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  return (
    <div className="space-y-4">
      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
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
          <DataTable
            table={table}
            isLoading={isLoading}
            error={error}
            hasActiveFilters={hasActiveFilters}
            loadingMessage="Memuat data checklist surat jalan..."
            emptyMessage="Belum ada checklist surat jalan."
            emptyFilteredMessage="Tidak ada checklist surat jalan yang cocok dengan pencarian."
            wrapperClassName="overflow-x-auto rounded-xl border border-gray-200 shadow-sm"
            tableClassName="min-w-full divide-y divide-gray-200 bg-white"
            headerRowClassName="bg-gray-50"
            headerCellClassName="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
            bodyClassName="divide-y divide-gray-200 bg-white"
            rowClassName={({ row }) => {
              const checklistId = resolveChecklistId(row.original);
              return `transition-colors ${
                selectedChecklistId === checklistId
                  ? 'bg-blue-50 hover:bg-blue-100'
                  : 'hover:bg-gray-50'
              }`;
            }}
            cellClassName="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            onRowClick={(checklist) => {
              onViewDetail && onViewDetail(checklist);
            }}
            emptyCellClassName="px-6 py-6 text-center text-sm text-gray-500"
          />

          <DataTablePagination
            table={table}
            pagination={pagination}
            itemLabel="checklist"
            pageSizeOptions={[5, 10, 20, 50, 100]}
          />
        </>
      )}
    </div>
  );
};

export default CheckingListTableServerSide;

