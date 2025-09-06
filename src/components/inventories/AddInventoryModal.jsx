import React from 'react';
import InventoryForm from './InventoryForm';
import { createInventory } from '../../services/inventoryService';
import toastService from '../../services/toastService';

const AddInventoryModal = ({ onClose }) => {
  const handleSubmit = async (formData) => {
    try {
      await createInventory(formData);
      toastService.success('Inventory item created successfully');
      onClose();
    } catch (error) {
      toastService.error('Failed to create inventory item');
      console.error('Create inventory error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Inventory Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <InventoryForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default AddInventoryModal;
