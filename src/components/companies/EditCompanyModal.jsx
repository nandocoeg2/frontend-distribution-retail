import { useState, useEffect } from 'react';
import CompanyForm from '@/components/companies/CompanyForm';

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
    id_tku: '',
    logo: null,
    signature_surat_jalan_nama: '',
    signature_surat_jalan_image: null,
    signature_invoice_nama: '',
    signature_invoice_image: null,
  });

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
        id_tku: company.id_tku || '',
        logo: company.logo || null,
        signature_surat_jalan_nama: company.signature_surat_jalan_nama || '',
        signature_surat_jalan_image: company.signature_surat_jalan_image || null,
        signature_invoice_nama: company.signature_invoice_nama || '',
        signature_invoice_image: company.signature_invoice_image || null,
      });
    }
  }, [company]);

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

  const handleSignatureImageChange = (base64String) => {
    setFormData((prev) => ({
      ...prev,
      signature_surat_jalan_image: base64String
    }));
  };

  const handleSignatureImageRemove = () => {
    setFormData((prev) => ({
      ...prev,
      signature_surat_jalan_image: null
    }));
  };

  const handleSignatureInvoiceImageChange = (base64String) => {
    setFormData((prev) => ({
      ...prev,
      signature_invoice_image: base64String
    }));
  };

  const handleSignatureInvoiceImageRemove = () => {
    setFormData((prev) => ({
      ...prev,
      signature_invoice_image: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Send all data including logo
    const dataToSend = { ...formData };

    // Convert empty strings to null for optional text fields if needed, 
    // or rely on schema accepting empty strings. 
    // BUT for images, ensure null is handled if schema update doesn't fix it fully.

    onCompanyUpdated(company.id, dataToSend);
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <div className='flex items-center justify-between border-b border-gray-200 bg-amber-600 px-5 py-3 text-white'>
          <h3 className='text-base font-semibold'>Edit Company</h3>
          <button onClick={onClose} className='rounded p-1 hover:bg-white/20 focus:outline-none' aria-label='Tutup'>
            <span className='text-lg leading-none'>&times;</span>
          </button>
        </div>

        <div className='max-h-[80vh] overflow-y-auto px-5 py-4'>
          <CompanyForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            closeModal={onClose}
            isEdit={true}
            logo={formData.logo}
            onLogoChange={handleLogoChange}
            onLogoRemove={handleLogoRemove}
            signatureImage={formData.signature_surat_jalan_image}
            onSignatureImageChange={handleSignatureImageChange}
            onSignatureImageRemove={handleSignatureImageRemove}
            signatureInvoiceImage={formData.signature_invoice_image}
            onSignatureInvoiceImageChange={handleSignatureInvoiceImageChange}
            onSignatureInvoiceImageRemove={handleSignatureInvoiceImageRemove}
          />
        </div>
      </div>
    </div>
  );
};

export default EditCompanyModal;

