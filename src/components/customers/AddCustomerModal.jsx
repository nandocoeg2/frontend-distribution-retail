import React from 'react';
import CustomerForm from '@/components/customers/CustomerForm';
import useCustomerOperations from '../../hooks/useCustomerOperations';

const AddCustomerModal = ({ onClose, onCustomerAdded }) => {
  const { createCustomer, loading, error } = useCustomerOperations();

  const handleSubmit = async (formData) => {
    try {
      await createCustomer(formData);
      if (onCustomerAdded) {
        onCustomerAdded();
      }
      onClose();
    } catch (error) {
      console.error('Create customer error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-9999">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Customer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <CustomerForm 
          onSubmit={handleSubmit} 
          onClose={onClose} 
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default AddCustomerModal;
