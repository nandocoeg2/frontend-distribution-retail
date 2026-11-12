import React, { useMemo, useState } from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { TrashIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../table';
import { formatDate } from '../../utils/formatUtils';

const columnHelper = createColumnHelper();

const CheckingListPOTable = ({
  suratJalan = [],
  onRemove,
  removeDisabled = false,
  removeDisabledReason = '',
  removingId = null,
}) => {
  const [columnSizing, setColumnSizing] = useState({});
  const [sorting, setSorting] = useState([]);

  const tableData = useMemo(() => {
    const list = Array.isArray(suratJalan)
      ? suratJalan
      : suratJalan
        ? [suratJalan]
        : [];

    return list.map((sj, index) => ({
      id: sj?.id || sj?.suratJalanId || `sj-${index}`,
      no_surat_jalan: sj?.no_surat_jalan || sj?.surat_jalan?.no_surat_jalan || '-',
      po_number:
        sj?.purchaseOrder?.po_number ||
        sj?.po_number ||
        sj?.no_po ||
        sj?.purchase_order?.po_number ||
        '-',
      customer_tujuan:
        sj?.purchaseOrder?.customer?.namaCustomer ||
        sj?.purchaseOrder?.customer?.nama_customer ||
        sj?.customer?.namaCustomer ||
        sj?.deliver_to ||
        sj?.purchaseOrder?.deliver_to ||
        '-',
      invoice:
        sj?.invoice?.no_invoice ||
        sj?.purchaseOrder?.invoice?.no_invoice ||
        '-',
      tanggal: sj?.tanggal_surat_jalan || sj?.tanggal || sj?.createdAt || null,
      raw: sj,
    }));
  }, [suratJalan]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_surat_jalan', {
        id: 'no_surat_jalan',
        header: 'No Surat Jalan',
        cell: (info) => (
          <span className="font-semibold text-gray-900">
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('po_number', {
        id: 'po_number',
        header: 'No PO',
        cell: (info) => (
          <span className="font-medium text-blue-600">
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('customer_tujuan', {
        id: 'customer_tujuan',
        header: 'Customer / Tujuan',
        cell: (info) => (
          <span className="text-gray-700">
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('invoice', {
        id: 'invoice',
        header: 'Invoice',
        cell: (info) => (
          <span className="text-gray-600">
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('tanggal', {
        id: 'tanggal',
        header: 'Tanggal',
        sortingFn: (rowA, rowB, columnId) => {
          const valA = rowA.getValue(columnId);
          const valB = rowB.getValue(columnId);
          const timeA = valA ? new Date(valA).getTime() : 0;
          const timeB = valB ? new Date(valB).getTime() : 0;
          return (Number.isNaN(timeA) ? 0 : timeA) - (Number.isNaN(timeB) ? 0 : timeB);
        },
        cell: (info) => (
          <span className="text-gray-500">
            {info.getValue() ? formatDate(info.getValue()) : '-'}
          </span>
        ),
      }),
      ...(onRemove
        ? [
            columnHelper.display({
              id: 'actions',
              header: 'Aksi',
              enableSorting: false,
              cell: ({ row }) => {
                const item = row.original;
                const isRemoving = removingId === item.id;
                const disabled = removeDisabled || isRemoving;
                return (
                  <button
                    type="button"
                    onClick={() => onRemove(item.raw)}
                    disabled={disabled}
                    title={
                      removeDisabled && removeDisabledReason
                        ? removeDisabledReason
                        : 'Hapus dari checklist'
                    }
                    aria-label={`Hapus ${item.no_surat_jalan} dari checklist`}
                    className="p-1 text-red-600 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                );
              },
            }),
          ]
        : []),
    ],
    [onRemove, removeDisabled, removeDisabledReason, removingId]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      columnSizing,
      sorting,
    },
    onColumnSizingChange: setColumnSizing,
    onSortingChange: setSorting,
  });

  if (!tableData || tableData.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-gray-500">
        Tidak ada data Surat Jalan & Purchase Order.
      </div>
    );
  }

  return (
    <DataTable
      table={table}
      isLoading={false}
      emptyMessage="Tidak ada data Surat Jalan & Purchase Order."
      wrapperClassName="overflow-x-auto overflow-y-auto max-h-[350px]"
      tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
      headerRowClassName="bg-gray-50"
      headerCellClassName="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
      bodyClassName="bg-white divide-y divide-gray-100"
      rowClassName="hover:bg-gray-50 h-8"
      cellClassName="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900"
    />
  );
};

export default React.memo(CheckingListPOTable);
