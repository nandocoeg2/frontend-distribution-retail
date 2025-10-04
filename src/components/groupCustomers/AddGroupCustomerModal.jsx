import React from 'react';
import GroupCustomerForm from '@/components/groupCustomers/GroupCustomerForm';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AddGroupCustomerModal = ({ show, onClose, onGroupCustomerAdded }) => {
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
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default AddGroupCustomerModal;

