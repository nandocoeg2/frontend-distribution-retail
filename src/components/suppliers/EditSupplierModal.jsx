import React, { useState, useEffect } from 'react';
import SupplierForm from '@/components/suppliers/SupplierForm';
import toastService from '@/services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

const EditSupplierModal = ({ show, onClose, supplier, onSupplierUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phoneNumber: '',
    bank: {
      name: '',
      account: '',
      holder: ''
    }
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        code: supplier.code || '',
        address: supplier.address || '',
        phoneNumber: supplier.phoneNumber || '',
        bank: {
          name: supplier.bank?.name || '',
          account: supplier.bank?.account || '',
          holder: supplier.bank?.holder || ''
        }
      });
    }
  }, [supplier]);

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
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const updateSupplier = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/suppliers/${supplier.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to update supplier');

      const updatedSupplier = await response.json();
      onSupplierUpdated(updatedSupplier);
      toastService.success('Supplier updated successfully');
      onClose();
    } catch (err) {
      toastService.error('Failed to update supplier');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Edit Supplier
        </h3>
        <SupplierForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={updateSupplier} 
          closeModal={onClose} 
          isEdit
        />
      </div>
    </div>
  );
};

export default EditSupplierModal;

