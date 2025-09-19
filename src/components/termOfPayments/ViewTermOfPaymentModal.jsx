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
            Detail Syarat Pembayaran
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
              <label className='block text-sm font-medium text-gray-700'>Kode</label>
              <p className='text-sm text-gray-900'>{termOfPayment.kode_top}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Batas Hari</label>
              <p className='text-sm text-gray-900'>{termOfPayment.batas_hari} hari</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Dibuat Pada</label>
              <p className='text-sm text-gray-900'>{new Date(termOfPayment.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700'>Diperbarui Pada</label>
              <p className='text-sm text-gray-900'>{new Date(termOfPayment.updatedAt).toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        )}

        <div className='mt-6 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTermOfPaymentModal;
