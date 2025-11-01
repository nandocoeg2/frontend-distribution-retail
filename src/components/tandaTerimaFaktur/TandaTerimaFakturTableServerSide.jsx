import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { EyeIcon, LinkIcon, LinkSlashIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useTandaTerimaFakturQuery } from '../../hooks/useTandaTerimaFakturQuery';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: { label: 'Pending', statusCode: 'PENDING TANDA TERIMA FAKTUR' },
  processing: { label: 'Processing', statusCode: 'PROCESSING TANDA TERIMA FAKTUR' },
  delivered: { label: 'Delivered', statusCode: 'DELIVERED TANDA TERIMA FAKTUR' },
  received: { label: 'Received', statusCode: 'RECEIVED TANDA TERIMA FAKTUR' },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED TANDA TERIMA FAKTUR' },
  completed: { label: 'Completed', statusCode: 'COMPLETED TANDA TERIMA FAKTUR' },
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
  onAssignDocuments,
  onUnassignDocuments,
  deleteLoading = false,
  assignLoading = false,
  unassignLoading = false,
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
    data: tandaTerimaFakturs,
    pagination,
    setPage,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    resetFilters,
    tableOptions,
  } = useServerSideTable({
    queryHook: useTandaTerimaFakturQuery,
    selectData: (response) => response?.tandaTerimaFakturs ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    lockedFilters,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('tanggal', {
        header: 'Tanggal',
        enableSorting: true,
        cell: (info) => formatDate(info.getValue()),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('termOfPayment.kode_top', {
        id: 'kode_top',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">TOP</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter TOP..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
              {row?.termOfPayment?.batas_hari != null && (
                <div className="text-xs text-gray-500">{row.termOfPayment.batas_hari} hari</div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor(
        (row) =>
          row?.groupCustomer?.nama_group ??
          row?.groupCustomer?.namaGroup ??
          row?.customer?.groupCustomer?.nama_group ??
          row?.customer?.groupCustomer?.namaGroup ??
          '',
        {
          id: 'customer_name',
          header: ({ column }) => (
            <div className="space-y-2">
              <div className="font-medium">Nama Group Customer</div>
              <input
                type="text"
                value={column.getFilterValue() ?? ''}
                onChange={(event) => {
                  column.setFilterValue(event.target.value);
                  setPage(1);
                }}
                placeholder="Filter nama group..."
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          ),
          cell: (info) => info.getValue() || '-',
        }
      ),
      columnHelper.accessor(
        (row) =>
          row?.groupCustomer?.kode_group ??
          row?.groupCustomer?.kodeGroup ??
          row?.customer?.groupCustomer?.kode_group ??
          row?.customer?.groupCustomer?.kodeGroup ??
          '',
        {
          id: 'customer_code',
          header: ({ column }) => (
            <div className="space-y-2">
              <div className="font-medium">Kode Group Customer</div>
              <input
                type="text"
                value={column.getFilterValue() ?? ''}
                onChange={(event) => {
                  column.setFilterValue(event.target.value);
                  setPage(1);
                }}
                placeholder="Filter kode group..."
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          ),
          cell: (info) => info.getValue() || '-',
        }
      ),
      columnHelper.accessor('company.nama_perusahaan', {
        id: 'company_name',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Nama Company</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter company..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
              {row?.company?.kode_company && (
                <div className="text-xs text-gray-500">{row.company.kode_company}</div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('code_supplier', {
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Kode Supplier</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter supplier..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="text-sm font-medium text-gray-900">{info.getValue() || '-'}</div>
              <div className="text-xs text-gray-500">ID: {row.id || '-'}</div>
            </div>
          );
        },
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
                  <option value="PENDING TANDA TERIMA FAKTUR">Pending</option>
                  <option value="PROCESSING TANDA TERIMA FAKTUR">Processing</option>
                  <option value="DELIVERED TANDA TERIMA FAKTUR">Delivered</option>
                  <option value="RECEIVED TANDA TERIMA FAKTUR">Received</option>
                  <option value="CANCELLED TANDA TERIMA FAKTUR">Cancelled</option>
                  <option value="COMPLETED TANDA TERIMA FAKTUR">Completed</option>
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
      columnHelper.accessor('grand_total', {
        header: 'Grand Total',
        enableSorting: true,
        cell: (info) => formatCurrency(info.getValue()),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        enableSorting: true,
        cell: (info) => formatDateTime(info.getValue()),
        enableColumnFilter: false,
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Updated',
        enableSorting: true,
        cell: (info) => formatDateTime(info.getValue()),
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'documents',
        header: 'Dokumen',
        cell: ({ row }) => {
          const item = row.original;
          const laporanCount = Array.isArray(item?.laporanPenerimaanBarang)
            ? item.laporanPenerimaanBarang.length
            : 0;
          const invoiceCount = Array.isArray(item?.invoicePenagihan)
            ? item.invoicePenagihan.length
            : 0;
          const fakturCount = Array.isArray(item?.fakturPajak)
            ? item.fakturPajak.length
            : 0;
          const hasAssignedDocuments =
            laporanCount > 0 || invoiceCount > 0 || fakturCount > 0;
          const disableAssign = assignLoading || typeof onAssignDocuments !== 'function';
          const disableUnassign =
            unassignLoading ||
            typeof onUnassignDocuments !== 'function' ||
            !hasAssignedDocuments;

          return (
            <div className="flex items-center justify-between space-x-3">
              <div className="text-xs leading-tight text-gray-500">
                <div>LPB: {laporanCount}</div>
                <div>Invoice: {invoiceCount}</div>
                <div>Faktur: {fakturCount}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onAssignDocuments?.(item)}
                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Assign dokumen"
                  disabled={disableAssign}
                >
                  <LinkIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onUnassignDocuments?.(item)}
                  className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Unassign dokumen"
                  disabled={disableUnassign}
                >
                  <LinkSlashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => onView(item)}
                className="text-indigo-600 hover:text-indigo-900"
                title="Lihat detail"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="text-green-600 hover:text-green-900"
                title="Ubah"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                disabled={deleteLoading}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hapus"
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
      tandaTerimaFakturs,
      onView,
      onEdit,
      onDelete,
      onAssignDocuments,
      onUnassignDocuments,
      deleteLoading,
      assignLoading,
      unassignLoading,
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

      <DataTable
        table={table}
        isLoading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data tanda terima faktur..."
        emptyMessage="Tidak ada data tanda terima faktur."
        emptyFilteredMessage="Tidak ada data yang sesuai dengan pencarian."
        wrapperClassName="overflow-x-auto border border-gray-200 rounded-lg"
        tableClassName="min-w-full divide-y divide-gray-200"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
        bodyClassName="bg-white divide-y divide-gray-200"
        rowClassName="hover:bg-gray-50"
        cellClassName="px-6 py-4 whitespace-nowrap"
        emptyCellClassName="px-6 py-8 text-center text-gray-500"
      />

      {!loading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="tanda terima faktur"
          pageSizeOptions={[10, 25, 50, 100]}
          firstLabel="««"
          prevLabel="«"
          nextLabel="»"
          lastLabel="»»"
        />
      )}
    </div>
  );
};

export default TandaTerimaFakturTableServerSide;
