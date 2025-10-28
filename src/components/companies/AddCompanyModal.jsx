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
    logoId: null
  });

  const [logoUrl, setLogoUrl] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleLogoChange = (fileId) => {
    setFormData((prev) => ({
      ...prev,
      logoId: fileId
    }));
  };

  const handleLogoRemove = () => {
    setFormData((prev) => ({
      ...prev,
      logoId: null
    }));
    setLogoUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Only send logoId if it exists
    const dataToSend = { ...formData };
    if (!dataToSend.logoId) {
      delete dataToSend.logoId;
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
      logoId: null
    });
    setLogoUrl(null);
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
          logoId={formData.logoId}
          logoUrl={logoUrl}
          onLogoChange={handleLogoChange}
          onLogoRemove={handleLogoRemove}
        />
      </div>
    </div>
  );
};

export default AddCompanyModal;

