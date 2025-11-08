import React from 'react';
import { formatDate, formatCurrency } from '../../utils/formatUtils';
import { 
  PencilIcon, 
  EyeIcon, 
  XCircleIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';

const ScheduledPriceTable = ({ 
  schedules = [], 
  loading = false,
  onEdit,
  onView,
  onCancel,
  onDelete
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800', icon: '✅' },
      EXPIRED: { label: 'Expired', className: 'bg-gray-100 text-gray-800', icon: '⏰' },
      CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800', icon: '❌' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center">
          <p className="text-gray-600">No schedules found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PLU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduled Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Effective Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {schedule.itemPrice?.item?.nama_barang || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {schedule.itemPrice?.item?.plu || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(schedule.itemPrice?.harga)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(schedule.harga)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDateShort(schedule.effectiveDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(schedule.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(schedule)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    
                    {schedule.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => onEdit(schedule)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Schedule"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(schedule)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Schedule"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    
                    {(schedule.status === 'PENDING' || schedule.status === 'ACTIVE') && (
                      <button
                        onClick={() => onCancel(schedule)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Cancel Schedule"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduledPriceTable;
