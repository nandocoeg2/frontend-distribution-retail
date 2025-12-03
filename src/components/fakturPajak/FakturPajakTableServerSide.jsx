import React, { useMemo } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useFakturPajakQuery } from '../../hooks/useFakturPajakQuery';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';

const columnHelper = createColumnHelper();

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
  onDelete,
  onGenerateTandaTerimaFaktur,
  generatingTandaTerimaFakturPajakId,
  deleteLoading = false,
  initialPage = 1,
  initialLimit = 10,
  selectedFakturPajakId = null,
}) => {

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
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_pajak', {
        id: 'no_pajak',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">No Faktur</div>
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
              <div className="text-xs font-medium text-gray-900">
                {info.getValue() || '-'}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.invoicePenagihan, {
        id: 'no_invoice_penagihan',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">No Invoice</div>
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
            return <div className="text-xs text-gray-900">-</div>;
          }
          return (
            <div className="text-xs text-gray-900">
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
          <div className="space-y-1">
            <div className="font-medium text-xs">Tgl Invoice</div>
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
            return <div className="text-xs text-gray-900">-</div>;
          }
          return (
            <div className="text-xs text-gray-900">
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
          <div className="space-y-1">
            <div className="font-medium text-xs">No LPB</div>
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
              <div className="text-xs text-gray-900">{info.getValue() || '-'}</div>
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
          <div className="space-y-1">
            <div className="font-medium text-xs">Customer</div>
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
              <div className="text-xs text-gray-900">{info.getValue() || '-'}</div>
              {item?.customer?.groupCustomer?.nama_group && (
                <div className="text-xs text-gray-500">
                  {item.customer.groupCustomer?.nama_group}
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
      columnHelper.accessor('ppnRupiah', {
        id: 'ppnRupiah',
        header: 'PPN Rupiah',
        enableSorting: true,
        cell: (info) => {
          const item = info.row.original;
          return (
            <div className="text-right">
              <div className="text-xs text-gray-900">
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
              <div className="text-xs text-gray-900">{info.getValue() || '-'}</div>
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
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Status</div>
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
      }),
      columnHelper.display({
        id: 'tandaTerimaFaktur',
        header: 'Tanda Terima Faktur',
        cell: ({ row }) => {
          const fakturPajak = row.original;
          const isGenerating = generatingTandaTerimaFakturPajakId === fakturPajak.id;
          const hasTTF = Boolean(fakturPajak?.tandaTerimaFakturId || fakturPajak?.tandaTerimaFaktur?.id);

          return (
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center space-x-2">
                {isGenerating && (
                  <span className="w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
                )}
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                  checked={hasTTF}
                  onChange={(event) => {
                    if (event.target.checked && onGenerateTandaTerimaFaktur) {
                      onGenerateTandaTerimaFaktur(fakturPajak);
                    }
                  }}
                  disabled={hasTTF || isGenerating}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {fakturPajak?.tandaTerimaFaktur?.code_supplier && (
                <span className="text-xs text-gray-500">
                  {fakturPajak.tandaTerimaFaktur.code_supplier}
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
          const fakturPajak = row.original;
          return (
            <div className="flex items-center justify-end space-x-2">
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(fakturPajak);
                  }}
                  className="p-1 text-red-600 hover:text-red-900"
                  title="Hapus"
                  disabled={deleteLoading}
                >
                  <TrashIcon className="h-4 w-4" />
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
      onDelete,
      onGenerateTandaTerimaFaktur,
      generatingTandaTerimaFakturPajakId,
      deleteLoading,
      setPage,
      selectedFakturPajakId,
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
        wrapperClassName="overflow-x-auto"
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-gray-50 cursor-pointer h-8"
        getRowClassName={({ row }) => {
          if (!row || !row.original) {
            return undefined;
          }
          if (row.original.id === selectedFakturPajakId) {
            return 'bg-blue-50 border-l-4 border-blue-500';
          }
          return undefined;
        }}
        onRowClick={(rowData, event) => {
          if (onView) {
            onView(rowData);
          }
        }}
        cellClassName="px-2 py-1 whitespace-nowrap text-xs text-gray-900"
        emptyCellClassName="px-2 py-1 text-center text-xs text-gray-500"
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
