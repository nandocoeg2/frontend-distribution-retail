import React, { useState, useEffect } from 'react';

const InventoryForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    kode_barang: '',
    nama_barang: '',
    stok_barang: '',
    harga_barang: '',
    min_stok: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        kode_barang: initialData.kode_barang || '',
        nama_barang: initialData.nama_barang || '',
        stok_barang: initialData.stok_barang || '',
        harga_barang: initialData.harga_barang || '',
        min_stok: initialData.min_stok || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      stok_barang: parseInt(formData.stok_barang, 10),
      harga_barang: parseFloat(formData.harga_barang),
      min_stok: parseInt(formData.min_stok, 10)
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="kode_barang" className="block text-sm font-medium text-gray-700">Kode Barang</label>
        <input
          type="text"
          name="kode_barang"
          id="kode_barang"
          value={formData.kode_barang}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={!!initialData.id} // Disable kode_barang on edit
        />
      </div>
      <div>
        <label htmlFor="nama_barang" className="block text-sm font-medium text-gray-700">Nama Barang</label>
        <input
          type="text"
          name="nama_barang"
          id="nama_barang"
          value={formData.nama_barang}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="stok_barang" className="block text-sm font-medium text-gray-700">Stok Barang</label>
        <input
          type="number"
          name="stok_barang"
          id="stok_barang"
          value={formData.stok_barang}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="harga_barang" className="block text-sm font-medium text-gray-700">Harga Barang</label>
        <input
          type="number"
          name="harga_barang"
          id="harga_barang"
          value={formData.harga_barang}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="min_stok" className="block text-sm font-medium text-gray-700">Minimal Stok</label>
        <input
          type="number"
          name="min_stok"
          id="min_stok"
          value={formData.min_stok}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {initialData.id ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;

