import React, { useState, useEffect } from 'react';
import CustomerForm from '@/components/customers/CustomerForm';
import toastService from '@/services/toastService';

const API_URL = 'http://localhost:5050/api/v1';

const EditCustomerModal = ({ show, onClose, customer, onCustomerUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    description: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        address: customer.address || '',
        phoneNumber: customer.phoneNumber || '',
        email: customer.email || '',
        description: customer.description || '',
      });
    }
  }, [customer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateCustomer = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/customers/${customer.id}`,
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

      if (!response.ok) throw new Error('Failed to update customer');

      const updatedCustomer = await response.json();
      onCustomerUpdated(updatedCustomer);
      toastService.success('Customer updated successfully');
      onClose();
    } catch (err) {
      toastService.error('Failed to update customer');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Edit Customer
        </h3>
        <CustomerForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={updateCustomer} 
          closeModal={onClose} 
          isEdit
        />
      </div>
    </div>
  );
};

export default EditCustomerModal;
