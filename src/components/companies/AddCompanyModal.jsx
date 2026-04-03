import { useState } from 'react';
import CompanyForm from '@/components/companies/CompanyForm';

const createInitialFormData = () => ({
  kode_company: '',
  kode_company_surat: '',
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

const AddCompanyModal = ({ show, onClose, onCompanyAdded, handleAuthError }) => {
  const [formData, setFormData] = useState(createInitialFormData);

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
    // Only send logo if it exists
    const dataToSend = { ...formData };
    if (!dataToSend.logo) {
      delete dataToSend.logo;
    }
    if (!dataToSend.signature_surat_jalan_image) {
      delete dataToSend.signature_surat_jalan_image;
    }
    if (!dataToSend.signature_invoice_image) {
      delete dataToSend.signature_invoice_image;
    }
    onCompanyAdded(dataToSend);
  };

  const handleClose = () => {
    // Reset form data when closing
    setFormData(createInitialFormData());
    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <h3 className='text-lg font-medium text-gray-900 px-5 py-3 border-b border-gray-200'>
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
          signatureImage={formData.signature_surat_jalan_image}
          onSignatureImageChange={handleSignatureImageChange}
          onSignatureImageRemove={handleSignatureImageRemove}
          signatureInvoiceImage={formData.signature_invoice_image}
          onSignatureInvoiceImageChange={handleSignatureInvoiceImageChange}
          onSignatureInvoiceImageRemove={handleSignatureInvoiceImageRemove}
        />
      </div>
    </div>
  );
};

export default AddCompanyModal;
