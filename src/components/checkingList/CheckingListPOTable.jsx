import React, { useMemo, useState } from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DataTable } from '../table';

const columnHelper = createColumnHelper();

const CheckingListPOTable = ({ suratJalan = [] }) => {
  const [columnSizing, setColumnSizing] = useState({});

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
    }));
  }, [suratJalan]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_surat_jalan', {
        id: 'no_surat_jalan',
        header: 'No Surat Jalan',
        cell: (info) => (
          <span className="font-medium text-gray-900">
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('po_number', {
        id: 'po_number',
        header: 'No PO',
        cell: (info) => (
          <span className="text-gray-900">
            {info.getValue() || '-'}
          </span>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      columnSizing,
    },
    onColumnSizingChange: setColumnSizing,
  });

  if (!tableData || tableData.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-gray-500">
        Tidak ada data PO.
      </div>
    );
  }

  return (
    <DataTable
      table={table}
      isLoading={false}
      emptyMessage="Tidak ada data PO."
      wrapperClassName="overflow-x-auto overflow-y-auto max-h-[400px]"
      tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
      headerRowClassName="bg-gray-50"
      headerCellClassName="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
      bodyClassName="bg-white divide-y divide-gray-100"
      rowClassName="hover:bg-gray-50 h-8"
      cellClassName="px-4 py-2 whitespace-nowrap text-xs text-gray-900"
    />
  );
};

export default React.memo(CheckingListPOTable);
