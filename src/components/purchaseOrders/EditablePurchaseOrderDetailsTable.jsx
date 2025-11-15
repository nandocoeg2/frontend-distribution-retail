import React from 'react';

const EditablePurchaseOrderDetailsTable = ({ details, onDetailsChange }) => {
  // Ensure details is always an array
  const safeDetails = details || [];
  
  const handleItemChange = (index, field, value) => {
    const newDetails = [...safeDetails];
    newDetails[index] = { ...newDetails[index], [field]: value };
    onDetailsChange(newDetails);
  };

  const handleAddItem = () => {
    const newDetails = [
      ...safeDetails,
      {
        id: `new-${Date.now()}`,
        plu: '',
        nama_barang: '',
        quantity_pcs: 0,
        quantity_carton: 0,
        qty_per_carton: 1,
        total_quantity_order: 0,
        harga: 0,
        potongan_a: 0,
        potongan_b: 0,
        total_pembelian: 0,
        harga_after_potongan_a: 0,
        harga_after_potongan_b: 0,
        harga_netto: 0,
      },
    ];
    onDetailsChange(newDetails);
  };

  const handleRemoveItem = (index) => {
    const newDetails = safeDetails.filter((_, i) => i !== index);
    onDetailsChange(newDetails);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PLU</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Carton</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty PCS</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty/Carton</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Order</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potongan A</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potongan B</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {safeDetails.map((item, index) => (
            <tr key={item.id || index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={item.plu || ''}
                  onChange={(e) => handleItemChange(index, 'plu', e.target.value)}
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
                  value={item.quantity_carton || 0}
                  onChange={(e) => handleItemChange(index, 'quantity_carton', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                  min="0"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  value={item.quantity_pcs || 0}
                  onChange={(e) => handleItemChange(index, 'quantity_pcs', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                  min="0"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  value={item.qty_per_carton || 1}
                  onChange={(e) => handleItemChange(index, 'qty_per_carton', parseInt(e.target.value) || 1)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md bg-gray-50"
                  min="1"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-blue-600">
                  {((item.quantity_carton || 0) * (item.qty_per_carton || 1)) + (item.quantity_pcs || 0)}
                </div>
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
                  type="number"
                  value={item.potongan_a || 0}
                  onChange={(e) => handleItemChange(index, 'potongan_a', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  value={item.potongan_b || 0}
                  onChange={(e) => handleItemChange(index, 'potongan_b', parseFloat(e.target.value) || 0)}
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

