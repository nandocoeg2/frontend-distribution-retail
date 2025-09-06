import React from 'react';

const EditablePurchaseOrderDetailsTable = ({ details, onDetailsChange }) => {
  const handleItemChange = (index, field, value) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    onDetailsChange(newDetails);
  };

  const handleAddItem = () => {
    const newDetails = [
      ...details,
      {
        id: `new-${Date.now()}`,
        kode_barang: '',
        nama_barang: '',
        quantity: 1,
        isi: 1,
        harga: 0,
        potongan_a: '0',
        potongan_b: '0',
        total_pembelian: 0,
        harga_after_potongan_a: 0,
        harga_after_potongan_b: 0,
        harga_netto: 0,
      },
    ];
    onDetailsChange(newDetails);
  };

  const handleRemoveItem = (index) => {
    const newDetails = details.filter((_, i) => i !== index);
    onDetailsChange(newDetails);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Barang</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Isi</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potongan A</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potongan B</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {details.map((item, index) => (
            <tr key={item.id || index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={item.kode_barang || ''}
                  onChange={(e) => handleItemChange(index, 'kode_barang', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={item.nama_barang || ''}
                  onChange={(e) => handleItemChange(index, 'nama_barang', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  value={item.quantity || 0}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  value={item.isi || 0}
                  onChange={(e) => handleItemChange(index, 'isi', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  value={item.harga || 0}
                  onChange={(e) => handleItemChange(index, 'harga', parseFloat(e.target.value) || 0)}
                  className="w-32 px-2 py-1 border border-gray-300 rounded-md"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={item.potongan_a || ''}
                  onChange={(e) => handleItemChange(index, 'potongan_a', e.target.value)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={item.potongan_b || ''}
                  onChange={(e) => handleItemChange(index, 'potongan_b', e.target.value)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <button
          type="button"
          onClick={handleAddItem}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Item
        </button>
      </div>
    </div>
  );
};

export default EditablePurchaseOrderDetailsTable;

