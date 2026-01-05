import React, { useState } from 'react';
import GroupCustomerForm from '@/components/groupCustomers/GroupCustomerForm';
import BulkUploadGroupCustomer from '@/components/groupCustomers/BulkUploadGroupCustomer';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AddGroupCustomerModal = ({ show, onClose, onGroupCustomerAdded }) => {
  const [activeTab, setActiveTab] = useState('single');

  const handleSubmit = (result) => {
    if (result) {
      onGroupCustomerAdded(result);
      onClose();
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
        className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-lg font-medium text-gray-900'>
            Add Group Customer
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className='flex space-x-1 border-b border-gray-200 mb-6'>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'single'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Tambah Satu
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bulk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Bulk Upload
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'single' && (
          <GroupCustomerForm
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkUploadGroupCustomer onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default AddGroupCustomerModal;
