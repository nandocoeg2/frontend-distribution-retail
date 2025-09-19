import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ViewTermOfPaymentModal = ({ show, onClose, termOfPayment }) => {
  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            Term of Payment Details
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        {termOfPayment && (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>Code</label>
              <p className='text-sm text-gray-900'>{termOfPayment.kode_top}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Days Limit</label>
              <p className='text-sm text-gray-900'>{termOfPayment.batas_hari} days</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Created At</label>
              <p className='text-sm text-gray-900'>{new Date(termOfPayment.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Updated At</label>
              <p className='text-sm text-gray-900'>{new Date(termOfPayment.updatedAt).toLocaleDateString()}</p>
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

export default ViewTermOfPaymentModal;
