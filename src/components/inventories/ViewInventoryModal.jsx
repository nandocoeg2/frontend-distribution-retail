import React from 'react';

const ViewInventoryModal = ({ inventory, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Inventory Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div className="space-y-2">
          <p><strong>Kode Barang:</strong> {inventory.kode_barang}</p>
          <p><strong>Nama Barang:</strong> {inventory.nama_barang}</p>
          <p><strong>Stok Barang:</strong> {inventory.stok_barang}</p>
          <p><strong>Harga Barang:</strong> {formatCurrency(inventory.harga_barang)}</p>
          <p><strong>Minimal Stok:</strong> {inventory.min_stok}</p>
          <p><strong>Created At:</strong> {formatDate(inventory.createdAt)}</p>
          <p><strong>Updated At:</strong> {formatDate(inventory.updatedAt)}</p>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewInventoryModal;

