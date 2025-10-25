import React, { useState, useEffect } from 'react';
import customerService from '@/services/customerService';
import groupCustomerService from '@/services/groupCustomerService';
import toastService from '@/services/toastService';
import { ClipboardDocumentIcon, XMarkIcon, BuildingStorefrontIcon, MapPinIcon, DevicePhoneMobileIcon, AtSymbolIcon, IdentificationIcon, CalendarDaysIcon, UserGroupIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable, TabContainer, Tab, TabContent, TabPanel } from '../ui';

const ViewCustomerModal = ({ show, onClose, customer }) => {
  const [fullCustomer, setFullCustomer] = useState(null);
  const [groupCustomer, setGroupCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupLoading, setGroupLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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

          // Fetch group customer data if available
          if (customerData?.groupCustomer?.id) {
            setGroupLoading(true);
            try {
              const groupResponse = await groupCustomerService.getGroupCustomerById(customerData.groupCustomer.id);
              let groupData;
              if (groupResponse?.success && groupResponse?.data) {
                groupData = groupResponse.data;
              } else if (groupResponse?.data) {
                groupData = groupResponse.data;
              } else {
                groupData = groupResponse;
              }
              setGroupCustomer(groupData);
            } catch (groupError) {
              console.error('Error fetching group customer details:', groupError);
              // Don't show error for group customer, just continue without it
            } finally {
              setGroupLoading(false);
            }
          }
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
      setGroupCustomer(null);
      setLoading(false);
      setGroupLoading(false);
    }
  }, [show, customer?.id, onClose]);

  if (!show) {
    return null;
  }

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
              {/* Tab Navigation */}
              <TabContainer
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="underline"
                className="mb-6"
              >
                <Tab
                  id="overview"
                  label="Overview"
                  icon={<EyeIcon className="h-4 w-4" />}
                />
                <Tab
                  id="group-customer"
                  label="Group Customer"
                  icon={<UserGroupIcon className="h-4 w-4" />}
                  disabled={!groupCustomer}
                />
              </TabContainer>

              {/* Tab Content */}
              <TabContent activeTab={activeTab}>
                {/* Overview Tab */}
                <TabPanel tabId="overview">
                  <div className="space-y-6">
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
                          { label: 'Created', value: formatDateTime(fullCustomer?.createdAt || customer?.createdAt) },
                          { label: 'Last Updated', value: formatDateTime(fullCustomer?.updatedAt || customer?.updatedAt) }
                        ]}
                      />
                    </div>
                  </div>
                </TabPanel>

                {/* Group Customer Tab */}
                <TabPanel tabId="group-customer">
                  <div className="space-y-6">
                    {groupLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : groupCustomer ? (
                      <>
                        {/* Group Information */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex items-center mb-4">
                            <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Group Information</h3>
                          </div>
                          <InfoTable
                            data={[
                              { label: 'Group Name', value: groupCustomer?.nama_group },
                              { label: 'Group Code', value: groupCustomer?.kode_group, copyable: true }
                            ]}
                          />
                        </div>

                        {/* Address & Tax */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex items-center mb-4">
                            <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Address & Tax</h3>
                          </div>
                          <InfoTable
                            data={[
                              { label: 'Address', value: groupCustomer?.alamat },
                              { label: 'NPWP', value: groupCustomer?.npwp, copyable: true }
                            ]}
                          />
                        </div>

                        {/* Audit Information */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex items-center mb-4">
                            <CalendarDaysIcon className="h-5 w-5 text-gray-500 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Audit Information</h3>
                          </div>
                          <InfoTable
                            data={[
                              { label: 'Created By', value: groupCustomer?.createdBy },
                              {
                                label: 'Created At',
                                value: formatDateTime(groupCustomer?.createdAt),
                              },
                              { label: 'Updated By', value: groupCustomer?.updatedBy },
                              {
                                label: 'Updated At',
                                value: formatDateTime(groupCustomer?.updatedAt),
                              }
                            ]}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No group customer data available</p>
                        <p className="text-sm text-gray-400 mt-2">This customer is not assigned to any group</p>
                      </div>
                    )}
                  </div>
                </TabPanel>
              </TabContent>
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

