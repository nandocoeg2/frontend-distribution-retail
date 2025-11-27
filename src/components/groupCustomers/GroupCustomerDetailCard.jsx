import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  MapPinIcon, 
  ClockIcon, 
  TagIcon, 
  UsersIcon, 
  ChartBarIcon,
  XMarkIcon,
  PencilIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable, StatusBadge, TabContainer, Tab, TabContent, TabPanel } from '../ui';
import ActivityTimeline from '../common/ActivityTimeline';
import { groupCustomerService } from '@/services/groupCustomerService';
import toastService from '@/services/toastService';

const GroupCustomerDetailCard = ({ groupCustomer, onClose, onUpdate, loading = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (groupCustomer) {
      initializeFormData(groupCustomer);
    }
  }, [groupCustomer]);

  const initializeFormData = (data) => {
    setFormData({
      kode_group: data?.kode_group || '',
      nama_group: data?.nama_group || '',
      alamat: data?.alamat || '',
      npwp: data?.npwp || '',
    });
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    initializeFormData(groupCustomer);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await groupCustomerService.updateGroupCustomer(groupCustomer.id, formData);
      toastService.success('Group customer updated successfully!');
      
      setIsEditMode(false);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating group customer:', error);
      toastService.error('Failed to update group customer.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!groupCustomer) return null;

  const isDeleted = Boolean(groupCustomer?.is_deleted);
  const statusVariant = isDeleted ? 'danger' : 'success';
  const statusLabel = isDeleted ? 'Deleted' : 'Active';

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Group Customer Details
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <TagIcon className="h-4 w-4 text-gray-400" />
            {groupCustomer?.kode_group || 'No group code available'}
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">Loading group customer details...</span>
        </div>
      ) : (
        <div>
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
              {isEditMode ? (
                /* EDIT MODE */
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                      <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Edit Group Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kode Group Customer *</label>
                        <input
                          type="text"
                          name="kode_group"
                          value={formData?.kode_group || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Group Customer *</label>
                        <input
                          type="text"
                          name="nama_group"
                          value={formData?.nama_group || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                        <textarea
                          name="alamat"
                          value={formData?.alamat || ''}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
                        <input
                          type="text"
                          name="npwp"
                          value={formData?.npwp || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Masukkan NPWP (15 digit)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* VIEW MODE */
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
              )}
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
      )}
    </div>
  );
};

export default GroupCustomerDetailCard;
