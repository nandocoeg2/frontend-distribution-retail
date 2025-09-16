import React, { useState, useEffect } from 'react';
import GroupCustomerForm from '@/components/groupCustomers/GroupCustomerForm';
import toastService from '@/services/toastService';

const API_URL = 'http://localhost:5050/api/v1/group-customers';

const EditGroupCustomerModal = ({ show, onClose, groupCustomer, onGroupCustomerUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState({
    kode_group: '',
    nama_group: '',
    alamat: '',
    npwp: '',
  });

  useEffect(() => {
    if (groupCustomer) {
      setFormData({
        kode_group: groupCustomer.kode_group,
        nama_group: groupCustomer.nama_group,
        alamat: groupCustomer.alamat || '',
        npwp: groupCustomer.npwp || '',
      });
    }
  }, [groupCustomer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const updateGroupCustomer = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${groupCustomer.id}`, {
        method: 'PUT',
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

      if (!response.ok) throw new Error('Failed to update group customer');

      const updatedGroupCustomer = await response.json();
      onGroupCustomerUpdated(updatedGroupCustomer);
      toastService.success('Group customer updated successfully');
      onClose();
    } catch (err) {
      toastService.error('Failed to update group customer');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Edit Group Customer
        </h3>
        <GroupCustomerForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={updateGroupCustomer}
          closeModal={onClose}
          isEdit={true}
        />
      </div>
    </div>
  );
};

export default EditGroupCustomerModal;

