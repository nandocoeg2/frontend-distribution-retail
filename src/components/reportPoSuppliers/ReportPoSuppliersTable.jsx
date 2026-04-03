import React from 'react';
import { formatDate, formatCurrency } from '@/utils/formatUtils';

const renderDate = (v) => (
  <span className='text-xs text-gray-700'>{v ? formatDate(v) : '-'}</span>
);

const renderCurrency = (v) => (
  <span className='text-xs text-gray-700'>
    {v !== null && v !== undefined && v !== '' ? formatCurrency(v) : '-'}
  </span>
);

const renderText = (v) => (
  <span className='text-xs text-gray-700'>{v || '-'}</span>
);

const renderNumber = (v) => (
  <span className='text-xs text-gray-700'>{v !== null && v !== undefined ? v : '-'}</span>
);

const columnGroups = [
  {
    id: 'po',
    label: 'PO',
    headerClassName: 'bg-blue-50 text-blue-700',
    align: 'center',
    columns: [
      { id: 'nama_supplier', label: 'Nama Supplier', align: 'left', render: (r) => renderText(r.nama_supplier) },
      { id: 'no_po', label: 'No PO', align: 'center', render: (r) => renderText(r.no_po) },
      { id: 'item', label: 'Item', align: 'left', render: (r) => renderText(r.item) },
      { id: 'spesifikasi', label: 'Spesifikasi', align: 'left', render: (r) => renderText(r.spesifikasi) },
      { id: 'qty_po_pcs', label: 'Qty PO (PCS)', align: 'right', render: (r) => renderNumber(r.qty_po_pcs) },
      { id: 'harga_pcs', label: 'Harga (PCS)', align: 'right', render: (r) => renderCurrency(r.harga_pcs) },
      { id: 'total', label: 'Total', align: 'right', render: (r) => renderCurrency(r.total) },
    ],
  },
  {
    id: 'barang-masuk',
    label: 'Barang Masuk',
    headerClassName: 'bg-green-50 text-green-700',
    align: 'center',
    columns: [
      { id: 'tanggal_kirim', label: 'Tanggal Kirim', align: 'center', render: (r) => renderDate(r.tanggal_kirim) },
      { id: 'no_surat_jalan', label: 'No. Surat Jalan', align: 'center', render: (r) => renderText(r.no_surat_jalan) },
      { id: 'qty_kirim', label: 'Qty Kirim', align: 'right', render: (r) => renderNumber(r.qty_kirim) },
      { id: 'qty_sisa_po', label: 'Qty Sisa PO', align: 'right', render: (r) => renderNumber(r.qty_sisa_po) },
    ],
  },
  {
    id: 'tagihan',
    label: 'Tagihan',
    headerClassName: 'bg-amber-50 text-amber-700',
    align: 'center',
    columns: [
      { id: 'no_kwitansi', label: 'No Kwitansi', align: 'center', render: (r) => renderText(r.no_kwitansi) },
      { id: 'no_invoice', label: 'No Invoice', align: 'center', render: (r) => renderText(r.no_invoice) },
      { id: 'no_faktur_pajak', label: 'No Faktur Pajak', align: 'center', render: (r) => renderText(r.no_faktur_pajak) },
      { id: 'tanggal_faktur_pajak', label: 'Tanggal Faktur Pajak', align: 'center', render: (r) => renderDate(r.tanggal_faktur_pajak) },
      { id: 'dpp', label: 'DPP', align: 'right', render: (r) => renderCurrency(r.dpp) },
      { id: 'ppn', label: 'PPN', align: 'right', render: (r) => renderCurrency(r.ppn) },
      { id: 'total_invoice', label: 'Total Invoice', align: 'right', render: (r) => renderCurrency(r.total_invoice) },
      { id: 'tanggal_ttf', label: 'Tanggal TTF', align: 'center', render: (r) => renderDate(r.tanggal_ttf) },
      { id: 'tanggal_jatuh_tempo', label: 'Tanggal Jatuh Tempo', align: 'center', render: (r) => renderDate(r.tanggal_jatuh_tempo) },
      { id: 'tanggal_payment_list', label: 'Tanggal Payment List', align: 'center', render: (r) => renderDate(r.tanggal_payment_list) },
      { id: 'tanggal_dibayar', label: 'Tanggal Dibayar', align: 'center', render: (r) => renderDate(r.tanggal_dibayar) },
      { id: 'selisih', label: 'Selisih', align: 'right', render: (r) => renderCurrency(r.selisih) },
    ],
  },
];

const totalCols = columnGroups.reduce((t, g) => t + g.columns.length, 0);
const align = (a) => a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left';

const ReportPoSuppliersTable = ({ data = [], loading = false }) => {
  const HeaderRow = () => (
    <tr>
      {columnGroups.map((g) => (
        <th
          key={g.id}
          colSpan={g.columns.length}
          className={`border border-gray-200 px-2 py-1.5 text-[10px] font-semibold uppercase ${g.headerClassName} ${align(g.align)}`}
        >
          {g.label}
        </th>
      ))}
    </tr>
  );

  const SubHeaderRow = () => (
    <tr>
      {columnGroups.flatMap((g) =>
        g.columns.map((c) => (
          <th
            key={`${g.id}-${c.id}`}
            className={`border border-gray-200 bg-gray-50 px-2 py-1 text-[9px] font-semibold uppercase text-gray-600 ${align(c.align)}`}
          >
            {c.label}
          </th>
        ))
      )}
    </tr>
  );

  const EmptyRow = () => (
    <tr>
      <td colSpan={totalCols} className='px-2 py-4 text-center text-xs text-gray-500'>
        Belum ada data report.
      </td>
    </tr>
  );

  const LoadingRow = () => (
    <tr>
      <td colSpan={totalCols} className='px-2 py-4 text-center text-xs text-gray-500'>
        <div className='flex items-center justify-center gap-1'>
          <div className='h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent' />
          <span>Memuat...</span>
        </div>
      </td>
    </tr>
  );

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200 text-xs'>
        <thead className='bg-white'>
          <HeaderRow />
          <SubHeaderRow />
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {loading ? (
            <LoadingRow />
          ) : data.length === 0 ? (
            <EmptyRow />
          ) : (
            data.map((row, i) => {
              const rk = row.id || `report-${i}`;
              return (
                <tr key={rk} className='hover:bg-gray-50'>
                  {columnGroups.flatMap((g) =>
                    g.columns.map((c) => (
                      <td
                        key={`${rk}-${g.id}-${c.id}`}
                        className={`border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 ${align(c.align)}`}
                      >
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
};

export default ReportPoSuppliersTable;
