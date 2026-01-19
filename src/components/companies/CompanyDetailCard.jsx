import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  MapPinIcon,
  DevicePhoneMobileIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable } from '../ui';
import toastService from '@/services/toastService';
import CompanyForm from './CompanyForm';

const CompanyDetailCard = ({ company, onClose, onUpdate, updateCompany }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
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
    id_tku: '',
    logo: null,
    signature_surat_jalan_nama: '',
    signature_surat_jalan_image: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        kode_company: company.kode_company || '',
        kode_company_surat: company.kode_company_surat || '',
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
        id_tku: company.id_tku || '',
        logo: company.logo || null,
        signature_surat_jalan_nama: company.signature_surat_jalan_nama || '',
        signature_surat_jalan_image: company.signature_surat_jalan_image || null,
      });
    }
  }, [company]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset to original values
    if (company) {
      setFormData({
        kode_company: company.kode_company || '',
        kode_company_surat: company.kode_company_surat || '',
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
        id_tku: company.id_tku || '',
        logo: company.logo || null,
        signature_surat_jalan_nama: company.signature_surat_jalan_nama || '',
        signature_surat_jalan_image: company.signature_surat_jalan_image || null,
      });
    }
  };

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

  const handleSave = async () => {
    if (!formData.kode_company || !formData.nama_perusahaan) {
      toastService.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const response = await updateCompany(company.id, formData);
      if (response && response.success) {
        toastService.success('Company updated successfully');
        setIsEditMode(false);
        if (onUpdate) {
          onUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Error updating company:', error);
      toastService.error(error.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  if (!company) return null;

  const displayLogo = formData.logo || company?.logo || null;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Company Details
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
            {company?.nama_perusahaan || 'No company name available'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditMode ? (
            <>
              <button
                onClick={handleEditClick}
                className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditMode ? (
        /* EDIT MODE */
        <div className="bg-gray-50 rounded-lg p-6">
          <CompanyForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={(e) => { e.preventDefault(); handleSave(); }}
            closeModal={handleCancelEdit}
            isEdit={true}
            logo={formData.logo}
            onLogoChange={handleLogoChange}
            onLogoRemove={handleLogoRemove}
            signatureImage={formData.signature_surat_jalan_image}
            onSignatureImageChange={handleSignatureImageChange}
            onSignatureImageRemove={handleSignatureImageRemove}
            signatureInvoiceImage={formData.signature_invoice_image}
            onSignatureInvoiceImageChange={(base64String) => {
              setFormData((prev) => ({
                ...prev,
                signature_invoice_image: base64String
              }));
            }}
            onSignatureInvoiceImageRemove={() => {
              setFormData((prev) => ({
                ...prev,
                signature_invoice_image: null
              }));
            }}
          />
        </div>
      ) : (
        /* VIEW MODE */
        <div className="space-y-6">
          {/* Company Logo */}
          {displayLogo && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <PhotoIcon className="h-5 w-5 text-gray-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Company Logo</h3>
              </div>
              <div className="flex justify-center">
                <div className="w-48 h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={displayLogo}
                    alt={`${company.nama_perusahaan} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Signature Image Display */}
          {company.signature_surat_jalan_image && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <PencilIcon className="h-5 w-5 text-gray-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Digital Signature</h3>
              </div>
              <div className="flex justify-center">
                <div className="w-48 h-24 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={company.signature_surat_jalan_image}
                    alt="Signature"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
              {company.signature_surat_jalan_nama && (
                <p className="text-center mt-2 text-sm text-gray-600">
                  Signatory: <span className="font-medium text-gray-900">{company.signature_surat_jalan_nama}</span>
                </p>
              )}
            </div>
          )}

          {/* Invoice Signature Image Display */}
          {company.signature_invoice_image && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <PencilIcon className="h-5 w-5 text-gray-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Invoice Signature</h3>
              </div>
              <div className="flex justify-center">
                <div className="w-48 h-24 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={company.signature_invoice_image}
                    alt="Invoice Signature"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
              {company.signature_invoice_nama && (
                <p className="text-center mt-2 text-sm text-gray-600">
                  Signatory: <span className="font-medium text-gray-900">{company.signature_invoice_nama}</span>
                </p>
              )}
            </div>
          )}

          {/* Company Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Company Name', value: company?.nama_perusahaan },
                { label: 'Company Code', value: company?.kode_company, copyable: true },
                { label: 'Kode Company Surat', value: company?.kode_company_surat || '—' },
                { label: 'Main Director', value: company?.direktur_utama || '—' },
                {
                  label: 'Address',
                  component: (
                    <span className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      {company?.alamat || 'N/A'}
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {/* Bank Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <BanknotesIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Bank Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Bank Name', value: company?.bank || '—' },
                { label: 'Account Number', value: company?.no_rekening || '—', copyable: !!company?.no_rekening },
                { label: 'Account Name', value: company?.bank_account_name || '—' },
                { label: 'Branch', value: company?.bank_cabang || '—' },
              ]}
            />
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Phone', value: company?.telp || '—', copyable: !!company?.telp },
                { label: 'Fax', value: company?.fax || '—' },
                { label: 'Email', value: company?.email || '—', copyable: !!company?.email },
              ]}
            />
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <IdentificationIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Tax Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'NPWP', value: company?.npwp || '—', copyable: !!company?.npwp },
                { label: 'ID TKU', value: company?.id_tku || '—', copyable: !!company?.id_tku },
              ]}
            />
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <CalendarDaysIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Created By', value: company?.createdBy || '—' },
                { label: 'Created At', value: formatDateTime(company?.createdAt) },
                { label: 'Updated By', value: company?.updatedBy || '—' },
                { label: 'Updated At', value: formatDateTime(company?.updatedAt) },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetailCard;
