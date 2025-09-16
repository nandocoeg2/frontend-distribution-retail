import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ViewGroupCustomerModal = ({ show, onClose, groupCustomer }) => {
  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            Group Customer Details
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        {groupCustomer && (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>Group Code</label>
              <p className='text-sm text-gray-900'>{groupCustomer.kode_group}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Group Name</label>
              <p className='text-sm text-gray-900'>{groupCustomer.nama_group}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Address</label>
              <p className='text-sm text-gray-900'>{groupCustomer.alamat || 'N/A'}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>NPWP</label>
              <p className='text-sm text-gray-900'>{groupCustomer.npwp || 'N/A'}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Created By</label>
              <p className='text-sm text-gray-900'>{groupCustomer.createdBy || 'N/A'}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Created At</label>
              <p className='text-sm text-gray-900'>{new Date(groupCustomer.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Updated By</label>
              <p className='text-sm text-gray-900'>{groupCustomer.updatedBy || 'N/A'}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Updated At</label>
              <p className='text-sm text-gray-900'>{new Date(groupCustomer.updatedAt).toLocaleDateString()}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Status</label>
              <p className={`text-sm ${groupCustomer.is_deleted ? 'text-red-600' : 'text-green-600'}`}>
                {groupCustomer.is_deleted ? 'Deleted' : 'Active'}
              </p>
            </div>
          </div>
        )}

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

export default ViewGroupCustomerModal;

