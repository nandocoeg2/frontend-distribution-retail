import React, { useEffect } from 'react';
import InventoryForm from './InventoryForm';
import { useInventoryOperations } from '../../hooks/useInventory';

const AddInventoryModal = ({ onClose }) => {
  const {
    createInventoryItem,
    loading,
    error,
    setError,
    clearError,
    validateInventoryData
  } = useInventoryOperations();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (formData) => {
    const validationErrors = validateInventoryData(formData);
    if (Object.keys(validationErrors).length > 0) {
      const [firstErrorMessage] = Object.values(validationErrors);
      setError(firstErrorMessage);
      return;
    }

    try {
      await createInventoryItem(formData);
      onClose();
    } catch (error) {
      console.error('Create inventory error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tambah Inventory</h2>
            <p className="text-sm text-gray-600">Lengkapi detail barang sesuai dokumentasi API terbaru.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-white hover:text-gray-700"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          <InventoryForm
            onSubmit={handleSubmit}
            onClose={onClose}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default AddInventoryModal;
