import React, { useState } from 'react';
import TermOfPaymentForm from '@/components/termOfPayments/TermOfPaymentForm';

const AddTermOfPaymentModal = ({ show, onClose, onTermOfPaymentAdded, handleAuthError }) => {
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
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Tambah Syarat Pembayaran Baru
        </h3>
        <TermOfPaymentForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={handleSubmit} 
          closeModal={onClose} 
        />
      </div>
    </div>
  );
};

export default AddTermOfPaymentModal;
