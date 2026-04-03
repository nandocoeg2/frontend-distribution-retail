import { useState } from 'react';
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
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
      onClick={onClose}
    >
      <div
        className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex justify-between items-center px-5 py-3 border-b border-gray-200'>
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
        <div className='flex space-x-1 border-b border-gray-200 px-5'>
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
        <div className='px-5 py-4 overflow-y-auto max-h-[calc(85vh-120px)]'>
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
    </div>
  );
};

export default AddGroupCustomerModal;
