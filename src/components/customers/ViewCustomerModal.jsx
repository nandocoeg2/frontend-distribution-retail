import React, { useState, useEffect } from 'react';
import customerService from '@/services/customerService';
import toastService from '@/services/toastService';
import { ClipboardDocumentIcon, XMarkIcon, BuildingStorefrontIcon, MapPinIcon, DevicePhoneMobileIcon, AtSymbolIcon, IdentificationIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { InfoTable } from '../ui';

const ViewCustomerModal = ({ show, onClose, customer }) => {
  const [fullCustomer, setFullCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show && customer?.id) {
      const fetchCustomerDetails = async () => {
        setLoading(true);
        try {
          const response = await customerService.getById(customer.id);
          
          // Handle different response structures
          let customerData;
          if (response?.success && response?.data) {
            customerData = response.data;
          } else if (response?.data) {
            customerData = response.data;
          } else {
            customerData = response;
          }
          
          setFullCustomer(customerData);
        } catch (error) {
          console.error('Error fetching customer details:', error);
          toastService.error('Failed to load customer details.');
          // Don't close modal on error, just show the prop data as fallback
        } finally {
          setLoading(false);
        }
      };
      fetchCustomerDetails();
    } else {
      setFullCustomer(null);
      setLoading(false);
    }
  }, [show, customer?.id, onClose]);

  if (!show) {
    return null;
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',  
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toastService.success('Copied to clipboard!');
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
            <p className="text-sm text-gray-600">{customer?.namaCustomer}</p>
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
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (fullCustomer || customer) ? (
            <div className="space-y-6">
              {/* Debug info - remove this after fixing */}
              {console.log('Rendering with fullCustomer:', fullCustomer)}
              {console.log('Rendering with customer prop:', customer)}
              {/* Customer Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <BuildingStorefrontIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                </div>
                <InfoTable 
                  data={[
                    { label: 'Customer Name', value: fullCustomer?.namaCustomer || customer?.namaCustomer },
                    { label: 'Customer Code', value: fullCustomer?.kodeCustomer || customer?.kodeCustomer, copyable: true },
                    { label: 'Group Customer', value: fullCustomer?.groupCustomer?.nama_group || customer?.groupCustomer?.nama_group },
                    { label: 'Region', value: fullCustomer?.region?.nama_region || customer?.region?.nama_region }
                  ]}
                />
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                </div>
                <InfoTable 
                  data={[
                    { label: 'Shipping Address', value: fullCustomer?.alamatPengiriman || customer?.alamatPengiriman },
                    { label: 'NPWP Address', value: fullCustomer?.alamatNPWP || customer?.alamatNPWP }
                  ]}
                />
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>
                <InfoTable 
                  data={[
                    { label: 'Phone Number', value: fullCustomer?.phoneNumber || customer?.phoneNumber, copyable: true },
                    { label: 'Email', value: fullCustomer?.email || customer?.email, copyable: true }
                  ]}
                />
              </div>

              {/* Tax Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <IdentificationIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Tax Information</h3>
                </div>
                <InfoTable 
                  data={[
                    { label: 'NPWP', value: fullCustomer?.NPWP || customer?.NPWP, copyable: true },
                    { label: 'Description', value: fullCustomer?.description || customer?.description }
                  ]}
                />
              </div>

              {/* System Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
                </div>
                <InfoTable 
                  data={[
                    { label: 'Created', value: formatDate(fullCustomer?.createdAt || customer?.createdAt) },
                    { label: 'Last Updated', value: formatDate(fullCustomer?.updatedAt || customer?.updatedAt) }
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Could not load customer details.</p>
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
    </div>
  );
};

export default ViewCustomerModal;

