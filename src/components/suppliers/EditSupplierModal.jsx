import React from 'react';
import { useState, useEffect } from 'react';
import SupplierForm from '@/components/suppliers/SupplierForm';
import toastService from '@/services/toastService';

const API_URL = `${process.env.BACKEND_BASE_URL}api/v1`;

const parseValidationError = (errData) => {
  const errors = {};
  
  if (errData && errData.code === 'FST_ERR_VALIDATION' && typeof errData.message === 'string') {
    try {
      const parsed = JSON.parse(errData.message);
      if (Array.isArray(parsed)) {
        parsed.forEach(issue => {
          if (Array.isArray(issue.path) && issue.path.length > 0) {
            const key = issue.path.join('.');
            errors[key] = issue.message;
          }
        });
      }
    } catch (e) {
      // ignore JSON parse error
    }
  }
  
  if (errData && errData.error === 'Validation failed' && Array.isArray(errData.issues)) {
    errData.issues.forEach(issue => {
      if (issue.path) {
        const key = issue.path.startsWith('body.') ? issue.path.slice(5) : issue.path;
        errors[key] = issue.message;
      }
    });
  }
  
  return errors;
};

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
  const [errors, setErrors] = useState({});

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
      setErrors({});
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw errorData;
      }

      const updatedSupplier = await response.json();
      onSupplierUpdated(updatedSupplier);
      toastService.success('Supplier updated successfully');
      setErrors({});
      onClose();
    } catch (err) {
      if (err && typeof err === 'object') {
        const validationErrors = parseValidationError(err);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          toastService.error('Validation failed. Please check the fields.');
          return;
        }
      }
      toastService.error(err.message || 'Failed to update supplier');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <div className='flex items-center justify-between border-b border-gray-200 bg-amber-600 px-5 py-3 text-white'>
          <h3 className='text-base font-semibold'>Edit Supplier</h3>
        </div>
        <div className='px-5 py-4 overflow-y-auto max-h-[calc(85vh-60px)]'>
        <SupplierForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={updateSupplier}
          closeModal={onClose}
          isEdit
          errors={errors}
        />
        </div>
      </div>
    </div>
  );
};

export default EditSupplierModal;
