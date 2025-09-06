import React from 'react';
import InventoryForm from './InventoryForm';
import { updateInventory } from '../../services/inventoryService';
import toastService from '../../services/toastService';

const EditInventoryModal = ({ inventory, onClose }) => {
  const handleSubmit = async (formData) => {
    try {
      await updateInventory(inventory.id, formData);
      toastService.success('Inventory item updated successfully');
      onClose();
    } catch (error) {
      toastService.error('Failed to update inventory item');
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
        <InventoryForm onSubmit={handleSubmit} onClose={onClose} initialData={inventory} />
      </div>
    </div>
  );
};

export default EditInventoryModal;
