import React, { useState } from 'react';
import CompanyForm from '@/components/companies/CompanyForm';
import useCompaniesPage from '@/hooks/useCompaniesPage';

const AddCompanyModal = ({ show, onClose, onCompanyAdded, handleAuthError }) => {
  const { createCompany } = useCompaniesPage();
  const [formData, setFormData] = useState({
    kode_company: '',
    nama_perusahaan: '',
    alamat: '',
    no_rekening: '',
    bank: '',
    bank_account_name: '',
    bank_cabang: '',
    telp: '',
    fax: '',
    email: '',
    direktur_utama: '',
    npwp: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createCompany(formData);
      onCompanyAdded(formData);
      onClose();
    } catch (err) {
      // Error handling is already done in the hook
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-4xl mx-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Add New Company
        </h3>
        <CompanyForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={handleSubmit} 
          closeModal={onClose} 
        />
      </div>
    </div>
  );
};

export default AddCompanyModal;

