import React, { useState } from 'react';
import GroupCustomerForm from '@/components/groupCustomers/GroupCustomerForm';
import toastService from '@/services/toastService';
import { XMarkIcon } from '@heroicons/react/24/outline';

const API_URL = 'http://localhost:5050/api/v1/group-customers';

const AddGroupCustomerModal = ({ show, onClose, onGroupCustomerAdded, handleAuthError }) => {
  const [formData, setFormData] = useState({
    kode_group: '',
    nama_group: '',
    alamat: '',
    npwp: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const createGroupCustomer = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(API_URL, {
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

      if (!response.ok) throw new Error('Failed to create group customer');

      const newGroupCustomer = await response.json();
      onGroupCustomerAdded(newGroupCustomer);
      toastService.success('Group customer created successfully');
      onClose();
    } catch (err) {
      toastService.error('Failed to create group customer');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div 
      className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'
      onClick={onClose}
    >
      <div 
        className='bg-white rounded-lg p-6 w-full max-w-md mx-4'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            Add New Group Customer
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>
        <GroupCustomerForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={createGroupCustomer}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default AddGroupCustomerModal;

