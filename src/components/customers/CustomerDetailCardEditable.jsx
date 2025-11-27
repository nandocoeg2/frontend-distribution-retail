import React, { useState, useEffect } from 'react';
import { 
  BuildingStorefrontIcon, 
  MapPinIcon, 
  DevicePhoneMobileIcon, 
  AtSymbolIcon,
  IdentificationIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import customerService from '@/services/customerService';
import toastService from '@/services/toastService';
import { groupCustomerService } from '@/services/groupCustomerService';
import Autocomplete from '@/components/common/Autocomplete';
import CustomerPICForm from './CustomerPICForm';

const CustomerDetailCardEditable = ({ customer, onClose, onUpdate }) => {
  const [fullCustomer, setFullCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);
  const [groupCustomers, setGroupCustomers] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      if (!customer?.id) return;
      
      try {
        setLoading(true);
        const response = await customerService.getById(customer.id);
        
        let customerData;
        if (response?.success && response?.data) {
          customerData = response.data;
        } else if (response?.data) {
          customerData = response.data;
        } else {
          customerData = response;
        }
        
        setFullCustomer(customerData);
        initializeFormData(customerData);
      } catch (error) {
        console.error('Error fetching customer details:', error);
        toastService.error('Failed to load customer details.');
        setFullCustomer(customer);
        initializeFormData(customer);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetail();
  }, [customer?.id]);

  const initializeFormData = (customerData) => {
    setFormData({
      namaCustomer: customerData?.namaCustomer || '',
      kodeCustomer: customerData?.kodeCustomer || '',
      groupCustomerId: customerData?.groupCustomerId || '',
      region: customerData?.region || '',
      alamatPengiriman: customerData?.alamatPengiriman || '',
      phoneNumber: customerData?.phoneNumber || '',
      email: customerData?.email || '',
      NPWP: customerData?.NPWP || '',
      alamatNPWP: customerData?.alamatNPWP || '',
      customerPics: customerData?.customerPics?.map(pic => ({
        id: pic.id,
        nama_pic: pic.nama_pic || '',
        dept: pic.dept || '',
        telpon: pic.telpon || '',
        default: pic.default || false
      })) || []
    });
  };

  const fetchDropdownData = async () => {
    try {
      setDropdownLoading(true);
      const groupCustomersResponse = await groupCustomerService.getAllGroupCustomers(1, 100);
      
      if (groupCustomersResponse.success) {
        setGroupCustomers(groupCustomersResponse.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toastService.error('Failed to load dropdown data.');
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    fetchDropdownData();
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    initializeFormData(fullCustomer);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await customerService.update(customer.id, formData);
      toastService.success('Customer updated successfully!');
      
      // Refresh customer data
      const response = await customerService.getById(customer.id);
      let customerData;
      if (response?.success && response?.data) {
        customerData = response.data;
      } else if (response?.data) {
        customerData = response.data;
      } else {
        customerData = response;
      }
      
      setFullCustomer(customerData);
      initializeFormData(customerData);
      setIsEditMode(false);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toastService.error('Failed to update customer.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAutocompleteChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePICsChange = (pics) => {
    setFormData(prev => ({ ...prev, customerPics: pics }));
  };

  if (!customer) return null;

  const displayCustomer = fullCustomer || customer;
  const displayData = isEditMode ? formData : displayCustomer;
  const defaultPic = displayCustomer.customerPics?.find(pic => pic.default);
  const primaryPic = defaultPic || displayCustomer.customerPics?.[0];

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Customer Details
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{customer.namaCustomer}</p>
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
                disabled={saving || dropdownLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">Loading customer details...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {isEditMode ? (
            /* EDIT MODE */
            <div className="space-y-6">
              {/* Basic Info Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    name="namaCustomer"
                    value={formData?.namaCustomer || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Code *</label>
                  <input
                    type="text"
                    name="kodeCustomer"
                    value={formData?.kodeCustomer || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Autocomplete
                    label="Group Customer"
                    name="groupCustomerId"
                    options={groupCustomers}
                    value={formData?.groupCustomerId || ''}
                    onChange={(e) => handleAutocompleteChange('groupCustomerId', e.target.value)}
                    placeholder="Search for a group"
                    displayKey="nama_group"
                    valueKey="id"
                    required
                    disabled={dropdownLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    name="region"
                    value={formData?.region || ''}
                    onChange={handleInputChange}
                    placeholder="Enter region"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData?.phoneNumber || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData?.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                  <textarea
                    name="alamatPengiriman"
                    value={formData?.alamatPengiriman || ''}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
                  <input
                    type="text"
                    name="NPWP"
                    value={formData?.NPWP || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NPWP Address</label>
                  <textarea
                    name="alamatNPWP"
                    value={formData?.alamatNPWP || ''}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </div>

              {/* PICs Form */}
              <div className="border-t border-gray-200 pt-6">
                <CustomerPICForm
                  pics={formData?.customerPics || []}
                  onChange={handlePICsChange}
                  disabled={saving}
                />
              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <>
              {/* Main Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-3">
                    <BuildingStorefrontIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-900">Customer Information</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Customer Name:</span>
                      <p className="font-medium text-gray-900">{displayCustomer.namaCustomer}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Customer Code:</span>
                      <p className="font-medium text-gray-900">{displayCustomer.kodeCustomer}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Group:</span>
                      <p className="font-medium text-gray-900">{displayCustomer.groupCustomer?.nama_group || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Region:</span>
                      <p className="font-medium text-gray-900">{displayCustomer.region || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact & Address Information */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-3">
                    <MapPinIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-900">Contact & Address</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs flex items-center">
                        <DevicePhoneMobileIcon className="h-3 w-3 mr-1" />
                        Phone:
                      </span>
                      <p className="font-medium text-gray-900">{displayCustomer.phoneNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs flex items-center">
                        <AtSymbolIcon className="h-3 w-3 mr-1" />
                        Email:
                      </span>
                      <p className="font-medium text-gray-900">{displayCustomer.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Shipping Address:</span>
                      <p className="font-medium text-gray-900 text-xs leading-relaxed">
                        {displayCustomer.alamatPengiriman || '-'}
                      </p>
                    </div>
                    {displayCustomer.NPWP && (
                      <div>
                        <span className="text-gray-500 text-xs flex items-center">
                          <IdentificationIcon className="h-3 w-3 mr-1" />
                          NPWP:
                        </span>
                        <p className="font-medium text-gray-900">{displayCustomer.NPWP}</p>
                        {displayCustomer.alamatNPWP && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{displayCustomer.alamatNPWP}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary PIC & System Info */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-3">
                    <UserCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-900">Primary Contact</h4>
                  </div>
                  
                  {primaryPic ? (
                    <div className="space-y-2 text-sm mb-4">
                      <div>
                        <span className="text-gray-500 text-xs">Name:</span>
                        <p className="font-medium text-gray-900">{primaryPic.nama_pic}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Department:</span>
                        <p className="font-medium text-gray-900">{primaryPic.dept}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Phone:</span>
                        <a 
                          href={`tel:${primaryPic.telpon}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {primaryPic.telpon}
                        </a>
                      </div>
                      {displayCustomer.customerPics && displayCustomer.customerPics.length > 1 && (
                        <p className="text-xs text-gray-500 italic">
                          +{displayCustomer.customerPics.length - 1} more PIC(s)
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-4">No PIC assigned</p>
                  )}

                  {/* System Info */}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center mb-2">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-xs font-medium text-gray-500">System Info</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div>
                        <span className="text-gray-400">Created:</span> {formatDateTime(displayCustomer.createdAt)}
                      </div>
                      <div>
                        <span className="text-gray-400">Updated:</span> {formatDateTime(displayCustomer.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Customer PICs */}
              {displayCustomer.customerPics && displayCustomer.customerPics.length > 1 && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <UserCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    All Customer PICs ({displayCustomer.customerPics.length})
                  </h4>
                  <div className={`overflow-x-auto ${displayCustomer.customerPics.length > 5 ? 'max-h-80 overflow-y-auto' : ''}`}>
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b">
                            No
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b">
                            Department
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b">
                            Phone
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {displayCustomer.customerPics
                          .sort((a, b) => (b.default ? 1 : 0) - (a.default ? 1 : 0))
                          .map((pic, index) => (
                          <tr 
                            key={pic.id || index}
                            className={pic.default ? 'bg-blue-50' : 'hover:bg-gray-50'}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {pic.nama_pic}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {pic.dept}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <a 
                                href={`tel:${pic.telpon}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {pic.telpon}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {pic.default && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                                  Default
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerDetailCardEditable;
