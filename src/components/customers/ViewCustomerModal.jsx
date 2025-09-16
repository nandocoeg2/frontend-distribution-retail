import React, { useState, useEffect } from 'react';
import customerService from '@/services/customerService';
import toastService from '@/services/toastService';
import { ClipboardDocumentIcon, XMarkIcon, BuildingStorefrontIcon, MapPinIcon, DevicePhoneMobileIcon, AtSymbolIcon, IdentificationIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const ViewCustomerModal = ({ show, onClose, customer }) => {
  const [fullCustomer, setFullCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show && customer?.id) {
      const fetchCustomerDetails = async () => {
        setLoading(true);
        try {
          const data = await customerService.getCustomerById(customer.id);
          setFullCustomer(data);
        } catch (error) {
          console.error('Error fetching customer details:', error);
          toastService.error('Failed to load customer details.');
          onClose();
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

  const InfoCard = ({ icon: Icon, title, children }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <Icon className="h-5 w-5 text-gray-500 mr-2" />
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );

  const InfoItem = ({ label, value, copyable = false }) => (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 flex items-center">
        <span>{value || '-'}</span>
        {copyable && value && (
          <button
            onClick={() => copyToClipboard(value)}
            className="ml-2 text-gray-400 hover:text-gray-600"
            title="Copy to clipboard"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
          </button>
        )}
      </dd>
    </div>
  );

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
          ) : fullCustomer ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <InfoCard icon={BuildingStorefrontIcon} title="Customer Information">
                  <InfoItem label="Customer Name" value={fullCustomer.namaCustomer} />
                  <InfoItem label="Customer Code" value={fullCustomer.kodeCustomer} copyable />
                  <InfoItem label="Group Customer" value={fullCustomer.groupCustomer?.nama_group} />
                  <InfoItem label="Region" value={fullCustomer.region?.nama_region} />
                </InfoCard>

                <InfoCard icon={MapPinIcon} title="Address Information">
                  <InfoItem label="Shipping Address" value={fullCustomer.alamatPengiriman} />
                  <InfoItem label="NPWP Address" value={fullCustomer.alamatNPWP} />
                </InfoCard>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <InfoCard icon={DevicePhoneMobileIcon} title="Contact Information">
                  <InfoItem label="Phone Number" value={fullCustomer.phoneNumber} copyable />
                  <InfoItem label="Email" value={fullCustomer.email} copyable />
                </InfoCard>

                <InfoCard icon={IdentificationIcon} title="Tax Information">
                  <InfoItem label="NPWP" value={fullCustomer.NPWP} copyable />
                  <InfoItem label="Description" value={fullCustomer.description} />
                </InfoCard>

                <InfoCard icon={CalendarDaysIcon} title="System Information">
                  <InfoItem label="Created" value={formatDate(fullCustomer.createdAt)} />
                  <InfoItem label="Last Updated" value={formatDate(fullCustomer.updatedAt)} />
                </InfoCard>
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

