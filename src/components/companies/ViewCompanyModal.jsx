import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ViewCompanyModal = ({ show, onClose, company }) => {
  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-4xl mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            Company Details
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        {company && (
          <div className='space-y-4'>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className='block text-sm font-medium text-gray-700'>Company Code</label>
                <p className='text-sm text-gray-900'>{company.kode_company}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Company Name</label>
                <p className='text-sm text-gray-900'>{company.nama_perusahaan}</p>
              </div>
              <div className="md:col-span-2">
                <label className='block text-sm font-medium text-gray-700'>Address</label>
                <p className='text-sm text-gray-900'>{company.alamat}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Account Number</label>
                <p className='text-sm text-gray-900'>{company.no_rekening}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Bank</label>
                <p className='text-sm text-gray-900'>{company.bank}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Bank Account Name</label>
                <p className='text-sm text-gray-900'>{company.bank_account_name}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Bank Branch</label>
                <p className='text-sm text-gray-900'>{company.bank_cabang}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Phone</label>
                <p className='text-sm text-gray-900'>{company.telp || 'N/A'}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Fax</label>
                <p className='text-sm text-gray-900'>{company.fax || 'N/A'}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Email</label>
                <p className='text-sm text-gray-900'>{company.email || 'N/A'}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Main Director</label>
                <p className='text-sm text-gray-900'>{company.direktur_utama || 'N/A'}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>NPWP</label>
                <p className='text-sm text-gray-900'>{company.npwp || 'N/A'}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Created By</label>
                <p className='text-sm text-gray-900'>{company.createdBy || 'N/A'}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Created At</label>
                <p className='text-sm text-gray-900'>{new Date(company.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Updated By</label>
                <p className='text-sm text-gray-900'>{company.updatedBy || 'N/A'}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Updated At</label>
                <p className='text-sm text-gray-900'>{new Date(company.updatedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Status</label>
                <p className={`text-sm ${company.is_deleted ? 'text-red-600' : 'text-green-600'}`}>
                  {company.is_deleted ? 'Deleted' : 'Active'}
                </p>
              </div>
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

export default ViewCompanyModal;

