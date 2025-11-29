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

  const thClass = 'px-2 py-1 text-xs font-medium text-left text-gray-500 uppercase';
  const tdClass = 'px-2 py-1 text-xs text-gray-900 whitespace-nowrap';

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200 text-xs'>
        <thead className='bg-gray-50'>
          <tr>
            <th className={thClass}>PLU</th>
            <th className={thClass}>Nama</th>
            <th className={thClass}>Qty</th>
            <th className={thClass}>Harga</th>
            <th className={thClass}>Pot A</th>
            <th className={thClass}>H. Pot A</th>
            <th className={thClass}>Pot B</th>
            <th className={thClass}>H. Pot B</th>
            <th className={thClass}>Netto</th>
            <th className={thClass}>Total</th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-100'>
          {details.map((item, index) => (
            <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className={tdClass}>{item.plu || '-'}</td>
              <td className={`${tdClass} max-w-[120px] truncate`} title={item.nama_barang}>{item.nama_barang || '-'}</td>
              <td className={tdClass}>{item.total_quantity_order || 0}</td>
              <td className={tdClass}>{item.harga?.toLocaleString() || 0}</td>
              <td className={tdClass}>{item.potongan_a || '-'}</td>
              <td className={tdClass}>{item.harga_after_potongan_a?.toLocaleString() || '-'}</td>
              <td className={tdClass}>{item.potongan_b || '-'}</td>
              <td className={tdClass}>{item.harga_after_potongan_b?.toLocaleString() || '-'}</td>
              <td className={tdClass}>{item.harga_netto?.toLocaleString() || 0}</td>
              <td className={tdClass}>{item.total_pembelian?.toLocaleString() || 0}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className='bg-gray-100'>
          <tr>
            <td colSpan='2' className='px-2 py-1 text-xs font-semibold'>Total</td>
            <td className='px-2 py-1 text-xs font-bold text-blue-700'>{totalQuantityOrder.toLocaleString()}</td>
            <td colSpan='6'></td>
            <td className='px-2 py-1 text-xs font-bold'>Rp {totalAmount.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PurchaseOrderDetailsTable;
