import React, { useState, useEffect } from 'react';
import {
    UserGroupIcon,
    ClockIcon,
    TagIcon,
    UsersIcon,
    ChartBarIcon,
    XMarkIcon,
    PencilIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable, StatusBadge, TabContainer, Tab, TabContent, TabPanel } from '../ui';
import ActivityTimeline from '../common/ActivityTimeline';
import { parentGroupCustomerService } from '@/services/parentGroupCustomerService';
import toastService from '@/services/toastService';

const ParentGroupCustomerDetailCard = ({ parentGroupCustomer, onClose, onUpdate, loading = false }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditMode, setIsEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (parentGroupCustomer) {
            initializeFormData(parentGroupCustomer);
        }
    }, [parentGroupCustomer]);

    const initializeFormData = (data) => {
        setFormData({
            kode_parent: data?.kode_parent || '',
            nama_parent: data?.nama_parent || '',
        });
    };

    const handleEditClick = () => {
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        initializeFormData(parentGroupCustomer);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await parentGroupCustomerService.updateParentGroupCustomer(parentGroupCustomer.id, formData);
            toastService.success('Parent group customer updated successfully!');

            setIsEditMode(false);

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error updating parent group customer:', error);
            toastService.error('Failed to update parent group customer.');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!parentGroupCustomer) return null;

    const isDeleted = Boolean(parentGroupCustomer?.is_deleted);
    const statusVariant = isDeleted ? 'danger' : 'success';
    const statusLabel = isDeleted ? 'Deleted' : 'Active';

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Parent Group Customer Details
                        {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
                    </h2>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <TagIcon className="h-4 w-4 text-gray-400" />
                        {parentGroupCustomer?.kode_parent || 'No parent code available'}
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
                    <span className="ml-3 text-sm text-gray-600">Loading parent group customer details...</span>
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
                            id="groups"
                            label="Group Customers"
                            icon={<UsersIcon className="w-4 h-4" />}
                            badge={parentGroupCustomer?.groupCustomers?.length || 0}
                        />
                        <Tab
                            id="activity"
                            label="Activity"
                            icon={<ClockIcon className="w-4 h-4" />}
                            badge={parentGroupCustomer?.auditTrails?.length || 0}
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
                                            <h3 className="text-lg font-semibold text-gray-900">Edit Parent Group Information</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Parent Group *</label>
                                                <input
                                                    type="text"
                                                    name="kode_parent"
                                                    value={formData?.kode_parent || ''}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Parent Group *</label>
                                                <input
                                                    type="text"
                                                    name="nama_parent"
                                                    value={formData?.nama_parent || ''}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* VIEW MODE */
                                <div className="space-y-6">
                                    {/* Parent Group Information */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                        <div className="flex items-center mb-4">
                                            <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2" />
                                            <h3 className="text-lg font-semibold text-gray-900">Parent Group Information</h3>
                                        </div>
                                        <InfoTable
                                            data={[
                                                { label: 'Kode Parent', value: parentGroupCustomer?.kode_parent, copyable: true },
                                                { label: 'Nama Parent', value: parentGroupCustomer?.nama_parent },
                                                { label: 'Jumlah Group Customer', value: `${parentGroupCustomer?.groupCustomers?.length || 0} group(s)` },
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

                                    {/* Audit Information */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                        <div className="flex items-center mb-4">
                                            <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                                            <h3 className="text-lg font-semibold text-gray-900">Audit Information</h3>
                                        </div>
                                        <InfoTable
                                            data={[
                                                { label: 'Created By', value: parentGroupCustomer?.createdBy || 'N/A' },
                                                {
                                                    label: 'Created At',
                                                    value: parentGroupCustomer?.createdAt ? formatDateTime(parentGroupCustomer.createdAt) : 'N/A',
                                                },
                                                { label: 'Updated By', value: parentGroupCustomer?.updatedBy || 'N/A' },
                                                {
                                                    label: 'Updated At',
                                                    value: parentGroupCustomer?.updatedAt ? formatDateTime(parentGroupCustomer.updatedAt) : 'N/A',
                                                },
                                            ]}
                                        />
                                    </div>
                                </div>
                            )}
                        </TabPanel>

                        <TabPanel tabId="groups">
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center mb-4">
                                    <UsersIcon className="h-5 w-5 text-gray-500 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-900">Connected Group Customers</h3>
                                </div>

                                {parentGroupCustomer?.groupCustomers && parentGroupCustomer.groupCustomers.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Kode Group
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Nama Group
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Alamat
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        NPWP
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Created At
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {parentGroupCustomer.groupCustomers.map((group) => (
                                                    <tr key={group.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {group.kode_group}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {group.nama_group}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={group.alamat}>
                                                            {group.alamat || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {group.npwp || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {group.createdAt ? formatDateTime(group.createdAt) : 'N/A'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No group customers connected to this parent group.
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

                                {parentGroupCustomer?.auditTrails && parentGroupCustomer.auditTrails.length > 0 ? (
                                    <ActivityTimeline
                                        auditTrails={parentGroupCustomer.auditTrails.map(trail => ({
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

export default ParentGroupCustomerDetailCard;
