import React, { useState } from 'react';
import { XMarkIcon, UserGroupIcon, MapPinIcon, ClockIcon, TagIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable, StatusBadge, TabContainer, Tab, TabContent, TabPanel } from '../ui';
import ActivityTimeline from '../common/ActivityTimeline';

const ViewGroupCustomerModal = ({ show, onClose, groupCustomer, loading = false }) => {
  if (!show) {
    return null;
  }

  const isDeleted = Boolean(groupCustomer?.is_deleted);
  const statusVariant = isDeleted ? 'danger' : 'success';
  const statusLabel = isDeleted ? 'Deleted' : 'Active';

  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Group Customer Details</h2>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Group Customer Details</h2>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <TagIcon className="h-4 w-4 text-gray-400" />
              {groupCustomer?.kode_group || 'No group code available'}
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
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {groupCustomer ? (
            <div className="p-6">
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
                  icon={<ChartBarIcon className="w-4 h-4" />}
                />
                <Tab
                  id="customers"
                  label="Customers"
                  icon={<UsersIcon className="w-4 h-4" />}
                  badge={groupCustomer?.customers?.length || 0}
                />
                <Tab
                  id="activity"
                  label="Activity"
                  icon={<ClockIcon className="w-4 h-4" />}
                  badge={groupCustomer?.auditTrails?.length || 0}
                />
              </TabContainer>

              {/* Tab Content */}
              <TabContent activeTab={activeTab}>
                <TabPanel tabId="overview">
                  <div className="space-y-6">
                    {/* Group Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Group Information</h3>
                      </div>
                      <InfoTable
                        data={[
                          { label: 'Group Name', value: groupCustomer?.nama_group },
                          { label: 'Group Code', value: groupCustomer?.kode_group, copyable: true },
                          { label: 'Kode Group Surat', value: groupCustomer?.kode_group_surat || '-' },
                          {
                            label: 'Status',
                            component: (
                              <StatusBadge
                                status={statusLabel}
                                variant={statusVariant}
                                dot
                              />
                            ),
                          },
                        ]}
                      />
                    </div>

                    {/* Address & Tax */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Address & Tax</h3>
                      </div>
                      <InfoTable
                        data={[
                          { label: 'Address', value: groupCustomer?.alamat },
                          { label: 'NPWP', value: groupCustomer?.npwp, copyable: true },
                        ]}
                      />
                    </div>

                    {/* Audit Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Audit Information</h3>
                      </div>
                      <InfoTable
                        data={[
                          { label: 'Created By', value: groupCustomer?.createdBy || 'N/A' },
                          {
                            label: 'Created At',
                            value: groupCustomer?.createdAt ? formatDateTime(groupCustomer.createdAt) : 'N/A',
                          },
                          { label: 'Updated By', value: groupCustomer?.updatedBy || 'N/A' },
                          {
                            label: 'Updated At',
                            value: groupCustomer?.updatedAt ? formatDateTime(groupCustomer.updatedAt) : 'N/A',
                          },
                        ]}
                      />
                    </div>
                  </div>
                </TabPanel>

                <TabPanel tabId="customers">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                      <UsersIcon className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Connected Customers</h3>
                    </div>

                    {groupCustomer?.customers && groupCustomer.customers.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer Code
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                NPWP
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Phone
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Address
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {groupCustomer.customers.map((customer) => (
                              <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {customer.kodeCustomer}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {customer.namaCustomer}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {customer.NPWP || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {customer.email || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {customer.phoneNumber || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={customer.alamatPengiriman}>
                                  {customer.alamatPengiriman || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No customers connected to this group.
                      </div>
                    )}
                  </div>
                </TabPanel>

                <TabPanel tabId="activity">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                      <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                    </div>

                    {groupCustomer?.auditTrails && groupCustomer.auditTrails.length > 0 ? (
                      <ActivityTimeline
                        auditTrails={groupCustomer.auditTrails.map(trail => ({
                          ...trail,
                          details: trail.changes || {},
                          timestamp: trail.timestamp,
                          user: trail.user
                        }))}
                        title=""
                        showCount={false}
                        emptyMessage="No activity found."
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No activity found.
                      </div>
                    )}
                  </div>
                </TabPanel>
              </TabContent>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Group customer data is not available.
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

export default ViewGroupCustomerModal;
