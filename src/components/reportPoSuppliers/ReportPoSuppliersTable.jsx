import React, { useMemo } from 'react';
import { formatDate, formatCurrency } from '@/utils/formatUtils';

const rd = (v) => <span className='text-xs text-gray-700'>{v ? formatDate(v) : '-'}</span>;
const rc = (v) => <span className='text-xs text-gray-700'>{v != null && v !== '' ? formatCurrency(v) : '-'}</span>;
const rt = (v) => <span className='text-xs text-gray-700'>{v || '-'}</span>;
const rn = (v) => <span className='text-xs text-gray-700'>{v != null ? Number(v).toLocaleString('id-ID') : '-'}</span>;

const processReportData = (records) => {
  if (!Array.isArray(records) || records.length === 0) return [];

  const poGroups = new Map();
  const resultMap = new Map();

  records.forEach((r, originalIndex) => {
    const noPo = (r.no_po || '').trim();
    const itemId = r.itemId || r.item?.id || '';
    if (noPo) {
      const key = `${noPo}__${itemId}`;
      if (!poGroups.has(key)) {
        poGroups.set(key, []);
      }
      poGroups.get(key).push({ ...r, _originalIndex: originalIndex });
    }
  });

  poGroups.forEach((groupItems) => {
    const sortedGroup = [...groupItems].sort((a, b) => {
      const dateA = a.tanggal_kirim ? new Date(a.tanggal_kirim).getTime() : 0;
      const dateB = b.tanggal_kirim ? new Date(b.tanggal_kirim).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (createdA !== createdB) return createdA - createdB;
      return a._originalIndex - b._originalIndex;
    });

    let cumulativeKirim = 0;
    sortedGroup.forEach((item) => {
      cumulativeKirim += Number(item.qty_kirim || 0);
      const qtyPo = item.qty_po != null ? Number(item.qty_po) : null;
      const calculatedQtySisa = qtyPo != null ? qtyPo - cumulativeKirim : null;
      resultMap.set(item._originalIndex, calculatedQtySisa);
    });
  });

  return records.map((r, index) => {
    const qtyPo = r.qty_po != null ? Number(r.qty_po) : null;
    const qtyKirim = r.qty_kirim != null ? Number(r.qty_kirim) : 0;
    const fallbackSisa = qtyPo != null ? qtyPo - qtyKirim : null;
    return {
      ...r,
      calculatedQtySisa: resultMap.has(index) ? resultMap.get(index) : fallbackSisa,
    };
  });
};

const columnGroups = [
  {
    id: 'po', label: 'PO', hc: 'bg-blue-200 text-blue-900', shc: 'bg-blue-100 text-blue-800', cc: 'bg-blue-50', align: 'center',
    columns: [
      { id: 'supplier', label: 'Supplier', align: 'left', render: (r) => rt(r.supplier?.name) },
      { id: 'no_po', label: 'No PO', align: 'center', render: (r) => rt(r.no_po) },
      { id: 'item', label: 'Item', align: 'left', render: (r) => rt(r.item ? `${r.item.plu || ''} - ${r.item.nama_barang || ''}` : null) },
      { id: 'spesifikasi', label: 'Spesifikasi', align: 'left', render: (r) => rt(r.spesifikasi) },
      { id: 'qty_po', label: 'Qty PO', align: 'right', render: (r) => rn(r.qty_po) },
      { id: 'harga_pcs', label: 'Harga', align: 'right', render: (r) => rc(r.harga_pcs) },
      { id: 'total', label: 'Total', align: 'right', render: (r) => rc(r.total) },
    ],
  },
  {
    id: 'barang-masuk', label: 'Barang Masuk', hc: 'bg-emerald-200 text-emerald-900', shc: 'bg-emerald-100 text-emerald-800', cc: 'bg-emerald-50', align: 'center',
    columns: [
      { id: 'tanggal_kirim', label: 'Tgl Kirim', align: 'center', render: (r) => rd(r.tanggal_kirim) },
      { id: 'no_surat_jalan', label: 'No SJ', align: 'center', render: (r) => rt(r.no_surat_jalan) },
      { id: 'qty_kirim', label: 'Qty Dikirim', align: 'right', render: (r) => rn(r.qty_kirim) },
      { id: 'qty_sisa', label: 'Qty Sisa PO', align: 'right', render: (r) => {
        const qtySisa = r.calculatedQtySisa != null ? r.calculatedQtySisa : (r.qty_po != null ? Number(r.qty_po) - Number(r.qty_kirim || 0) : null);
        if (qtySisa == null) return rt('-');
        return rn(qtySisa);
      }},
    ],
  },
  {
    id: 'tagihan', label: 'Tagihan', hc: 'bg-amber-200 text-amber-900', shc: 'bg-amber-100 text-amber-800', cc: 'bg-amber-50', align: 'center',
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

const totalCols = columnGroups.reduce((t, g) => t + g.columns.length, 0);
const al = (a) => (a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left');

const ReportPoSuppliersTable = ({ data = [], loading = false }) => {
  const processedData = useMemo(() => processReportData(data), [data]);

  return (
    <div className='overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)] rounded-md border border-gray-200'>
      <table className='min-w-full divide-y divide-gray-200 text-xs'>
        <thead className='bg-white sticky top-0 z-10 shadow-sm'>
          <tr>
            {columnGroups.map((g) => (
              <th key={g.id} colSpan={g.columns.length}
                className={`border border-gray-400 px-2 py-1.5 text-[10px] font-semibold uppercase ${g.hc} ${al(g.align)}`}>
                {g.label}
              </th>
            ))}
          </tr>
          <tr>
            {columnGroups.flatMap((g) =>
              g.columns.map((c) => (
                <th key={`${g.id}-${c.id}`}
                  className={`border border-gray-400 px-2 py-1 text-[9px] font-semibold uppercase ${g.shc} ${al(c.align)}`}>
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
          ) : processedData.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className='px-2 py-4 text-center text-xs text-gray-500'>Belum ada data report.</td>
            </tr>
          ) : (
            processedData.map((row, i) => {
              const rk = row.id || `r-${i}`;
              return (
                <tr key={rk} className='hover:bg-gray-50'>
                  {columnGroups.flatMap((g) =>
                    g.columns.map((c) => (
                      <td key={`${rk}-${g.id}-${c.id}`}
                        className={`border border-gray-400 px-2 py-1.5 text-xs text-gray-700 whitespace-nowrap ${g.cc} ${al(c.align)}`}>
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
