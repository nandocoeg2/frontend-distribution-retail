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
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    return formatDate(dateString);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 text-xs table-fixed">
          <colgroup>
            <col style={{ width: '180px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '80px' }} />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PLU
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                New Price
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Effective
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-2 py-1 text-center">
                  <div className="w-6 h-6 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                </td>
              </tr>
            ) : !schedules || schedules.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-2 py-1 text-center text-gray-500 text-xs">
                  No schedules found
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50 h-8 cursor-pointer transition-colors">
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate" title={schedule.itemPrice?.item?.nama_barang || '-'}>
                    {schedule.itemPrice?.item?.nama_barang || '-'}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900">
                    {schedule.itemPrice?.item?.plu || '-'}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                    {formatCurrency(schedule.itemPrice?.harga)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900">
                    {formatCurrency(schedule.harga)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-600">
                    {formatDateShort(schedule.effectiveDate)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {getStatusBadge(schedule.status)}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onView(schedule)}
                        className="p-0.5 text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {schedule.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => onEdit(schedule)}
                            className="p-0.5 text-green-600 hover:text-green-900"
                            title="Edit Schedule"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(schedule)}
                            className="p-0.5 text-red-600 hover:text-red-900"
                            title="Delete Schedule"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {(schedule.status === 'PENDING' || schedule.status === 'ACTIVE') && (
                        <button
                          onClick={() => onCancel(schedule)}
                          className="p-0.5 text-orange-600 hover:text-orange-900"
                          title="Cancel Schedule"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduledPriceTable;
