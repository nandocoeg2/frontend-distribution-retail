import React from 'react';

const PurchaseOrderDetailsTable = ({ details }) => {
  if (!details || details.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No purchase order details available.</p>
      </div>
    );
  }

  // Calculate totals
  const totalQuantity = details.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = details.reduce((sum, item) => sum + (item.total_pembelian || 0), 0);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kode Barang
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama Barang
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Isi
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Harga
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Potongan A
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Harga After Potongan A
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Harga Netto
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Pembelian
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Potongan B
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Harga After Potongan B
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {details.map((item, index) => (
            <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.kode_barang || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.nama_barang || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.quantity || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.isi || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.harga?.toLocaleString() || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.potongan_a || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.harga_after_potongan_a?.toLocaleString() || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.harga_netto?.toLocaleString() || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.total_pembelian?.toLocaleString() || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.potongan_b || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.harga_after_potongan_b?.toLocaleString() || '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan="2" className="px-6 py-3 text-sm font-medium text-gray-900">
              Total
            </td>
            <td className="px-6 py-3 text-sm font-medium text-gray-900">
              {totalQuantity}
            </td>
            <td colSpan="5" className="px-6 py-3 text-sm font-medium text-gray-900">
              {/* Empty cells for spacing */}
            </td>
            <td className="px-6 py-3 text-sm font-medium text-gray-900">
              {totalAmount.toLocaleString()}
            </td>
            <td colSpan="2" className="px-6 py-3 text-sm font-medium text-gray-900">
              {/* Empty cells for spacing */}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PurchaseOrderDetailsTable;
