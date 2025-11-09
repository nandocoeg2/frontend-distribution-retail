import React, { useEffect, useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tambah Item</h2>
            <p className="text-sm text-gray-600">
              {activeTab === 'manual' 
                ? 'Lengkapi detail barang sesuai dokumentasi API terbaru.' 
                : 'Upload file Excel untuk menambahkan item secara massal.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-white hover:text-gray-700"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('manual')}
              className={`${
                activeTab === 'manual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Manual</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`${
                activeTab === 'bulk'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Bulk Upload</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          {activeTab === 'manual' ? (
            <ItemForm
              onSubmit={handleSubmit}
              onClose={onClose}
              loading={loading}
              error={error}
            />
          ) : (
            <BulkUploadItem onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;
