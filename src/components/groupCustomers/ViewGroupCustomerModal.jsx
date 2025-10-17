import React from 'react';
import { XMarkIcon, UserGroupIcon, MapPinIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable, StatusBadge } from '../ui';

const ViewGroupCustomerModal = ({ show, onClose, groupCustomer }) => {
  if (!show) {
    return null;
  }

  const isDeleted = Boolean(groupCustomer?.is_deleted);
  const statusVariant = isDeleted ? 'danger' : 'success';
  const statusLabel = isDeleted ? 'Deleted' : 'Active';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {groupCustomer ? (
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
                    { label: 'Created By', value: groupCustomer?.createdBy },
                    {
                      label: 'Created At',
                      value: formatDateTime(groupCustomer?.createdAt),
                    },
                    { label: 'Updated By', value: groupCustomer?.updatedBy },
                    {
                      label: 'Updated At',
                      value: formatDateTime(groupCustomer?.updatedAt),
                    },
                  ]}
                />
              </div>
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
