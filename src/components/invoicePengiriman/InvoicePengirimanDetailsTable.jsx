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

const InvoicePengirimanDetailsTable = ({ details = [], purchaseOrderDetails = [] }) => {
  const [columnSizing, setColumnSizing] = useState({});

  // Enrich invoice details with PO details (discounts and net prices) when available
  const safeDetails = useMemo(() => {
    if (!Array.isArray(details) || details.length === 0) return [];
    if (!Array.isArray(purchaseOrderDetails) || purchaseOrderDetails.length === 0) {
      return details;
    }

    const poByItemId = new Map();
    const poByPlu = new Map();
    const poByName = new Map();

    for (const poItem of purchaseOrderDetails) {
      if (poItem.itemId) {
        poByItemId.set(String(poItem.itemId), poItem);
      }
      const pluKey = (poItem.plu || poItem.PLU || '').trim().toLowerCase();
      if (pluKey) {
        poByPlu.set(pluKey, poItem);
      }
      const nameKey = (poItem.nama_barang || '').trim().toLowerCase();
      if (nameKey) {
        poByName.set(nameKey, poItem);
      }
    }

    return details.map((item) => {
      const itemPlu = (item.PLU || item.plu || '').trim().toLowerCase();
      const itemName = (item.nama_barang || '').trim().toLowerCase();
      const itemIdStr = item.itemId ? String(item.itemId) : '';

      const matchedPo =
        (itemIdStr && poByItemId.get(itemIdStr)) ||
        (itemPlu && poByPlu.get(itemPlu)) ||
        (itemName && poByName.get(itemName)) ||
        null;

      if (!matchedPo) return item;

      return {
        ...item,
        potongan_a: item.potongan_a ?? matchedPo.potongan_a ?? null,
        harga_after_potongan_a:
          item.harga_after_potongan_a ?? matchedPo.harga_after_potongan_a ?? null,
        potongan_b: item.potongan_b ?? matchedPo.potongan_b ?? null,
        harga_after_potongan_b:
          item.harga_after_potongan_b ?? matchedPo.harga_after_potongan_b ?? null,
        harga_netto: item.harga_netto ?? matchedPo.harga_netto ?? null,
        total_pembelian: item.total_pembelian ?? matchedPo.total_pembelian ?? null,
        vatRate: item.vatRate ?? matchedPo.vatRate ?? null,
      };
    });
  }, [details, purchaseOrderDetails]);

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
        (row) => {
          if (row.potongan_a !== undefined && row.potongan_a !== null) {
            return row.potongan_a;
          }
          if (row.potonganA !== undefined && row.potonganA !== null) {
            return row.potonganA;
          }
          if (row.discount_percentage !== undefined && row.discount_percentage !== null) {
            return Number(row.discount_percentage);
          }
          if (row.discountPercentage !== undefined && row.discountPercentage !== null) {
            return Number(row.discountPercentage);
          }
          return null;
        },
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
          const harga = Number(row.harga) || 0;
          const potA = Number(row.potongan_a ?? row.potonganA ?? 0) || 0;
          if (potA > 0) {
            return Number((harga * (1 - potA / 100)).toFixed(2));
          }
          const discPct = Number(row.discount_percentage ?? row.discountPercentage ?? 0) || 0;
          if (discPct > 0) {
            return Number((harga * (1 - discPct / 100)).toFixed(2));
          }
          const discRp = Number(row.discount_rupiah ?? 0) || 0;
          if (discRp > 0) {
            const qty = Number(row.quantity ?? row.qty ?? 1) || 1;
            return Number((harga - discRp / qty).toFixed(2));
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
        (row) => {
          if (row.potongan_b !== undefined && row.potongan_b !== null) {
            return row.potongan_b;
          }
          if (row.potonganB !== undefined && row.potonganB !== null) {
            return row.potonganB;
          }
          return null;
        },
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
          if (row.harga_netto !== undefined && row.harga_netto !== null) {
            return Number(row.harga_netto);
          }
          const harga = Number(row.harga) || 0;
          const potA = Number(row.potongan_a ?? row.potonganA ?? 0) || 0;
          const hargaA = potA > 0 ? harga * (1 - potA / 100) : harga;
          const potB = Number(row.potongan_b ?? row.potonganB ?? 0) || 0;
          if (potB > 0) {
            return Number((hargaA * (1 - potB / 100)).toFixed(2));
          }
          // If no separate potB is recorded but DPP exists and is less than gross total
          const dpp = Number(row.dasar_pengenaan_pajak);
          const qty = Number(row.quantity ?? row.qty ?? 0) || 0;
          if (!Number.isNaN(dpp) && dpp > 0 && qty > 0) {
            return Number((dpp / qty).toFixed(2));
          }
          return Number(hargaA.toFixed(2));
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
          // Priority 1: dasar_pengenaan_pajak (Net subtotal before tax / DPP)
          if (
            row.dasar_pengenaan_pajak !== undefined &&
            row.dasar_pengenaan_pajak !== null &&
            row.dasar_pengenaan_pajak !== ''
          ) {
            return Number(row.dasar_pengenaan_pajak);
          }
          // Priority 2: total_pembelian from PO
          if (
            row.total_pembelian !== undefined &&
            row.total_pembelian !== null &&
            row.total_pembelian !== ''
          ) {
            return Number(row.total_pembelian);
          }
          // Priority 3: qty * net price
          const qty = Number(row.quantity ?? row.qty ?? 0) || 0;
          const netPrice =
            Number(
              row.harga_after_potongan_b ??
                row.harga_netto ??
                row.harga_after_potongan_a ??
                row.harga ??
                0
            ) || 0;
          return Number((qty * netPrice).toFixed(2));
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
          const ppn = row.ppnRupiah ?? row.ppn_rupiah;
          if (ppn !== undefined && ppn !== null && ppn !== '') {
            return Number(ppn);
          }
          const rate = Number(row.PPN_pecentage ?? row.ppn_percentage ?? row.vatRate ?? 0) || 0;
          const dpp =
            row.dasar_pengenaan_pajak !== undefined &&
            row.dasar_pengenaan_pajak !== null &&
            row.dasar_pengenaan_pajak !== ''
              ? Number(row.dasar_pengenaan_pajak)
              : (Number(row.quantity ?? row.qty ?? 0) || 0) *
                (Number(
                  row.harga_after_potongan_b ??
                    row.harga_netto ??
                    row.harga_after_potongan_a ??
                    row.harga ??
                    0
                ) || 0);
          return Number(((dpp * rate) / 100).toFixed(2));
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
          let dpp = 0;
          if (
            row.dasar_pengenaan_pajak !== undefined &&
            row.dasar_pengenaan_pajak !== null &&
            row.dasar_pengenaan_pajak !== ''
          ) {
            dpp = Number(row.dasar_pengenaan_pajak);
          } else if (
            row.total_pembelian !== undefined &&
            row.total_pembelian !== null &&
            row.total_pembelian !== ''
          ) {
            dpp = Number(row.total_pembelian);
          } else {
            const qty = Number(row.quantity ?? row.qty ?? 0) || 0;
            const netPrice =
              Number(
                row.harga_after_potongan_b ??
                  row.harga_netto ??
                  row.harga_after_potongan_a ??
                  row.harga ??
                  0
              ) || 0;
            dpp = qty * netPrice;
          }

          const ppnRaw = row.ppnRupiah ?? row.ppn_rupiah;
          const rate = Number(row.PPN_pecentage ?? row.ppn_percentage ?? row.vatRate ?? 0) || 0;
          const ppn =
            ppnRaw !== undefined && ppnRaw !== null && ppnRaw !== ''
              ? Number(ppnRaw)
              : (dpp * rate) / 100;

          return Number((dpp + ppn).toFixed(2));
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

export default React.memo(InvoicePengirimanDetailsTable);
