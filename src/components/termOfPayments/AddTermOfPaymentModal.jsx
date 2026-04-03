import { useState } from 'react';
import TermOfPaymentForm from '@/components/termOfPayments/TermOfPaymentForm';
import BulkUploadTermOfPayment from '@/components/termOfPayments/BulkUploadTermOfPayment';

const AddTermOfPaymentModal = ({ show, onClose, onTermOfPaymentAdded, handleAuthError }) => {
  const [activeTab, setActiveTab] = useState('single');
  const [formData, setFormData] = useState({
    kode_top: '',
    batas_hari: 30,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'batas_hari' ? parseInt(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onTermOfPaymentAdded(formData);
    setFormData({ kode_top: '', batas_hari: 30 });
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <div className='flex items-center justify-between border-b border-gray-200 bg-blue-600 px-5 py-3 text-white'>
          <h3 className='text-base font-semibold'>Add Term of Payment</h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
          >
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className='flex space-x-1 border-b border-gray-200 px-5'>
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
        <div className='px-5 py-4 overflow-y-auto max-h-[calc(85vh-120px)]'>
        {activeTab === 'single' && (
          <TermOfPaymentForm 
            formData={formData} 
            handleInputChange={handleInputChange} 
            handleSubmit={handleSubmit} 
            closeModal={onClose} 
          />
        )}

        {activeTab === 'bulk' && (
          <BulkUploadTermOfPayment onClose={onClose} />
        )}
        </div>
      </div>
    </div>
  );
};

export default AddTermOfPaymentModal;
