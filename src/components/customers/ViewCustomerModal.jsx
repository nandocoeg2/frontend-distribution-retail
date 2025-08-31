import React from 'react';

const ViewCustomerModal = ({ show, onClose, customer }) => {
  if (!show || !customer) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            Customer Details
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
          >
            <span className='sr-only'>Close</span>
            <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>Name</label>
            <p className='mt-1 text-sm text-gray-900'>{customer.name}</p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Email</label>
            <p className='mt-1 text-sm text-gray-900'>{customer.email || '-'}</p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Phone Number</label>
            <p className='mt-1 text-sm text-gray-900'>{customer.phoneNumber || '-'}</p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Address</label>
            <p className='mt-1 text-sm text-gray-900'>{customer.address || '-'}</p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Description</label>
            <p className='mt-1 text-sm text-gray-900'>{customer.description || '-'}</p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Created At</label>
            <p className='mt-1 text-sm text-gray-900'>
              {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Updated At</label>
            <p className='mt-1 text-sm text-gray-900'>
              {new Date(customer.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className='mt-6 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomerModal;

