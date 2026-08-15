import React, { useMemo, useState } from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DataTable, TableFooterCell } from '../table';

const columnHelper = createColumnHelper();

const PurchaseOrderDetailsTable = ({ details = [] }) => {
  const [columnSizing, setColumnSizing] = useState({});

  const columns = useMemo(
    () => [
      columnHelper.accessor('plu', {
        id: 'plu',
        size: 90,
        header: 'PLU',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('nama_barang', {
        id: 'nama_barang',
        size: 200,
        header: 'Nama',
        cell: (info) => {
          const val = info.getValue() || '-';
          return (
            <span className="truncate block" title={val}>
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor('total_quantity_order', {
        id: 'total_quantity_order',
        size: 70,
        header: () => <div className="text-right">Qty</div>,
        cell: (info) => (
          <div className="text-right">
            {(info.getValue() || 0).toLocaleString('id-ID')}
          </div>
        ),
      }),
      columnHelper.accessor('harga', {
        id: 'harga',
        size: 95,
        header: () => <div className="text-right">Harga</div>,
        cell: (info) => (
          <div className="text-right">
            {(info.getValue() || 0).toLocaleString('id-ID')}
          </div>
        ),
      }),
      columnHelper.accessor('potongan_a', {
        id: 'potongan_a',
        size: 70,
        header: () => <div className="text-right">Pot A</div>,
        cell: (info) => <div className="text-right">{info.getValue() || '-'}</div>,
      }),
      columnHelper.accessor('harga_after_potongan_a', {
        id: 'harga_after_potongan_a',
        size: 95,
        header: () => <div className="text-right">H. Pot A</div>,
        cell: (info) => {
          const val = info.getValue();
          return (
            <div className="text-right">
              {typeof val === 'number' ? val.toLocaleString('id-ID') : (val || '-')}
            </div>
          );
        },
      }),
      columnHelper.accessor('potongan_b', {
        id: 'potongan_b',
        size: 70,
        header: () => <div className="text-right">Pot B</div>,
        cell: (info) => <div className="text-right">{info.getValue() || '-'}</div>,
      }),
      columnHelper.accessor('harga_after_potongan_b', {
        id: 'harga_after_potongan_b',
        size: 95,
        header: () => <div className="text-right">H. Pot B</div>,
        cell: (info) => {
          const val = info.getValue();
          return (
            <div className="text-right">
              {typeof val === 'number' ? val.toLocaleString('id-ID') : (val || '-')}
            </div>
          );
        },
      }),
      columnHelper.accessor('harga_netto', {
        id: 'harga_netto',
        size: 95,
        header: () => <div className="text-right">Netto</div>,
        cell: (info) => (
          <div className="text-right">
            {(info.getValue() || 0).toLocaleString('id-ID')}
          </div>
        ),
      }),
      columnHelper.accessor('total_pembelian', {
        id: 'total_pembelian',
        size: 105,
        header: () => <div className="text-right">Total</div>,
        cell: (info) => (
          <div className="text-right">
            {(info.getValue() || 0).toLocaleString('id-ID')}
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.vatRate ?? 0, {
        id: 'vatRate',
        size: 70,
        header: () => <div className="text-right">PPN %</div>,
        cell: (info) => <div className="text-right">{info.getValue()}%</div>,
      }),
      columnHelper.accessor(
        (row) => {
          const rate = row.vatRate || 0;
          return (row.total_pembelian || 0) * (rate / 100);
        },
        {
          id: 'ppnAmount',
          size: 95,
          header: () => <div className="text-right">PPN</div>,
          cell: (info) => (
            <div className="text-right">
              {Math.round(info.getValue() || 0).toLocaleString('id-ID')}
            </div>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => {
          const rate = row.vatRate || 0;
          const ppn = (row.total_pembelian || 0) * (rate / 100);
          return (row.total_pembelian || 0) + ppn;
        },
        {
          id: 'grandTotal',
          size: 115,
          header: () => <div className="text-right">Grand Total</div>,
          cell: (info) => (
            <div className="text-right font-semibold">
              {Math.round(info.getValue() || 0).toLocaleString('id-ID')}
            </div>
          ),
        }
      ),
    ],
    []
  );

  const safeDetails = useMemo(() => details || [], [details]);

  const table = useReactTable({
    data: safeDetails,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      columnSizing,
    },
    onColumnSizingChange: setColumnSizing,
  });

  if (!details || details.length === 0) {
    return <div className="py-2 text-center text-xs text-gray-500">No details available.</div>;
  }

  return (
    <DataTable
      table={table}
      isLoading={false}
      emptyMessage="No details available."
      wrapperClassName="overflow-x-auto overflow-y-auto max-h-[400px]"
      tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
      headerRowClassName="bg-gray-50"
      headerCellClassName="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
      bodyClassName="bg-white divide-y divide-gray-100"
      rowClassName="hover:bg-gray-50 h-7"
      cellClassName="px-2 py-0.5 whitespace-nowrap text-xs text-gray-900"
      footerRowClassName="bg-gray-100 font-bold sticky bottom-0 border-t border-gray-300 z-10"
      footerCellClassName="px-2 py-1 text-xs border-t border-gray-300"
      footerContent={
        <tr>
          {table.getVisibleLeafColumns().map((column) => (
            <td
              key={column.id}
              className="px-2 py-1 text-xs border-t border-gray-300 border-r border-gray-200 last:border-r-0"
            >
              <TableFooterCell column={column} table={table} />
            </td>
          ))}
        </tr>
      }
    />
  );
};

export default PurchaseOrderDetailsTable;
