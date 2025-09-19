import React, { useState, useEffect, useMemo } from 'react';

const InventoryForm = ({ onSubmit, onClose, initialData = {}, loading = false, error = null }) => {
  const [formData, setFormData] = useState({
    plu: '',
    nama_barang: '',
    stok_c: '',
    stok_q: '',
    harga_barang: '',
    min_stok: 10
  });

  const memoizedInitialData = useMemo(() => initialData, [
    initialData?.plu,
    initialData?.nama_barang,
    initialData?.stok_c,
    initialData?.stok_q,
    initialData?.harga_barang,
    initialData?.min_stok
  ]);

  useEffect(() => {
    if (memoizedInitialData) {
      setFormData({
        plu: memoizedInitialData.plu || '',
        nama_barang: memoizedInitialData.nama_barang || '',
        stok_c: memoizedInitialData.stok_c || '',
        stok_q: memoizedInitialData.stok_q || '',
        harga_barang: memoizedInitialData.harga_barang || '',
        min_stok: memoizedInitialData.min_stok || 10
      });
    }
  }, [memoizedInitialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      stok_c: parseInt(formData.stok_c, 10),
      stok_q: parseInt(formData.stok_q, 10),
      harga_barang: parseFloat(formData.harga_barang),
      min_stok: parseInt(formData.min_stok, 10)
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="plu" className="block text-sm font-medium text-gray-700">PLU (Price Look-Up)</label>
        <input
          type="text"
          name="plu"
          id="plu"
          value={formData.plu}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
          disabled={!!memoizedInitialData.id} // Disable PLU on edit
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
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="stok_c" className="block text-sm font-medium text-gray-700">Stok Karton</label>
          <input
            type="number"
            name="stok_c"
            id="stok_c"
            value={formData.stok_c}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            min="0"
          />
        </div>
        <div>
          <label htmlFor="stok_q" className="block text-sm font-medium text-gray-700">Stok Pcs</label>
          <input
            type="number"
            name="stok_q"
            id="stok_q"
            value={formData.stok_q}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            min="0"
          />
        </div>
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
          min="0"
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
          min="0"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          disabled={loading}
        >
          Close
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Loading...' : (memoizedInitialData.id ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;

