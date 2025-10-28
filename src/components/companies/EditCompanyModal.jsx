import React, { useState, useEffect } from 'react';
import CompanyForm from '@/components/companies/CompanyForm';
import fileService from '@/services/fileService';

const EditCompanyModal = ({ show, onClose, company, onCompanyUpdated, handleAuthError }) => {
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

  useEffect(() => {
    if (company) {
      setFormData({
        kode_company: company.kode_company || '',
        nama_perusahaan: company.nama_perusahaan || '',
        alamat: company.alamat || '',
        no_rekening: company.no_rekening || '',
        bank: company.bank || '',
        bank_account_name: company.bank_account_name || '',
        bank_cabang: company.bank_cabang || '',
        telp: company.telp || '',
        fax: company.fax || '',
        email: company.email || '',
        direktur_utama: company.direktur_utama || '',
        npwp: company.npwp || '',
        logoId: company.logoId || null
      });

      // Set logo URL if logo exists
      if (company.logoId) {
        setLogoUrl(fileService.getFileUrl(company.logoId));
      } else {
        setLogoUrl(null);
      }
    }
  }, [company]);

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
    setLogoUrl(fileService.getFileUrl(fileId));
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
    // Send all data including logoId
    onCompanyUpdated(company.id, formData);
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Edit Company
        </h3>
        <CompanyForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={handleSubmit} 
          closeModal={onClose}
          isEdit={true}
          logoId={formData.logoId}
          logoUrl={logoUrl}
          onLogoChange={handleLogoChange}
          onLogoRemove={handleLogoRemove}
        />
      </div>
    </div>
  );
};

export default EditCompanyModal;

