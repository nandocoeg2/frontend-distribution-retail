import React, { useState } from 'react';
import CustomerForm from '@/components/customers/CustomerForm';
import toastService from '@/services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

const AddCustomerModal = ({ show, onClose, onCustomerAdded, handleAuthError }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    description: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createCustomer = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/customers`, {
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

      if (!response.ok) throw new Error('Failed to create customer');

      const newCustomer = await response.json();
      onCustomerAdded(newCustomer);
      toastService.success('Customer created successfully');
      onClose();
    } catch (err) {
      toastService.error('Failed to create customer');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Add New Customer
        </h3>
        <CustomerForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={createCustomer} 
          closeModal={onClose} 
        />
      </div>
    </div>
  );
};

export default AddCustomerModal;
