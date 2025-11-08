import React, { useState } from 'react';
import SupplierForm from '@/components/suppliers/SupplierForm';
import toastService from '@/services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

const AddSupplierModal = ({ show, onClose, onSupplierAdded, handleAuthError }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    supplier_code_letter: '',
    address: '',
    phoneNumber: '',
    bank: {
      name: '',
      account: '',
      holder: ''
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested bank fields
    if (name.startsWith('bank.')) {
      const bankField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        bank: {
          ...prev.bank,
          [bankField]: value
        }
      }));
    } else {
      // Limit supplier_code_letter to 5 characters
      if (name === 'supplier_code_letter' && value.length > 5) {
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const createSupplier = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to create supplier');

      const newSupplier = await response.json();
      onSupplierAdded(newSupplier);
      toastService.success('Supplier created successfully');
      onClose();
    } catch (err) {
      toastService.error('Failed to create supplier');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Add New Supplier
        </h3>
        <SupplierForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={createSupplier} 
          closeModal={onClose} 
        />
      </div>
    </div>
  );
};

export default AddSupplierModal;

