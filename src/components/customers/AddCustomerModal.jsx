import React, { useState } from 'react';
import CustomerForm from '@/components/customers/CustomerForm';
import BulkUploadCustomer from '@/components/customers/BulkUploadCustomer';
import useCustomerOperations from '../../hooks/useCustomerOperations';

const AddCustomerModal = ({ onClose, onCustomerAdded }) => {
  const [activeTab, setActiveTab] = useState('single');
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add Customer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'single'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Tambah Satu
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'bulk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Bulk Upload
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'single' && (
          <CustomerForm 
            onSubmit={handleSubmit} 
            onClose={onClose} 
            loading={loading}
            error={error}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkUploadCustomer onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default AddCustomerModal;
