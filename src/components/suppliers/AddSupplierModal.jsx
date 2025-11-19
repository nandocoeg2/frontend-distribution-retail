import React, { useState } from 'react';
import SupplierForm from '@/components/suppliers/SupplierForm';
import BulkUploadSupplier from '@/components/suppliers/BulkUploadSupplier';
import toastService from '@/services/toastService';

const API_URL = `${process.env.BACKEND_BASE_URL}api/v1`;

const AddSupplierModal = ({ show, onClose, onSupplierAdded, handleAuthError }) => {
  const [activeTab, setActiveTab] = useState('single');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    supplier_code_letter: '',
    address: '',
    phoneNumber: '',
    bank: {
      name: '',
      account: '',
      holder: ''
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle nested bank fields
    if (name.startsWith('bank.')) {
      const bankField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        bank: {
          ...prev.bank,
          [bankField]: value
        }
      }));
    } else {
      // Limit supplier_code_letter to 5 characters
      if (name === 'supplier_code_letter' && value.length > 5) {
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const createSupplier = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to create supplier');

      const newSupplier = await response.json();
      onSupplierAdded(newSupplier);
      toastService.success('Supplier created successfully');
      onClose();
    } catch (err) {
      toastService.error('Failed to create supplier');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-lg font-medium text-gray-900'>
            Add Supplier
          </h3>
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
        <div className='flex space-x-1 border-b border-gray-200 mb-6'>
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
        {activeTab === 'single' && (
          <SupplierForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={createSupplier}
            closeModal={onClose}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkUploadSupplier onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default AddSupplierModal;

