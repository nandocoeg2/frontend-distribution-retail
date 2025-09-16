import React, { useState, useEffect } from 'react';
import TermOfPaymentForm from '@/components/termOfPayments/TermOfPaymentForm';
import toastService from '@/services/toastService';

const API_URL = 'http://localhost:5050/api/v1/term-of-payments';

const EditTermOfPaymentModal = ({ show, onClose, termOfPayment, onTermOfPaymentUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState({
    kode_top: '',
    batas_hari: '',
  });

  useEffect(() => {
    if (termOfPayment) {
      setFormData({
        kode_top: termOfPayment.kode_top,
        batas_hari: termOfPayment.batas_hari,
      });
    }
  }, [termOfPayment]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateTermOfPayment = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${termOfPayment.id}`, {
        method: 'PUT',
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

      if (!response.ok) throw new Error('Failed to update term of payment');

      const updatedTermOfPayment = await response.json();
      onTermOfPaymentUpdated(updatedTermOfPayment);
      toastService.success('Term of payment updated successfully');
      onClose();
    } catch (err) {
      toastService.error('Failed to update term of payment');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Edit Term of Payment
        </h3>
        <TermOfPaymentForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={updateTermOfPayment} 
          closeModal={onClose}
          isEdit={true}
        />
      </div>
    </div>
  );
};

export default EditTermOfPaymentModal;
