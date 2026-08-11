import React, { useState, useMemo } from 'react';
import { TableLoading } from '../ui/Loading.jsx';
import { formatDate } from '../../utils/formatUtils';

const formatNumber = (num, decimals = 1) => {
  if (num == null || isNaN(num)) return '0.0';
  return Number(num).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const StockOutTable = ({
  movements = [],
  loading = false,
  searchLoading = false,
  onEditNotes,
}) => {
  // Column header filter states
  const [columnFilters, setColumnFilters] = useState({
    tgl: '',
    noInvoice: '',
    plu: '',
    namaCustomer: '',
    namaBarang: '',
    totalPengiriman: '',
    poQuantity: '',
    selisih: '',
    noPo: '',
    totalPenagihan: '',
    stokGantung: '',
  });

  // Numeric footer aggregation toggle states per numeric column ('summary' | 'count' | 'average')
  const [numericAggTypes, setNumericAggTypes] = useState({
    totalPengiriman: 'summary',
    poQuantity: 'summary',
    selisih: 'summary',
    noPo: 'count',
    totalPenagihan: 'summary',
    stokGantung: 'summary',
  });

  const handleAggTypeChange = (field, value) => {
    setNumericAggTypes((prev) => ({ ...prev, [field]: value }));
  };

  // Flatten movements to item rows for Stock Out display
  const rows = useMemo(() => {
    if (!Array.isArray(movements) || movements.length === 0) return [];

    const flatRows = [];

    movements.forEach((movement) => {
      const customerName =
        movement?.customer?.namaCustomer ||
        movement?.customerName ||
        '-';

      const movementDate = movement?.createdAt
        ? formatDate(movement.createdAt)
        : '-';

      const poNumber =
        movement?.no_po ||
        movement?.purchaseOrder?.po_number ||
        '-';

      const invoiceNumber =
        movement?.no_invoice ||
        movement?.suratJalan?.invoicePengiriman?.no_invoice ||
        movement?.purchaseOrder?.invoicePenagihan?.[0]?.no_invoice ||
        '-';

      const totalPenagihanVal = Number(
        movement?.purchaseOrder?.grand_total ||
        movement?.purchaseOrder?.payable_amount ||
        movement?.purchaseOrder?.invoicePenagihan?.[0]?.total_invoice ||
        0
      );

      const items = Array.isArray(movement?.items) ? movement.items : [];
      const poDetails = Array.isArray(movement?.purchaseOrder?.purchaseOrderDetails)
        ? movement.purchaseOrder.purchaseOrderDetails
        : [];

      if (items.length === 0) {
        flatRows.push({
          id: movement.id,
          tgl: movementDate,
          noInvoice: invoiceNumber,
          plu: '-',
          namaCustomer: customerName,
          namaBarang: '-',
          totalPengiriman: 0,
          poQuantity: 0,
          selisih: 0,
          noPo: poNumber,
          totalPenagihan: totalPenagihanVal,
          stokGantung: 0,
          source: movement,
        });
      } else {
        items.forEach((itemObj, idx) => {
          const itemInfo = itemObj?.item || itemObj?.inventory || {};
          const itemId = itemObj?.itemId || itemInfo?.id;

          const totalPengiriman = Number(itemObj?.quantity || 0);

          // Find corresponding PO Detail Qty if available
          const matchingPoDetail = poDetails.find(
            (pod) => pod.itemId === itemId
          );
          const poQuantity = matchingPoDetail
            ? Number(matchingPoDetail.quantity || matchingPoDetail.qty_po || 0)
            : totalPengiriman;

          // Calculate Total Penagihan for this item (from invoicePenagihanDetails if present)
          const invoicePenagihanList = Array.isArray(movement?.purchaseOrder?.invoicePenagihan)
            ? movement.purchaseOrder.invoicePenagihan
            : movement?.purchaseOrder?.invoicePenagihan
            ? [movement.purchaseOrder.invoicePenagihan]
            : [];

          const matchingInvoiceDetails = invoicePenagihanList.flatMap(
            (inv) => inv?.invoicePenagihanDetails || []
          ).filter(
            (det) => det?.itemId === itemId || (itemInfo?.plu && det?.PLU === itemInfo?.plu)
          );

          const totalPenagihan = matchingInvoiceDetails.reduce(
            (sum, det) => sum + Number(det?.quantity || 0),
            0
          );

          // Selisih = PO Quantity - Total Pengiriman
          const selisih = poQuantity - totalPengiriman;

          // Stok Gantung = Total Penagihan - Total Kirim (totalPengiriman)
          const stokGantung = totalPenagihan - totalPengiriman;

          flatRows.push({
            id: `${movement.id}-${idx}`,
            tgl: movementDate,
            noInvoice: invoiceNumber,
            plu: itemInfo?.plu || '-',
            namaCustomer: customerName,
            namaBarang: itemInfo?.nama_barang || itemInfo?.name || '-',
            totalPengiriman,
            poQuantity,
            selisih,
            noPo: poNumber,
            totalPenagihan,
            stokGantung,
            source: movement,
          });
        });
      }
    });

    return flatRows;
  }, [movements]);

  // Filter rows according to header input filters
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (
        columnFilters.tgl &&
        !row.tgl.toLowerCase().includes(columnFilters.tgl.toLowerCase())
      )
        return false;
      if (
        columnFilters.noInvoice &&
        !row.noInvoice
          .toLowerCase()
          .includes(columnFilters.noInvoice.toLowerCase())
      )
        return false;
      if (
        columnFilters.plu &&
        !row.plu.toLowerCase().includes(columnFilters.plu.toLowerCase())
      )
        return false;
      if (
        columnFilters.namaCustomer &&
        !row.namaCustomer
          .toLowerCase()
          .includes(columnFilters.namaCustomer.toLowerCase())
      )
        return false;
      if (
        columnFilters.namaBarang &&
        !row.namaBarang
          .toLowerCase()
          .includes(columnFilters.namaBarang.toLowerCase())
      )
        return false;
      if (
        columnFilters.totalPengiriman &&
        !String(row.totalPengiriman)
          .toLowerCase()
          .includes(columnFilters.totalPengiriman.toLowerCase())
      )
        return false;
      if (
        columnFilters.poQuantity &&
        !String(row.poQuantity)
          .toLowerCase()
          .includes(columnFilters.poQuantity.toLowerCase())
      )
        return false;
      if (
        columnFilters.selisih &&
        !String(row.selisih)
          .toLowerCase()
          .includes(columnFilters.selisih.toLowerCase())
      )
        return false;
      if (
        columnFilters.noPo &&
        !row.noPo.toLowerCase().includes(columnFilters.noPo.toLowerCase())
      )
        return false;
      if (
        columnFilters.totalPenagihan &&
        !String(row.totalPenagihan)
          .toLowerCase()
          .includes(columnFilters.totalPenagihan.toLowerCase())
      )
        return false;
      if (
        columnFilters.stokGantung &&
        !String(row.stokGantung)
          .toLowerCase()
          .includes(columnFilters.stokGantung.toLowerCase())
      )
        return false;

      return true;
    });
  }, [rows, columnFilters]);

  const totalCount = filteredRows.length;

  // Helper calculation for numeric columns
  const computeAggValue = (field, decimals = 1) => {
    if (totalCount === 0) return formatNumber(0, decimals);
    const aggType = numericAggTypes[field] || 'summary';
    if (aggType === 'count') {
      return String(totalCount);
    }

    const sum = filteredRows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
    if (aggType === 'average') {
      return formatNumber(sum / totalCount, decimals);
    }
    return formatNumber(sum, decimals);
  };

  const handleFilterChange = (colKey, value) => {
    setColumnFilters((prev) => ({ ...prev, [colKey]: value }));
  };

  if (loading && !searchLoading) {
    return (
      <div className='bg-white rounded-lg shadow divide-y divide-gray-200'>
        <TableLoading rows={5} columns={11} className='p-6' />
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
              <th className='border-r border-gray-300 px-2 py-2 text-left w-24'>
                Tgl
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-left w-36'>
                No Invoice
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-left w-24'>
                PLU
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-left w-36'>
                Nama Customer
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-left min-w-[180px]'>
                Nama Barang
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-right w-28'>
                Total Pengiriman
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-right w-28'>
                PO Quantity
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-right w-24'>
                Selisih
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-left w-28' title='NO PO LENGKAP'>
                No PO
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-right w-28'>
                Total Penagihan
              </th>
              <th className='border-r border-gray-300 px-2 py-2 text-right w-28'>
                Stok Gantung
              </th>
            </tr>

            {/* Header Filter Row ("DI BIKIN BISA FILTER") */}
            <tr className='bg-gray-50 border-b border-gray-300'>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.tgl}
                  onChange={(e) => handleFilterChange('tgl', e.target.value)}
                  placeholder='Filter Tgl...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.noInvoice}
                  onChange={(e) => handleFilterChange('noInvoice', e.target.value)}
                  placeholder='Filter Invoice...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.plu}
                  onChange={(e) => handleFilterChange('plu', e.target.value)}
                  placeholder='Filter PLU...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.namaCustomer}
                  onChange={(e) => handleFilterChange('namaCustomer', e.target.value)}
                  placeholder='Filter Customer...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.namaBarang}
                  onChange={(e) => handleFilterChange('namaBarang', e.target.value)}
                  placeholder='Filter Barang...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.totalPengiriman}
                  onChange={(e) => handleFilterChange('totalPengiriman', e.target.value)}
                  placeholder='Filter Kirim...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none text-right'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.poQuantity}
                  onChange={(e) => handleFilterChange('poQuantity', e.target.value)}
                  placeholder='Filter PO Qty...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none text-right'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.selisih}
                  onChange={(e) => handleFilterChange('selisih', e.target.value)}
                  placeholder='Filter Selisih...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none text-right'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.noPo}
                  onChange={(e) => handleFilterChange('noPo', e.target.value)}
                  placeholder='Filter PO...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.totalPenagihan}
                  onChange={(e) => handleFilterChange('totalPenagihan', e.target.value)}
                  placeholder='Filter Tagihan...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none text-right'
                />
              </th>
              <th className='border-r border-gray-300 px-1 py-1'>
                <input
                  type='text'
                  value={columnFilters.stokGantung}
                  onChange={(e) => handleFilterChange('stokGantung', e.target.value)}
                  placeholder='Filter Gantung...'
                  className='w-full rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none text-right'
                />
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className='divide-y divide-gray-200 bg-white'>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className='px-3 py-6 text-center text-xs text-gray-500'
                >
                  {searchLoading
                    ? 'Memuat data Stock Out...'
                    : 'Tidak ada data Stock Out ditemukan.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className='hover:bg-amber-50/40 transition-colors'>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-gray-900 whitespace-nowrap'>
                    {row.tgl}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 font-medium text-gray-900 whitespace-nowrap'>
                    {row.noInvoice}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-gray-700 whitespace-nowrap'>
                    {row.plu}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-gray-900 font-medium whitespace-nowrap'>
                    {row.namaCustomer}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-gray-900 font-semibold'>
                    {row.namaBarang}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-right font-bold text-gray-900 whitespace-nowrap'>
                    {formatNumber(row.totalPengiriman, 1)}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-right text-gray-800 whitespace-nowrap'>
                    {formatNumber(row.poQuantity, 1)}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-right text-gray-800 whitespace-nowrap'>
                    {formatNumber(row.selisih, 1)}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-gray-900 font-medium whitespace-nowrap'>
                    {row.noPo}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-right text-gray-800 whitespace-nowrap'>
                    {formatNumber(row.totalPenagihan, 1)}
                  </td>
                  <td className='border-r border-gray-200 px-2 py-1.5 text-right font-semibold text-red-600 whitespace-nowrap'>
                    {formatNumber(row.stokGantung, 1)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer Summary Row */}
          <tfoot className='bg-blue-50/70 border-t-2 border-blue-400 font-semibold text-xs text-gray-800'>
            <tr>
              <td className='border-r border-gray-300 px-2 py-2 font-bold text-blue-900'>
                COUNT: {totalCount}
              </td>
              <td className='border-r border-gray-300 px-2 py-2 text-blue-900'>
                COUNT: {totalCount}
              </td>
              <td className='border-r border-gray-300 px-2 py-2 text-blue-900'>
                COUNT: {totalCount}
              </td>
              <td className='border-r border-gray-300 px-2 py-2 text-blue-900'>
                COUNT: {totalCount}
              </td>
              <td className='border-r border-gray-300 px-2 py-2 text-blue-900'>
                COUNT: {totalCount}
              </td>

              {/* Total Pengiriman */}
              <td className='border-r border-gray-300 px-1 py-1 text-right bg-blue-100/50'>
                <div className='flex flex-col items-end gap-0.5'>
                  <select
                    value={numericAggTypes.totalPengiriman}
                    onChange={(e) => handleAggTypeChange('totalPengiriman', e.target.value)}
                    className='rounded border border-blue-300 bg-white px-1 py-0.5 text-[9px] font-bold text-blue-800 uppercase focus:outline-none'
                  >
                    <option value='summary'>SUMMARY</option>
                    <option value='count'>COUNT</option>
                    <option value='average'>AVERAGE</option>
                  </select>
                  <span className='font-bold text-xs text-blue-950'>
                    {computeAggValue('totalPengiriman', 1)}
                  </span>
                </div>
              </td>

              {/* PO Quantity */}
              <td className='border-r border-gray-300 px-1 py-1 text-right bg-blue-100/50'>
                <div className='flex flex-col items-end gap-0.5'>
                  <select
                    value={numericAggTypes.poQuantity}
                    onChange={(e) => handleAggTypeChange('poQuantity', e.target.value)}
                    className='rounded border border-blue-300 bg-white px-1 py-0.5 text-[9px] font-bold text-blue-800 uppercase focus:outline-none'
                  >
                    <option value='summary'>SUMMARY</option>
                    <option value='count'>COUNT</option>
                    <option value='average'>AVERAGE</option>
                  </select>
                  <span className='font-bold text-xs text-blue-950'>
                    {computeAggValue('poQuantity', 1)}
                  </span>
                </div>
              </td>

              {/* Selisih */}
              <td className='border-r border-gray-300 px-1 py-1 text-right bg-blue-100/50'>
                <div className='flex flex-col items-end gap-0.5'>
                  <select
                    value={numericAggTypes.selisih}
                    onChange={(e) => handleAggTypeChange('selisih', e.target.value)}
                    className='rounded border border-blue-300 bg-white px-1 py-0.5 text-[9px] font-bold text-blue-800 uppercase focus:outline-none'
                  >
                    <option value='summary'>SUMMARY</option>
                    <option value='count'>COUNT</option>
                    <option value='average'>AVERAGE</option>
                  </select>
                  <span className='font-bold text-xs text-blue-950'>
                    {computeAggValue('selisih', 1)}
                  </span>
                </div>
              </td>

              {/* No PO */}
              <td className='border-r border-gray-300 px-1 py-1 text-right bg-blue-100/50'>
                <div className='flex flex-col items-end gap-0.5'>
                  <select
                    value={numericAggTypes.noPo}
                    onChange={(e) => handleAggTypeChange('noPo', e.target.value)}
                    className='rounded border border-blue-300 bg-white px-1 py-0.5 text-[9px] font-bold text-blue-800 uppercase focus:outline-none'
                  >
                    <option value='count'>COUNT</option>
                    <option value='summary'>SUMMARY</option>
                    <option value='average'>AVERAGE</option>
                  </select>
                  <span className='font-bold text-xs text-blue-950'>
                    {computeAggValue('noPo', 0)}
                  </span>
                </div>
              </td>

              {/* Total Penagihan */}
              <td className='border-r border-gray-300 px-1 py-1 text-right bg-blue-100/50'>
                <div className='flex flex-col items-end gap-0.5'>
                  <select
                    value={numericAggTypes.totalPenagihan}
                    onChange={(e) => handleAggTypeChange('totalPenagihan', e.target.value)}
                    className='rounded border border-blue-300 bg-white px-1 py-0.5 text-[9px] font-bold text-blue-800 uppercase focus:outline-none'
                  >
                    <option value='summary'>SUMMARY</option>
                    <option value='count'>COUNT</option>
                    <option value='average'>AVERAGE</option>
                  </select>
                  <span className='font-bold text-xs text-blue-950'>
                    {computeAggValue('totalPenagihan', 1)}
                  </span>
                </div>
              </td>

              {/* Stok Gantung */}
              <td className='border-r border-gray-300 px-1 py-1 text-right bg-blue-100/50'>
                <div className='flex flex-col items-end gap-0.5'>
                  <select
                    value={numericAggTypes.stokGantung}
                    onChange={(e) => handleAggTypeChange('stokGantung', e.target.value)}
                    className='rounded border border-blue-300 bg-white px-1 py-0.5 text-[9px] font-bold text-blue-800 uppercase focus:outline-none'
                  >
                    <option value='summary'>SUMMARY</option>
                    <option value='count'>COUNT</option>
                    <option value='average'>AVERAGE</option>
                  </select>
                  <span className='font-bold text-xs text-red-700'>
                    {computeAggValue('stokGantung', 1)}
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default StockOutTable;
