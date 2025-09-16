import React, { useState, useEffect } from 'react';
import CustomerForm from '@/components/customers/CustomerForm';
import customerService from '@/services/customerService';
import toastService from '@/services/toastService';

const EditCustomerModal = ({ show, onClose, customer, onCustomerUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState({
    namaCustomer: '',
    kodeCustomer: '',
    groupCustomerId: '',
    regionId: '',
    alamatPengiriman: '',
    phoneNumber: '',
    email: '',
    NPWP: '',
    alamatNPWP: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        namaCustomer: customer.namaCustomer || '',
        kodeCustomer: customer.kodeCustomer || '',
        groupCustomerId: customer.groupCustomerId || '',
        regionId: customer.regionId || '',
        alamatPengiriman: customer.alamatPengiriman || '',
        phoneNumber: customer.phoneNumber || '',
        email: customer.email || '',
        NPWP: customer.NPWP || '',
        alamatNPWP: customer.alamatNPWP || '',
        description: customer.description || '',
      });
    }
  }, [customer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const customerData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== '')
    );

    try {
      await customerService.updateCustomer(customer.id, customerData);
      toastService.success('Customer updated successfully');
      onCustomerUpdated();
    } catch (err) {
      if (handleAuthError && handleAuthError(err)) {
        return;
      }
      const errorMessage = err.response?.data?.message || 'Failed to update customer';
      toastService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
          handleSubmit={handleSubmit} 
          closeModal={onClose} 
          isEdit
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default EditCustomerModal;

