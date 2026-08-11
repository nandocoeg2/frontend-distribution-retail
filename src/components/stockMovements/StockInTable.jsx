import React, { useState, useMemo } from 'react';
import { TableLoading } from '../ui/Loading.jsx';
import { formatDate } from '../../utils/formatUtils';

const formatNumber = (num, decimals = 0) => {
  if (num == null || isNaN(num)) return '0';
  return Number(num).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const StockInTable = ({
  movements = [],
  loading = false,
  searchLoading = false,
  onEditNotes,
}) => {
  // Column header filter states
  const [columnFilters, setColumnFilters] = useState({
    tgl: '',
    noSuratJalan: '',
    namaBarang: '',
    plu: '',
    qty: '',
    namaSupplier: '',
  });

  // Footer aggregation toggle state for numeric column Qty ('summary' | 'count' | 'average')
  const [qtyAggType, setQtyAggType] = useState('summary');

  // Flatten movements to item rows for Stock In display
  const rows = useMemo(() => {
    if (!Array.isArray(movements) || movements.length === 0) return [];

    const flatRows = [];

    movements.forEach((movement) => {
      const supplierName =
        movement?.supplier?.name ||
        movement?.supplierName ||
        movement?.reportPoSuppliers?.[0]?.supplier?.name ||
        '-';

      const suratJalanNo =
        movement?.no_surat_jalan ||
        movement?.reportPoSuppliers?.[0]?.no_surat_jalan ||
        '-';

      const movementDate = movement?.createdAt
        ? formatDate(movement.createdAt)
        : '-';

      const items = Array.isArray(movement?.items) ? movement.items : [];

      if (items.length === 0) {
        flatRows.push({
          id: movement.id,
          tgl: movementDate,
          noSuratJalan: suratJalanNo,
          namaBarang: '-',
          plu: '-',
          qty: 0,
          namaSupplier: supplierName,
          source: movement,
        });
      } else {
        items.forEach((itemObj, idx) => {
          const itemInfo = itemObj?.item || itemObj?.inventory || {};
          flatRows.push({
            id: `${movement.id}-${idx}`,
            tgl: movementDate,
            noSuratJalan: suratJalanNo,
            namaBarang: itemInfo?.nama_barang || itemInfo?.name || '-',
            plu: itemInfo?.plu || '-',
            qty: Number(itemObj?.quantity || 0),
            namaSupplier: supplierName,
            source: movement,
          });
        });
      }
    });

    return flatRows;
  }, [movements]);

  // Filter rows according to per-column header inputs
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (
        columnFilters.tgl &&
        !row.tgl.toLowerCase().includes(columnFilters.tgl.toLowerCase())
      ) {
        return false;
      }
      if (
        columnFilters.noSuratJalan &&
        !row.noSuratJalan
          .toLowerCase()
          .includes(columnFilters.noSuratJalan.toLowerCase())
      ) {
        return false;
      }
      if (
        columnFilters.namaBarang &&
        !row.namaBarang
          .toLowerCase()
          .includes(columnFilters.namaBarang.toLowerCase())
      ) {
        return false;
      }
      if (
        columnFilters.plu &&
        !row.plu.toLowerCase().includes(columnFilters.plu.toLowerCase())
      ) {
        return false;
      }
      if (
        columnFilters.qty &&
        !String(row.qty)
          .toLowerCase()
          .includes(columnFilters.qty.toLowerCase())
      ) {
        return false;
      }
      if (
        columnFilters.namaSupplier &&
        !row.namaSupplier
          .toLowerCase()
          .includes(columnFilters.namaSupplier.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [rows, columnFilters]);

  // Computations for footer summary row
  const totalCount = filteredRows.length;

  const qtyAggValue = useMemo(() => {
    if (totalCount === 0) return '0';
    const sum = filteredRows.reduce((acc, r) => acc + (r.qty || 0), 0);
    if (qtyAggType === 'count') {
      return formatNumber(totalCount);
    }
    if (qtyAggType === 'average') {
      return formatNumber(sum / totalCount, 2);
    }
    // Default 'summary' (SUM)
    return formatNumber(sum, 2);
  }, [filteredRows, totalCount, qtyAggType]);

  const handleFilterChange = (colKey, value) => {
    setColumnFilters((prev) => ({ ...prev, [colKey]: value }));
  };

  if (loading && !searchLoading) {
    return (
      <div className='bg-white rounded-lg shadow divide-y divide-gray-200'>
        <TableLoading rows={5} columns={6} className='p-6' />
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='min-w-full border-collapse border border-gray-300 text-xs'>
          {/* Header Row */}
          <thead className='bg-gray-100'>
            <tr className='border-b border-gray-300 text-gray-700 font-bold'>
              <th className='border-r border-gray-300 px-3 py-2 text-left w-28'>
                Tgl
              </th>
              <th className='border-r border-gray-300 px-3 py-2 text-left w-44'>
                No Surat Jalan
              </th>
              <th className='border-r border-gray-300 px-3 py-2 text-left min-w-[200px]'>
                Nama Barang
              </th>
              <th className='border-r border-gray-300 px-3 py-2 text-left w-28'>
                PLU
              </th>
              <th className='border-r border-gray-300 px-3 py-2 text-right w-36'>
                Qty
              </th>
              <th className='border-r border-gray-300 px-3 py-2 text-left w-40'>
                Nama Supplier
              </th>
            </tr>

            {/* Header Filter Inputs Row ("DI BIKIN BISA FILTER") */}
            <tr className='bg-gray-50 border-b border-gray-300'>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.tgl}
                  onChange={(e) => handleFilterChange('tgl', e.target.value)}
                  placeholder='Filter Tgl...'
                  className='w-full rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.noSuratJalan}
                  onChange={(e) =>
                    handleFilterChange('noSuratJalan', e.target.value)
                  }
                  placeholder='Filter No SJ...'
                  className='w-full rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.namaBarang}
                  onChange={(e) =>
                    handleFilterChange('namaBarang', e.target.value)
                  }
                  placeholder='Filter Nama Barang...'
                  className='w-full rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.plu}
                  onChange={(e) => handleFilterChange('plu', e.target.value)}
                  placeholder='Filter PLU...'
                  className='w-full rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.qty}
                  onChange={(e) => handleFilterChange('qty', e.target.value)}
                  placeholder='Filter Qty...'
                  className='w-full rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none text-right'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.namaSupplier}
                  onChange={(e) =>
                    handleFilterChange('namaSupplier', e.target.value)
                  }
                  placeholder='Filter Supplier...'
                  className='w-full rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none'
                />
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className='divide-y divide-gray-200 bg-white'>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className='px-3 py-6 text-center text-xs text-gray-500'
                >
                  {searchLoading
                    ? 'Memuat data Stock In...'
                    : 'Tidak ada data Stock In ditemukan.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className='hover:bg-blue-50/40 transition-colors'>
                  <td className='border-r border-gray-200 px-3 py-2 text-gray-900 whitespace-nowrap'>
                    {row.tgl}
                  </td>
                  <td className='border-r border-gray-200 px-3 py-2 font-medium text-gray-900 whitespace-nowrap'>
                    {row.noSuratJalan}
                  </td>
                  <td className='border-r border-gray-200 px-3 py-2 text-gray-900 font-semibold'>
                    {row.namaBarang}
                  </td>
                  <td className='border-r border-gray-200 px-3 py-2 text-gray-700 whitespace-nowrap'>
                    {row.plu}
                  </td>
                  <td className='border-r border-gray-200 px-3 py-2 text-right font-bold text-gray-900 whitespace-nowrap'>
                    {formatNumber(row.qty, 2)}
                  </td>
                  <td className='border-r border-gray-200 px-3 py-2 text-gray-900 font-medium whitespace-nowrap'>
                    {row.namaSupplier}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer with Summary Aggregation */}
          <tfoot className='bg-blue-50/70 border-t-2 border-blue-400 font-semibold text-xs text-gray-800'>
            <tr>
              <td className='border-r border-gray-300 px-3 py-2 font-bold text-blue-900'>
                COUNT: {totalCount}
              </td>
              <td className='border-r border-gray-300 px-3 py-2 text-blue-900'>
                COUNT: {totalCount}
              </td>
              <td className='border-r border-gray-300 px-3 py-2 text-blue-900'>
                COUNT: {totalCount}
              </td>
              <td className='border-r border-gray-300 px-3 py-2 text-blue-900'>
                COUNT: {totalCount}
              </td>

              {/* Numeric Column Filter (COUNT / SUMMARY / AVERAGE) */}
              <td className='border-r border-gray-300 px-2 py-1 text-right bg-blue-100/60'>
                <div className='flex flex-col items-end gap-0.5'>
                  <select
                    value={qtyAggType}
                    onChange={(e) => setQtyAggType(e.target.value)}
                    className='rounded border border-blue-300 bg-white px-1 py-0.5 text-[10px] font-bold text-blue-800 uppercase focus:outline-none focus:ring-1 focus:ring-blue-500'
                  >
                    <option value='summary'>SUMMARY (SUM)</option>
                    <option value='count'>COUNT</option>
                    <option value='average'>AVERAGE</option>
                  </select>
                  <span className='font-bold text-sm text-blue-950'>
                    {qtyAggValue}
                  </span>
                </div>
              </td>

              <td className='border-r border-gray-300 px-3 py-2 text-blue-900'>
                COUNT: {totalCount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default StockInTable;
