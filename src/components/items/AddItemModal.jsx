import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ItemForm from './ItemForm';
import BulkUploadItem from './BulkUploadItem';
import { useItemOperations } from '../../hooks/useItem';

const AddItemModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('manual');
  const {
    createItemData,
    loading,
    error,
    setError,
    clearError,
    validateItemData
  } = useItemOperations();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (formData) => {
    const validationErrors = validateItemData(formData);
    if (Object.keys(validationErrors).length > 0) {
      const [firstErrorMessage] = Object.values(validationErrors);
      setError(firstErrorMessage);
      return;
    }
    try {
      await createItemData(formData);
      onClose();
    } catch (error) {
      console.error('Create item error:', error);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-gray-200 bg-blue-600 px-5 py-3 text-white'>
          <h2 className='text-base font-semibold'>Tambah Item</h2>
          <button onClick={onClose} className='rounded p-1 hover:bg-white/20 focus:outline-none' aria-label='Tutup'>
            <XMarkIcon className='h-5 w-5' aria-hidden='true' />
          </button>
        </div>

        {/* Tabs */}
        <div className='border-b border-gray-200 bg-white px-5'>
          <nav className='-mb-px flex gap-6' aria-label='Tabs'>
            <button
              onClick={() => setActiveTab('manual')}
              className={`${activeTab === 'manual' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2.5 border-b-2 text-sm font-medium transition-colors`}
            >
              Manual
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`${activeTab === 'bulk' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2.5 border-b-2 text-sm font-medium transition-colors`}
            >
              Bulk Upload
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className='max-h-[80vh] overflow-y-auto px-5 py-4'>
          {activeTab === 'manual' ? (
            <ItemForm onSubmit={handleSubmit} onClose={onClose} loading={loading} error={error} />
          ) : (
            <BulkUploadItem onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;
