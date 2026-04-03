import { useState, useEffect } from 'react';
import TermOfPaymentForm from '@/components/termOfPayments/TermOfPaymentForm';

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
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'batas_hari' ? parseInt(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onTermOfPaymentUpdated(termOfPayment.id, formData);
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <h3 className='text-lg font-medium text-gray-900 px-5 py-3 border-b border-gray-200'>
          Edit Term of Payment
        </h3>
        <TermOfPaymentForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={handleSubmit} 
          closeModal={onClose}
          isEdit={true}
        />
      </div>
    </div>
  );
};

export default EditTermOfPaymentModal;
