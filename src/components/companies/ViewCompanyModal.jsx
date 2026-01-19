import React from 'react';
import {
  XMarkIcon,
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

const ViewCompanyModal = ({ show, onClose, company }) => {
  if (!show) {
    return null;
  }

  const logoUrl = company?.logo || null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
              {company?.nama_perusahaan || 'No company name available'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {company ? (
            <div className="space-y-6">
              {/* Company Logo */}
              {logoUrl && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <PhotoIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Company Logo</h3>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-48 h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={logoUrl}
                        alt={`${company?.nama_perusahaan || 'Company'} logo`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Company Signature */}
              {company?.signature_surat_jalan_image && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Digital Signature</h3>
                  </div>
                  <div className="flex justify-center flex-col items-center">
                    <div className="w-48 h-24 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mb-2">
                      <img
                        src={company.signature_surat_jalan_image}
                        alt="Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    {company?.signature_surat_jalan_nama && (
                      <p className="text-sm text-gray-600">
                        Signatory: <span className="font-medium text-gray-900">{company.signature_surat_jalan_nama}</span>
                      </p>
                    )}
                  </div>
                </div>

              )}

              {/* Invoice Signature */}
              {company?.signature_invoice_image && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Invoice Digital Signature</h3>
                  </div>
                  <div className="flex justify-center flex-col items-center">
                    <div className="w-48 h-24 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mb-2">
                      <img
                        src={company.signature_invoice_image}
                        alt="Invoice Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    {company?.signature_invoice_nama && (
                      <p className="text-sm text-gray-600">
                        Signatory: <span className="font-medium text-gray-900">{company.signature_invoice_nama}</span>
                      </p>
                    )}
                  </div>
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
                    { label: 'Main Director', value: company?.direktur_utama },
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
                    { label: 'Bank Name', value: company?.bank },
                    { label: 'Account Number', value: company?.no_rekening, copyable: true },
                    { label: 'Account Name', value: company?.bank_account_name },
                    { label: 'Branch', value: company?.bank_cabang },
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
                    { label: 'Phone', value: company?.telp, copyable: true },
                    { label: 'Fax', value: company?.fax },
                    { label: 'Email', value: company?.email, copyable: true },
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
                    { label: 'NPWP', value: company?.npwp, copyable: true },
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
                    { label: 'Created By', value: company?.createdBy },
                    { label: 'Created At', value: formatDateTime(company?.createdAt) },
                    { label: 'Updated By', value: company?.updatedBy },
                    { label: 'Updated At', value: formatDateTime(company?.updatedAt) },
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Company data is not available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div >
  );
};

export default ViewCompanyModal;

