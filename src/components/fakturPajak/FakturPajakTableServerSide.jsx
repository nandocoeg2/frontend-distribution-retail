import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useFakturPajakQuery } from '../../hooks/useFakturPajakQuery';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

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

const formatRangeSummary = ({ pagination }) => {
  const currentPage = pagination?.currentPage ?? 1;
  const itemsPerPage = pagination?.itemsPerPage ?? 10;
  const totalItems = pagination?.totalItems ?? 0;

  if (totalItems === 0) {
    return (
      <span className="text-sm text-gray-700">
        Menampilkan <span className="font-medium">0</span> dari{' '}
        <span className="font-medium">0</span> data
      </span>
    );
  }

  const start = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <span className="text-sm text-gray-700">
      Menampilkan <span className="font-medium">{start}</span> -{' '}
      <span className="font-medium">{end}</span> dari{' '}
      <span className="font-medium">{totalItems}</span> data
    </span>
  );
};

const FakturPajakTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
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

  const {
    data: fakturPajaks,
    pagination,
    setPage,
    resetFilters,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    tableOptions,
  } = useServerSideTable({
    queryHook: useFakturPajakQuery,
    selectData: (response) => response?.fakturPajaks ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    lockedFilters,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_pajak', {
        id: 'no_pajak',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Nomor Faktur</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter nomor faktur..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
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
      }),
      columnHelper.accessor((row) => row.invoicePenagihan, {
        id: 'no_invoice_penagihan',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Nomor Invoice</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter nomor invoice..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const invoices = info.getValue();
          if (!invoices || invoices.length === 0) {
            return <div className="text-sm text-gray-900">-</div>;
          }
          return (
            <div className="text-sm text-gray-900">
              {invoices.map((invoice, index) => (
                <div key={invoice.id || index}>
                  {invoice.no_invoice_penagihan || '-'}
                </div>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.invoicePenagihan, {
        id: 'tanggal_invoice',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Tanggal Invoice</div>
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
        cell: (info) => {
          const invoices = info.getValue();
          if (!invoices || invoices.length === 0) {
            return <div className="text-sm text-gray-900">-</div>;
          }
          return (
            <div className="text-sm text-gray-900">
              {invoices.map((invoice, index) => (
                <div key={invoice.id || index}>
                  {formatDate(invoice.tanggal)}
                </div>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.laporanPenerimaanBarang?.no_lpb, {
        id: 'no_lpb',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Nomor LPB</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter nomor LPB..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const item = info.row.original;
          return (
            <div>
              <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
              {item?.laporanPenerimaanBarang?.tanggal_terima && (
                <div className="text-xs text-gray-500">
                  {formatDate(item.laporanPenerimaanBarang.tanggal_terima)}
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.customer?.namaCustomer, {
        id: 'customer',
        header: ({ column }) => (
          <div className="space-y-2">
            <div className="font-medium">Nama Customer</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter customer..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const item = info.row.original;
          return (
            <div>
              <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
              {item?.customer?.kodeCustomer && (
                <div className="text-xs text-gray-500">
                  {item.customer.kodeCustomer}
                </div>
              )}
            </div>
          );
        },
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
              <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
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
      setPage,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  return (
    <div className="space-y-4">
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

      <DataTable
        table={table}
        isLoading={isLoading || isFetching}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data..."
        emptyMessage="Tidak ada data faktur pajak"
        emptyFilteredMessage="Tidak ada data yang sesuai dengan pencarian"
        wrapperClassName="overflow-x-auto border border-gray-200 rounded-lg"
        tableClassName="min-w-full divide-y divide-gray-200"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
        bodyClassName="bg-white divide-y divide-gray-200"
        rowClassName="hover:bg-gray-50"
        cellClassName="px-6 py-4 whitespace-nowrap"
        emptyCellClassName="px-6 py-8 text-center text-gray-500"
      />

      {!isLoading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="data"
          pageSizeOptions={[10, 25, 50, 100]}
          summaryFormatter={formatRangeSummary}
          containerClassName="flex items-center justify-between"
          controlsWrapperClassName="flex items-center space-x-2"
          showGoTo={false}
          firstLabel="««"
          prevLabel="«"
          nextLabel="»"
          lastLabel="»»"
        />
      )}
    </div>
  );
};

export default FakturPajakTableServerSide;
