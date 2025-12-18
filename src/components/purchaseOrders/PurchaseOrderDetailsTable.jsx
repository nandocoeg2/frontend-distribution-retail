import React from 'react';

const PurchaseOrderDetailsTable = ({ details }) => {
  if (!details || details.length === 0) {
    return <div className='py-2 text-center text-xs text-gray-500'>No details available.</div>;
  }

  // Calculate totals
  const totalQuantityOrder = details.reduce(
    (sum, item) => sum + (item.total_quantity_order || 0),
    0
  );
  const totalAmount = details.reduce(
    (sum, item) => sum + (item.total_pembelian || 0),
    0
  );
  const totalPPN = details.reduce((sum, item) => {
    const ppnRate = item.vatRate || 0;
    const ppnAmount = (item.total_pembelian || 0) * (ppnRate / 100);
    return sum + ppnAmount;
  }, 0);
  const grandTotal = totalAmount + totalPPN;

  const thClass = 'px-2 py-1 text-xs font-medium text-gray-500 uppercase';
  const thClassLeft = `${thClass} text-left`;
  const thClassRight = `${thClass} text-right`;
  const tdClass = 'px-2 py-1 text-xs text-gray-900 whitespace-nowrap';
  const tdClassRight = `${tdClass} text-right`;

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200 text-xs'>
        <thead className='bg-gray-50'>
          <tr>
            <th className={thClassLeft}>PLU</th>
            <th className={thClassLeft}>Nama</th>
            <th className={thClassRight}>Qty</th>
            <th className={thClassRight}>Harga</th>
            <th className={thClassRight}>Pot A</th>
            <th className={thClassRight}>H. Pot A</th>
            <th className={thClassRight}>Pot B</th>
            <th className={thClassRight}>H. Pot B</th>
            <th className={thClassRight}>Netto</th>
            <th className={thClassRight}>Total</th>
            <th className={thClassRight}>PPN %</th>
            <th className={thClassRight}>PPN</th>
            <th className={thClassRight}>Grand Total</th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-100'>
          {details.map((item, index) => {
            const ppnRate = item.vatRate || 0;
            const ppnAmount = (item.total_pembelian || 0) * (ppnRate / 100);
            const itemGrandTotal = (item.total_pembelian || 0) + ppnAmount;

            return (
              <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className={tdClass}>{item.plu || '-'}</td>
                <td className={`${tdClass} max-w-[120px] truncate`} title={item.nama_barang}>{item.nama_barang || '-'}</td>
                <td className={tdClassRight}>{item.total_quantity_order || 0}</td>
                <td className={tdClassRight}>{item.harga?.toLocaleString() || 0}</td>
                <td className={tdClassRight}>{item.potongan_a || '-'}</td>
                <td className={tdClassRight}>{item.harga_after_potongan_a?.toLocaleString() || '-'}</td>
                <td className={tdClassRight}>{item.potongan_b || '-'}</td>
                <td className={tdClassRight}>{item.harga_after_potongan_b?.toLocaleString() || '-'}</td>
                <td className={tdClassRight}>{item.harga_netto?.toLocaleString() || 0}</td>
                <td className={tdClassRight}>{item.total_pembelian?.toLocaleString() || 0}</td>
                <td className={tdClassRight}>{ppnRate}%</td>
                <td className={tdClassRight}>{Math.round(ppnAmount).toLocaleString()}</td>
                <td className={`${tdClassRight} font-semibold`}>{Math.round(itemGrandTotal).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className='bg-gray-100'>
          <tr>
            <td colSpan='2' className='px-2 py-1 text-xs font-semibold'>Total</td>
            <td className='px-2 py-1 text-xs font-bold text-blue-700 text-right'>{totalQuantityOrder.toLocaleString()}</td>
            <td colSpan='6'></td>
            <td className='px-2 py-1 text-xs font-bold text-right'>{totalAmount.toLocaleString()}</td>
            <td></td>
            <td className='px-2 py-1 text-xs font-bold text-right'>{Math.round(totalPPN).toLocaleString()}</td>
            <td className='px-2 py-1 text-xs font-bold text-green-700 text-right'>Rp {Math.round(grandTotal).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PurchaseOrderDetailsTable;


