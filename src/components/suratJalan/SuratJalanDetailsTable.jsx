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
    maximumFractionDigits: 4,
  });
};

const SuratJalanDetailsTable = ({ details = [], packingBoxes = [] }) => {
  const [columnSizing, setColumnSizing] = useState({});

  const safeDetails = useMemo(() => {
    if (Array.isArray(details) && details.length > 0) {
      return details;
    }
    if (Array.isArray(packingBoxes) && packingBoxes.length > 0) {
      return packingBoxes.flatMap((box, boxIdx) => {
        const boxItems = box.packingBoxItems || box.items || [];
        if (boxItems.length === 0) {
          return [
            {
              id: box.id || `box-${boxIdx}`,
              no_box: box.no_box ?? '-',
              plu: '-',
              nama_barang: '(Empty Box)',
              quantity: Number(box.total_quantity_in_box || 0),
              satuan: '-',
              keterangan: box.keterangan || '-',
            },
          ];
        }
        return boxItems.map((item, itemIdx) => ({
          id: item.id || `${box.id || box.no_box || boxIdx}-${item.itemId || itemIdx}`,
          no_box: box.no_box ?? '-',
          plu: item.item?.plu || item.plu || item.PLU || '-',
          nama_barang: item.nama_barang || item.item?.nama_barang || '-',
          quantity: Number(item.quantity ?? item.qty ?? 0) || 0,
          satuan: item.satuan || item.item?.uom || item.uom || 'pcs',
          keterangan: item.keterangan || '-',
        }));
      });
    }
    return [];
  }, [details, packingBoxes]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_box', {
        id: 'no_box',
        size: 90,
        header: 'No. Box',
        cell: (info) => {
          const val = info.getValue();
          if (!val && val !== 0) return '-';
          return String(val).toLowerCase().startsWith('box') ? val : `Box #${val}`;
        },
      }),
      columnHelper.accessor('plu', {
        id: 'plu',
        size: 100,
        header: 'PLU',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('nama_barang', {
        id: 'nama_barang',
        size: 240,
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
      columnHelper.accessor((row) => Number(row.quantity) || 0, {
        id: 'quantity',
        size: 80,
        header: () => <div className="text-right">Qty</div>,
        cell: (info) => (
          <div className="text-right font-medium">
            {formatNumber(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('satuan', {
        id: 'satuan',
        size: 75,
        header: 'Satuan',
        cell: (info) => info.getValue() || 'pcs',
      }),
      columnHelper.accessor('keterangan', {
        id: 'keterangan',
        size: 160,
        header: 'Keterangan',
        cell: (info) => {
          const val = info.getValue() || '-';
          return (
            <span className="truncate block" title={val}>
              {val}
            </span>
          );
        },
      }),
    ],
    []
  );

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

  if (!safeDetails || safeDetails.length === 0) {
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

export default SuratJalanDetailsTable;
