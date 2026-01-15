import React from 'react';
import ImageUpload from '@/components/common/ImageUpload';

const CompanyForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  closeModal,
  isEdit = false,
  logo,
  onLogoChange,
  onLogoRemove,
  // Signature props
  signatureImage,
  onSignatureImageChange,
  onSignatureImageRemove
}) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Logo Upload Section */}
        <div>
          <ImageUpload
            label="Company Logo"
            image={logo}
            onImageChange={onLogoChange}
            onImageRemove={onLogoRemove}
          />
        </div>

        {/* Signature Upload Section */}
        <div>
          <ImageUpload
            label="Digital Signature"
            image={signatureImage}
            onImageChange={onSignatureImageChange}
            onImageRemove={onSignatureImageRemove}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Code *</label>
          <input
            type="text"
            name="kode_company"
            value={formData.kode_company}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., COMP001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kode Company Surat</label>
          <input
            type="text"
            name="kode_company_surat"
            value={formData.kode_company_surat || ''}
            onChange={handleInputChange}
            maxLength={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., ABC (max 5 chars)"
          />
          <p className="text-xs text-gray-500 mt-1">Kode singkat untuk surat jalan (maksimal 5 karakter)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Signature Name</label>
          <input
            type="text"
            name="signature_surat_jalan_nama"
            value={formData.signature_surat_jalan_nama || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Mayang (Default)"
          />
          <p className="text-xs text-gray-500 mt-1">Nama yang muncul di tanda tangan surat jalan</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input
            type="text"
            name="nama_perusahaan"
            value={formData.nama_perusahaan}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., PT. Contoh Jaya"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            name="alamat"
            value={formData.alamat}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Jl. Contoh No. 123"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
          <input
            type="text"
            name="no_rekening"
            value={formData.no_rekening}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 1234567890"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
          <input
            type="text"
            name="bank"
            value={formData.bank}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., BCA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Name</label>
          <input
            type="text"
            name="bank_account_name"
            value={formData.bank_account_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., PT. Contoh Jaya"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
          <input
            type="text"
            name="bank_cabang"
            value={formData.bank_cabang}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Jakarta Pusat"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            name="telp"
            value={formData.telp}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 0211234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
          <input
            type="text"
            name="fax"
            value={formData.fax}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 0211234568"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., info@contohjaya.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Main Director</label>
          <input
            type="text"
            name="direktur_utama"
            value={formData.direktur_utama}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Budi Santoso"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
          <input
            type="text"
            name="npwp"
            value={formData.npwp}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 01.234.567.8-901.000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID TKU</label>
          <input
            type="text"
            name="id_tku"
            value={formData.id_tku || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., TKU12345"
          />
          <p className="text-xs text-gray-500 mt-1">ID Tempat Kegiatan Usaha</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={closeModal}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {isEdit ? 'Save Changes' : 'Add Company'}
        </button>
      </div>
    </form>
  );
};

export default CompanyForm;

