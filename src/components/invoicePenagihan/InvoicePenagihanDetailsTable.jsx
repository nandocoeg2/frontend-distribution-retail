import React, { useMemo, useState } from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DataTable, TableFooterCell } from '../table';

const columnHelper = createColumnHelper();

const formatNumber = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const InvoicePenagihanDetailsTable = ({ details = [] }) => {
  const [columnSizing, setColumnSizing] = useState({});

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.PLU || row.plu || '-', {
        id: 'plu',
        size: 90,
        header: 'PLU',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('nama_barang', {
        id: 'nama_barang',
        size: 220,
        header: 'Nama Barang',
        cell: (info) => {
          const val = info.getValue() || '-';
          return (
            <span className="truncate block" title={val}>
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor((row) => row.quantity ?? row.qty ?? 0, {
        id: 'quantity',
        size: 85,
        header: () => <div className="text-right">QTY</div>,
        cell: (info) => (
          <div className="text-right">
            {formatNumber(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('satuan', {
        id: 'satuan',
        size: 75,
        header: 'Satuan',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor((row) => Number(row.harga) || 0, {
        id: 'harga',
        size: 110,
        header: () => <div className="text-right">Harga</div>,
        cell: (info) => (
          <div className="text-right">
            {formatNumber(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor(
        (row) =>
          row.potongan_a ??
          row.potonganA ??
          row.discount_percentage ??
          row.discountPercentage ??
          null,
        {
          id: 'potongan_a',
          size: 80,
          header: () => <div className="text-right">Pot A</div>,
          cell: (info) => {
            const val = info.getValue();
            if (val === null || val === undefined || val === '') return <div className="text-right">-</div>;
            const num = Number(val);
            if (!Number.isNaN(num)) return <div className="text-right">{num}%</div>;
            return (
              <div className="text-right">
                {val.toString().endsWith('%') ? val : `${val}%`}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          if (row.harga_after_potongan_a !== undefined && row.harga_after_potongan_a !== null) {
            return Number(row.harga_after_potongan_a);
          }
          if (row.hargaAfterPotonganA !== undefined && row.hargaAfterPotonganA !== null) {
            return Number(row.hargaAfterPotonganA);
          }
          const potA = Number(row.potongan_a ?? row.potonganA ?? row.discount_percentage ?? 0) || 0;
          const harga = Number(row.harga) || 0;
          if (potA > 0) {
            return harga * (1 - potA / 100);
          }
          const discRp = Number(row.discount_rupiah ?? 0) || 0;
          if (discRp > 0) {
            return harga - discRp;
          }
          return harga;
        },
        {
          id: 'harga_after_potongan_a',
          size: 115,
          header: () => <div className="text-right">Harga Pot A</div>,
          cell: (info) => (
            <div className="text-right">
              {formatNumber(info.getValue())}
            </div>
          ),
        }
      ),
      columnHelper.accessor(
        (row) =>
          row.potongan_b ??
          row.potonganB ??
          null,
        {
          id: 'potongan_b',
          size: 80,
          header: () => <div className="text-right">Pot B</div>,
          cell: (info) => {
            const val = info.getValue();
            if (val === null || val === undefined || val === '') return <div className="text-right">-</div>;
            const num = Number(val);
            if (!Number.isNaN(num)) return <div className="text-right">{num}%</div>;
            return (
              <div className="text-right">
                {val.toString().endsWith('%') ? val : `${val}%`}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          if (row.harga_after_potongan_b !== undefined && row.harga_after_potongan_b !== null) {
            return Number(row.harga_after_potongan_b);
          }
          if (row.hargaAfterPotonganB !== undefined && row.hargaAfterPotonganB !== null) {
            return Number(row.hargaAfterPotonganB);
          }
          const potB = Number(row.potongan_b ?? row.potonganB ?? 0) || 0;
          const potA = Number(row.potongan_a ?? row.potonganA ?? row.discount_percentage ?? 0) || 0;
          const harga = Number(row.harga) || 0;
          const hargaA = potA > 0 ? harga * (1 - potA / 100) : harga;
          if (potB > 0) {
            return hargaA * (1 - potB / 100);
          }
          return hargaA;
        },
        {
          id: 'harga_after_potongan_b',
          size: 115,
          header: () => <div className="text-right">Harga Pot B</div>,
          cell: (info) => (
            <div className="text-right">
              {formatNumber(info.getValue())}
            </div>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => {
          if (row.total !== undefined && row.total !== null && row.total !== '') {
            return Number(row.total);
          }
          if (row.dasar_pengenaan_pajak !== undefined && row.dasar_pengenaan_pajak !== null && row.dasar_pengenaan_pajak !== '') {
            return Number(row.dasar_pengenaan_pajak);
          }
          const qty = Number(row.quantity ?? row.qty ?? 0) || 0;
          const harga = Number(row.harga_after_potongan_b ?? row.harga_after_potongan_a ?? row.harga ?? 0) || 0;
          return qty * harga;
        },
        {
          id: 'total',
          size: 120,
          header: () => <div className="text-right">Total</div>,
          cell: (info) => (
            <div className="text-right">
              {formatNumber(info.getValue())}
            </div>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => {
          const ppn = row.ppn_rupiah ?? row.ppnRupiah;
          if (ppn !== undefined && ppn !== null && ppn !== '') {
            return Number(ppn);
          }
          const rate = Number(row.PPN_pecentage ?? row.ppn_percentage ?? 0) || 0;
          const total = Number(row.total ?? row.dasar_pengenaan_pajak ?? 0) || 0;
          return total * (rate / 100);
        },
        {
          id: 'ppnRupiah',
          size: 100,
          header: () => <div className="text-right">PPN Rp</div>,
          cell: (info) => (
            <div className="text-right">
              {formatNumber(info.getValue())}
            </div>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => {
          let total = 0;
          if (row.total !== undefined && row.total !== null && row.total !== '') {
            total = Number(row.total);
          } else if (row.dasar_pengenaan_pajak !== undefined && row.dasar_pengenaan_pajak !== null && row.dasar_pengenaan_pajak !== '') {
            total = Number(row.dasar_pengenaan_pajak);
          } else {
            const qty = Number(row.quantity ?? row.qty ?? 0) || 0;
            const harga = Number(row.harga_after_potongan_b ?? row.harga_after_potongan_a ?? row.harga ?? 0) || 0;
            total = qty * harga;
          }
          const ppnRaw = row.ppn_rupiah ?? row.ppnRupiah;
          const ppn =
            ppnRaw !== undefined && ppnRaw !== null && ppnRaw !== ''
              ? Number(ppnRaw)
              : total * ((Number(row.PPN_pecentage ?? row.ppn_percentage ?? 0) || 0) / 100);
          return total + ppn;
        },
        {
          id: 'grandTotal',
          size: 130,
          header: () => <div className="text-right">Grand Total</div>,
          cell: (info) => (
            <div className="text-right font-semibold">
              {formatNumber(info.getValue())}
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
    return <div className="py-2 text-center text-xs text-gray-500">Tidak ada detail barang</div>;
  }

  return (
    <DataTable
      table={table}
      isLoading={false}
      emptyMessage="Tidak ada detail barang"
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

export default InvoicePenagihanDetailsTable;
