import React, { useState } from 'react';
import CustomerForm from '@/components/customers/CustomerForm';
import customerService from '@/services/customerService';
import toastService from '@/services/toastService';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AddCustomerModal = ({ show, onClose, onCustomerAdded, handleAuthError }) => {
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
      await customerService.createCustomer(customerData);
      toastService.success('Customer created successfully');
      onCustomerAdded();
    } catch (err) {
      if (handleAuthError && handleAuthError(err)) {
        return;
      }
      const errorMessage = err.response?.data?.message || 'Failed to create customer';
      toastService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Customer</h2>
            <p className="text-sm text-gray-600">Fill in the details to create a new customer</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <CustomerForm 
            formData={formData} 
            handleInputChange={handleInputChange} 
            handleSubmit={handleSubmit} 
            closeModal={onClose} 
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default AddCustomerModal;

