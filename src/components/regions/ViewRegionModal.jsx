import React from 'react';
import { XMarkIcon, GlobeAltIcon, MapIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable, StatusBadge } from '../ui';

const ViewRegionModal = ({ show, onClose, region }) => {
  if (!show) {
    return null;
  }

  const isDeleted = Boolean(region?.is_deleted);
  const statusVariant = isDeleted ? 'danger' : 'success';
  const statusLabel = isDeleted ? 'Deleted' : 'Active';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Region Details</h2>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <GlobeAltIcon className="h-4 w-4 text-gray-400" />
              {region?.nama_region || 'No region name available'}
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
          {region ? (
            <div className="space-y-6">
              {/* Region Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <MapIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Region Information</h3>
                </div>
                <InfoTable
                  data={[
                    { label: 'Region Name', value: region?.nama_region },
                    { label: 'Region Code', value: region?.kode_region, copyable: true },
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

              {/* System Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
                </div>
                <InfoTable
                  data={[
                    { label: 'Created By', value: region?.createdBy },
                    { label: 'Created At', value: formatDateTime(region?.createdAt) },
                    { label: 'Updated By', value: region?.updatedBy },
                    { label: 'Updated At', value: formatDateTime(region?.updatedAt) },
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Region data is not available.
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

export default ViewRegionModal;

