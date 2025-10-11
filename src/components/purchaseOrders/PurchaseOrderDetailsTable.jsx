import React from 'react';

const PurchaseOrderDetailsTable = ({ details }) => {
  if (!details || details.length === 0) {
    return (
      <div className='py-4 text-center'>
        <p className='text-gray-500'>No purchase order details available.</p>
      </div>
    );
  }

  // Calculate totals
  const totalQuantity = details.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  const totalAmount = details.reduce(
    (sum, item) => sum + (item.total_pembelian || 0),
    0
  );

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Kode Barang
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Nama Barang
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Quantity
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Isi
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Harga
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Pot A
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Harga After Pot A
            </th>

            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Pot B
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Harga After Pot B
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Harga Netto
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'
            >
              Total Pembelian
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {details.map((item, index) => (
            <tr
              key={item.id || index}
              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.plu || '-'}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.nama_barang || '-'}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.quantity || 0}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.isi || 0}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.harga?.toLocaleString() || 0}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.potongan_a || '-'}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.harga_after_potongan_a?.toLocaleString() || '-'}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.potongan_b || '-'}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.harga_after_potongan_b?.toLocaleString() || '-'}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.harga_netto?.toLocaleString() || 0}
              </td>
              <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                {item.total_pembelian?.toLocaleString() || 0}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className='bg-gray-50'>
          <tr>
            <td
              colSpan='2'
              className='px-6 py-3 text-sm font-medium text-gray-900'
            >
              Total
            </td>
            <td className='px-6 py-3 text-sm font-medium text-gray-900'>
              {totalQuantity}
            </td>
            <td
              colSpan='7'
              className='px-6 py-3 text-sm font-medium text-gray-900'
            >
              {/* Empty cells for spacing */}
            </td>
            <td className='px-6 py-3 text-sm font-medium text-gray-900'>
              {totalAmount.toLocaleString()}
            </td>
            <td
              colSpan='2'
              className='px-6 py-3 text-sm font-medium text-gray-900'
            >
              {/* Empty cells for spacing */}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PurchaseOrderDetailsTable;
