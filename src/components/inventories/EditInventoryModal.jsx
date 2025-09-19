import React from 'react';
import InventoryForm from './InventoryForm';
import { useInventoryOperations } from '../../hooks/useInventory';

const EditInventoryModal = ({ inventory, onClose }) => {
  const { updateInventoryItem, loading, error } = useInventoryOperations();

  const handleSubmit = async (formData) => {
    try {
      await updateInventoryItem(inventory.id, formData);
      onClose();
    } catch (error) {
      console.error('Update inventory error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-9999">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Inventory Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <InventoryForm 
          onSubmit={handleSubmit} 
          onClose={onClose} 
          initialData={inventory}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default EditInventoryModal;
