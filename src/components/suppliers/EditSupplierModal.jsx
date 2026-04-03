import { useState, useEffect } from 'react';
import SupplierForm from '@/components/suppliers/SupplierForm';
import toastService from '@/services/toastService';

const API_URL = `${process.env.BACKEND_BASE_URL}api/v1`;

const EditSupplierModal = ({ show, onClose, supplier, onSupplierUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    supplier_code_letter: '',
    address: '',
    phoneNumber: '',
    description: '',
    email: '',
    fax: '',
    direktur: '',
    npwp: '',
    id_tku: '',
    logo: '',
    bank: {
      name: '',
      account: '',
      holder: ''
    }
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        code: supplier.code || '',
        supplier_code_letter: supplier.supplier_code_letter || '',
        address: supplier.address || '',
        phoneNumber: supplier.phoneNumber || '',
        description: supplier.description || '',
        email: supplier.email || '',
        fax: supplier.fax || '',
        direktur: supplier.direktur || '',
        npwp: supplier.npwp || '',
        id_tku: supplier.id_tku || '',
        logo: supplier.logo || '',
        bank: {
          name: supplier.bank?.name || '',
          account: supplier.bank?.account || '',
          holder: supplier.bank?.holder || ''
        }
      });
    }
  }, [supplier]);

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

  const updateSupplier = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/suppliers/${supplier.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to update supplier');

      const updatedSupplier = await response.json();
      onSupplierUpdated(updatedSupplier);
      toastService.success('Supplier updated successfully');
      onClose();
    } catch (err) {
      toastService.error('Failed to update supplier');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <h3 className='text-lg font-medium text-gray-900 px-5 py-3 border-b border-gray-200'>
          Edit Supplier
        </h3>
        <div className='px-5 py-4 overflow-y-auto max-h-[calc(85vh-60px)]'>
        <SupplierForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={updateSupplier}
          closeModal={onClose}
          isEdit
        />
        </div>
      </div>
    </div>
  );
};

export default EditSupplierModal;

