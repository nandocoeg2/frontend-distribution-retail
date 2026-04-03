import React from 'react';
import { formatDate, formatCurrency } from '@/utils/formatUtils';

const rd = (v) => <span className='text-xs text-gray-700'>{v ? formatDate(v) : '-'}</span>;
const rc = (v) => <span className='text-xs text-gray-700'>{v != null && v !== '' ? formatCurrency(v) : '-'}</span>;
const rt = (v) => <span className='text-xs text-gray-700'>{v || '-'}</span>;
const rn = (v) => <span className='text-xs text-gray-700'>{v != null ? v : '-'}</span>;

const columnGroups = [
  {
    id: 'po', label: 'PO', hc: 'bg-blue-50 text-blue-700', align: 'center',
    columns: [
      { id: 'supplier', label: 'Nama Supplier', align: 'left', render: (r) => rt(r.supplier?.name) },
      { id: 'no_po', label: 'No PO', align: 'center', render: (r) => rt(r.no_po) },
      { id: 'items', label: 'Item', align: 'left', render: (r) => rt(r.items?.map((i) => i.item?.nama_barang || i.item?.plu).join(', ')) },
      { id: 'spesifikasi', label: 'Spesifikasi', align: 'left', render: (r) => rt(r.spesifikasi) },
      { id: 'qty_po_pcs', label: 'Qty PO (PCS)', align: 'right', render: (r) => rn(r.qty_po_pcs) },
      { id: 'harga_pcs', label: 'Harga (PCS)', align: 'right', render: (r) => rc(r.harga_pcs) },
      { id: 'total', label: 'Total', align: 'right', render: (r) => rc(r.total) },
    ],
  },
  {
    id: 'barang-masuk', label: 'Barang Masuk', hc: 'bg-green-50 text-green-700', align: 'center',
    columns: [
      { id: 'tanggal_kirim', label: 'Tgl Kirim', align: 'center', render: (r) => rd(r.tanggal_kirim) },
      { id: 'no_surat_jalan', label: 'No. Surat Jalan', align: 'center', render: (r) => rt(r.no_surat_jalan) },
      { id: 'qty_kirim', label: 'Qty Kirim', align: 'right', render: (r) => rn(r.qty_kirim) },
      { id: 'qty_sisa_po', label: 'Qty Sisa PO', align: 'right', render: (r) => rn(r.qty_sisa_po) },
    ],
  },
  {
    id: 'tagihan', label: 'Tagihan', hc: 'bg-amber-50 text-amber-700', align: 'center',
    columns: [
      { id: 'no_kwitansi', label: 'No Kwitansi', align: 'center', render: (r) => rt(r.no_kwitansi) },
      { id: 'no_invoice', label: 'No Invoice', align: 'center', render: (r) => rt(r.no_invoice) },
      { id: 'no_faktur_pajak', label: 'No Faktur Pajak', align: 'center', render: (r) => rt(r.no_faktur_pajak) },
      { id: 'tanggal_faktur_pajak', label: 'Tgl Faktur Pajak', align: 'center', render: (r) => rd(r.tanggal_faktur_pajak) },
      { id: 'dpp', label: 'DPP', align: 'right', render: (r) => rc(r.dpp) },
      { id: 'ppn', label: 'PPN', align: 'right', render: (r) => rc(r.ppn) },
      { id: 'total_invoice', label: 'Total Invoice', align: 'right', render: (r) => rc(r.total_invoice) },
      { id: 'tanggal_ttf', label: 'Tgl TTF', align: 'center', render: (r) => rd(r.tanggal_ttf) },
      { id: 'tanggal_jatuh_tempo', label: 'Tgl Jatuh Tempo', align: 'center', render: (r) => rd(r.tanggal_jatuh_tempo) },
      { id: 'tanggal_payment_list', label: 'Tgl Payment List', align: 'center', render: (r) => rd(r.tanggal_payment_list) },
      { id: 'tanggal_dibayar', label: 'Tgl Dibayar', align: 'center', render: (r) => rd(r.tanggal_dibayar) },
      { id: 'total_dibayar', label: 'Total Dibayar', align: 'right', render: (r) => rc(r.total_dibayar) },
      { id: 'selisih', label: 'Selisih', align: 'right', render: (r) => rc(r.selisih) },
    ],
  },
];

const totalCols = columnGroups.reduce((t, g) => t + g.columns.length, 0) + 1;
const al = (a) => (a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left');

const ReportPoSuppliersTable = ({ data = [], loading = false, selectedId, onSelect }) => (
  <div className='overflow-x-auto'>
    <table className='min-w-full divide-y divide-gray-200 text-xs'>
      <thead className='bg-white'>
        <tr>
          <th rowSpan={2} className='border border-gray-200 bg-gray-50 px-2 py-1.5 text-center w-10'>
            <span className='sr-only'>Pilih</span>
          </th>
          {columnGroups.map((g) => (
            <th key={g.id} colSpan={g.columns.length}
              className={`border border-gray-200 px-2 py-1.5 text-[10px] font-semibold uppercase ${g.hc} ${al(g.align)}`}>
              {g.label}
            </th>
          ))}
        </tr>
        <tr>
          {columnGroups.flatMap((g) =>
            g.columns.map((c) => (
              <th key={`${g.id}-${c.id}`}
                className={`border border-gray-200 bg-gray-50 px-2 py-1 text-[9px] font-semibold uppercase text-gray-600 ${al(c.align)}`}>
                {c.label}
              </th>
            ))
          )}
        </tr>
      </thead>
      <tbody className='bg-white divide-y divide-gray-200'>
        {loading ? (
          <tr>
            <td colSpan={totalCols} className='px-2 py-4 text-center text-xs text-gray-500'>
              <div className='flex items-center justify-center gap-1'>
                <div className='h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent' />
                <span>Memuat...</span>
              </div>
            </td>
          </tr>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={totalCols} className='px-2 py-4 text-center text-xs text-gray-500'>Belum ada data report.</td>
          </tr>
        ) : (
          data.map((row, i) => {
            const rk = row.id || `r-${i}`;
            const sel = selectedId === row.id;
            return (
              <tr key={rk} className={sel ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                <td className='border border-gray-200 px-2 py-1.5 text-center'>
                  <input type='radio' name='rps' checked={sel}
                    onChange={() => onSelect?.(sel ? null : row)}
                    className='h-3.5 w-3.5 cursor-pointer accent-indigo-600'
                    aria-label={`Pilih ${row.supplier?.name || ''}`} />
                </td>
                {columnGroups.flatMap((g) =>
                  g.columns.map((c) => (
                    <td key={`${rk}-${g.id}-${c.id}`}
                      className={`border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 ${al(c.align)}`}>
                      {c.render(row)}
                    </td>
                  ))
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

export default ReportPoSuppliersTable;
