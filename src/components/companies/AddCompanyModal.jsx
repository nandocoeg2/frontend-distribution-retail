import React, { useState } from 'react';
import CompanyForm from '@/components/companies/CompanyForm';

const AddCompanyModal = ({ show, onClose, onCompanyAdded, handleAuthError }) => {
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
    npwp: '',
    logo: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleLogoChange = (base64String) => {
    setFormData((prev) => ({
      ...prev,
      logo: base64String
    }));
  };

  const handleLogoRemove = () => {
    setFormData((prev) => ({
      ...prev,
      logo: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Only send logo if it exists
    const dataToSend = { ...formData };
    if (!dataToSend.logo) {
      delete dataToSend.logo;
    }
    onCompanyAdded(dataToSend);
  };

  const handleClose = () => {
    // Reset form data when closing
    setFormData({
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
      npwp: '',
      logo: null
    });
    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Add New Company
        </h3>
        <CompanyForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={handleSubmit} 
          closeModal={handleClose}
          logo={formData.logo}
          onLogoChange={handleLogoChange}
          onLogoRemove={handleLogoRemove}
        />
      </div>
    </div>
  );
};

export default AddCompanyModal;

