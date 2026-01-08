import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { AccordionItem, InfoTable } from '../ui';
import toastService from '../../services/toastService';

const API_URL = `${process.env.BACKEND_BASE_URL}api/v1`;

const SupplierDetailCard = ({ supplier, onClose, onUpdate, handleAuthError }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [supplierData, setSupplierData] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    contactInfo: false,
    companyInfo: false,
    bankInfo: false,
    metaInfo: false,
  });

  // Fetch supplier data by ID when component opens
  const fetchSupplierById = async (id) => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch supplier');

      const result = await response.json();
      setSupplierData(result.data);
    } catch (err) {
      console.error('Error fetching supplier:', err);
      toastService.error('Gagal memuat data supplier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supplier?.id) {
      fetchSupplierById(supplier.id);
    }
  }, [supplier?.id]);

  useEffect(() => {
    if (supplierData) {
      setFormData({
        name: supplierData.name || '',
        code: supplierData.code || '',
        supplier_code_letter: supplierData.supplier_code_letter || '',
        address: supplierData.address || '',
        phoneNumber: supplierData.phoneNumber || '',
        description: supplierData.description || '',
        email: supplierData.email || '',
        fax: supplierData.fax || '',
        direktur: supplierData.direktur || '',
        npwp: supplierData.npwp || '',
        id_tku: supplierData.id_tku || '',
        logo: supplierData.logo || '',
        bank: {
          name: supplierData.bank?.name || '',
          account: supplierData.bank?.account || '',
          holder: supplierData.bank?.holder || ''
        }
      });
    }
  }, [supplierData]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset to original values from fetched data
    if (supplierData) {
      setFormData({
        name: supplierData.name || '',
        code: supplierData.code || '',
        supplier_code_letter: supplierData.supplier_code_letter || '',
        address: supplierData.address || '',
        phoneNumber: supplierData.phoneNumber || '',
        description: supplierData.description || '',
        email: supplierData.email || '',
        fax: supplierData.fax || '',
        direktur: supplierData.direktur || '',
        npwp: supplierData.npwp || '',
        id_tku: supplierData.id_tku || '',
        logo: supplierData.logo || '',
        bank: {
          name: supplierData.bank?.name || '',
          account: supplierData.bank?.account || '',
          holder: supplierData.bank?.holder || ''
        }
      });
    }
  };

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

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toastService.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
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

      if (!response.ok) throw new Error('Failed to update supplier');

      toastService.success('Supplier updated successfully');
      setIsEditMode(false);
      // Refetch supplier data to get updated values
      await fetchSupplierById(supplier.id);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating supplier:', err);
      toastService.error('Failed to update supplier');
    } finally {
      setSaving(false);
    }
  };

  if (!supplier) return null;

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mt-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Memuat data supplier...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Supplier Details
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
            {supplier?.name || 'No supplier name available'}
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
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Name *
                </label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Code *
                </label>
                <input
                  type='text'
                  name='code'
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder='e.g., 2PZ1.J.0400.1.F'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Supplier Code Letter
                </label>
                <input
                  type='text'
                  name='supplier_code_letter'
                  value={formData.supplier_code_letter}
                  onChange={handleInputChange}
                  maxLength={5}
                  placeholder='e.g., DVT (max 5 characters)'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <p className='mt-1 text-xs text-gray-500'>Kode ini akan digunakan untuk generate nomor Surat Jalan</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Phone Number
                </label>
                <input
                  type='tel'
                  name='phoneNumber'
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Address
                </label>
                <textarea
                  name='address'
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder='e.g., JAKARTA BARAT'
                  rows={2}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Description
                </label>
                <textarea
                  name='description'
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder='e.g., Supplier terpercaya untuk produk berkualitas'
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder='e.g., supplier@example.com'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Fax
                </label>
                <input
                  type='tel'
                  name='fax'
                  value={formData.fax}
                  onChange={handleInputChange}
                  placeholder='e.g., 021-1234567'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              {/* Company Information Section */}
              <div className='border-t pt-4 mt-4'>
                <h4 className='text-md font-medium text-gray-800 mb-3'>Company Information</h4>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Direktur
                    </label>
                    <input
                      type='text'
                      name='direktur'
                      value={formData.direktur}
                      onChange={handleInputChange}
                      placeholder='e.g., Budi Santoso'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      NPWP
                    </label>
                    <input
                      type='text'
                      name='npwp'
                      value={formData.npwp}
                      onChange={handleInputChange}
                      placeholder='e.g., 01.234.567.8-901.000'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      ID TKU
                    </label>
                    <input
                      type='text'
                      name='id_tku'
                      value={formData.id_tku}
                      onChange={handleInputChange}
                      placeholder='e.g., TKU001'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Logo
                    </label>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleInputChange({
                              target: {
                                name: 'logo',
                                value: reader.result
                              }
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    {formData.logo && (
                      <div className='mt-2'>
                        <img
                          src={formData.logo}
                          alt='Logo preview'
                          className='h-20 w-20 object-contain border border-gray-300 rounded'
                        />
                      </div>
                    )}
                    <p className='mt-1 text-xs text-gray-500'>Upload logo supplier (format: PNG, JPG, atau SVG)</p>
                  </div>
                </div>
              </div>

              {/* Bank Information Section */}
              <div className='border-t pt-4 mt-4'>
                <h4 className='text-md font-medium text-gray-800 mb-3'>Bank Information</h4>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Bank Name
                    </label>
                    <input
                      type='text'
                      name='bank.name'
                      value={formData.bank?.name || ''}
                      onChange={handleInputChange}
                      placeholder='e.g., BCA'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Account Number
                    </label>
                    <input
                      type='text'
                      name='bank.account'
                      value={formData.bank?.account || ''}
                      onChange={handleInputChange}
                      placeholder='e.g., 123456789'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Account Holder
                    </label>
                    <input
                      type='text'
                      name='bank.holder'
                      value={formData.bank?.holder || ''}
                      onChange={handleInputChange}
                      placeholder='e.g., EFG PT'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW MODE */
        <div className="space-y-6">
          {/* Basic Information */}
          <AccordionItem
            title='Informasi Dasar'
            isExpanded={expandedSections.basicInfo}
            onToggle={() => toggleSection('basicInfo')}
            bgColor='bg-gradient-to-r from-purple-50 to-purple-100'
          >
            <InfoTable
              data={[
                { label: 'Nama Supplier', value: supplierData?.name || '—' },
                { label: 'Kode Supplier', value: supplierData?.code || '—' },
                { label: 'Kode Surat', value: supplierData?.supplier_code_letter || '—' },
                {
                  label: 'Alamat',
                  component: (
                    <span className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      {supplierData?.address || '—'}
                    </span>
                  )
                },
                { label: 'Email', value: supplierData?.email || '—', copyable: !!supplierData?.email },
                { label: 'Telepon', value: supplierData?.phoneNumber || '—', copyable: !!supplierData?.phoneNumber },
                { label: 'Fax', value: supplierData?.fax || '—', copyable: !!supplierData?.fax },
                { label: 'Direktur', value: supplierData?.direktur || '—' },
                { label: 'NPWP', value: supplierData?.npwp || '—', copyable: !!supplierData?.npwp },
                { label: 'ID TKU', value: supplierData?.id_tku || '—', copyable: !!supplierData?.id_tku },
                {
                  label: 'Bank Name',
                  component: (
                    <span className="flex items-center gap-2">
                      <BanknotesIcon className="h-4 w-4 text-gray-400" />
                      {supplierData?.bank?.name || '—'}
                    </span>
                  )
                },
                { label: 'Account Number', value: supplierData?.bank?.account || '—', copyable: !!supplierData?.bank?.account },
                { label: 'Account Holder', value: supplierData?.bank?.holder || '—' },
              ]}
            />
            {supplierData?.logo && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Logo:</p>
                <img
                  src={supplierData.logo}
                  alt="Supplier Logo"
                  className="h-24 w-24 object-contain border border-gray-300 rounded"
                />
              </div>
            )}
          </AccordionItem>

          {/* System Information */}
          <AccordionItem
            title='Informasi Sistem'
            isExpanded={expandedSections.metaInfo}
            onToggle={() => toggleSection('metaInfo')}
            bgColor='bg-gradient-to-r from-gray-50 to-gray-100'
          >
            <InfoTable
              data={[
                {
                  label: 'Dibuat Pada',
                  component: (
                    <span className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                      {formatDateTime(supplierData?.createdAt)}
                    </span>
                  ),
                },
                {
                  label: 'Diperbarui Pada',
                  value: formatDateTime(supplierData?.updatedAt),
                },
              ]}
            />
          </AccordionItem>
        </div>
      )}
    </div>
  );
};

export default SupplierDetailCard;
