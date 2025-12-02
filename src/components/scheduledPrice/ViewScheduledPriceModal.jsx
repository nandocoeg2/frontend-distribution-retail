import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDateTime, formatCurrency } from '../../utils/formatUtils';

const ViewScheduledPriceModal = ({ schedule, onClose }) => {
  const formatDateWithTime = (dateString) => {
    if (!dateString) return '-';
    return formatDateTime(dateString);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800', icon: '✅' },
      EXPIRED: { label: 'Expired', className: 'bg-gray-100 text-gray-800', icon: '⏰' },
      CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800', icon: '❌' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              View price schedule information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Status
              </label>
              {getStatusBadge(schedule.status)}
            </div>

            {/* Item Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Item Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Item Name
                  </label>
                  <p className="text-gray-900">
                    {schedule.itemPrice?.item?.nama_barang || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    PLU
                  </label>
                  <p className="text-gray-900">
                    {schedule.itemPrice?.item?.plu || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Berlaku Untuk</h3>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Customer
                </label>
                {schedule.customer ? (
                  <div>
                    <p className="text-gray-900 font-medium">
                      {schedule.customer.namaCustomer}
                    </p>
                    <p className="text-sm text-gray-500">
                      Kode: {schedule.customer.kodeCustomer}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    Semua Customer (Harga Base)
                  </p>
                )}
              </div>
            </div>

            {/* Price Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Price Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Current Price
                  </label>
                  <p className="text-gray-900">
                    {formatCurrency(schedule.itemPrice?.harga)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Scheduled Price
                  </label>
                  <p className="text-gray-900 font-semibold text-lg">
                    {formatCurrency(schedule.harga)}
                  </p>
                </div>
              </div>
            </div>

            {/* Discounts */}
            {(schedule.pot1 || schedule.pot2) && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Discounts</h3>
                <div className="space-y-3">
                  {schedule.pot1 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Potongan A
                        </label>
                        <p className="text-gray-900">{schedule.pot1}%</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Harga After Pot A
                        </label>
                        <p className="text-gray-900">
                          {formatCurrency(schedule.harga1)}
                        </p>
                      </div>
                    </div>
                  )}
                  {schedule.pot2 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Potongan B
                        </label>
                        <p className="text-gray-900">{schedule.pot2}%</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Harga After Pot B
                        </label>
                        <p className="text-gray-900">
                          {formatCurrency(schedule.harga2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PPN */}
            {schedule.ppn && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      PPN
                    </label>
                    <p className="text-gray-900">{schedule.ppn}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Dates */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Schedule Timeline</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Effective Date
                  </label>
                  <p className="text-gray-900">
                    {formatDateWithTime(schedule.effectiveDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Created At
                  </label>
                  <p className="text-gray-900">
                    {formatDateWithTime(schedule.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {schedule.notes && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Notes
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {schedule.notes}
                </p>
              </div>
            )}

            {/* Audit Trail */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Audit Trail</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Created By
                  </label>
                  <p className="text-gray-700">{schedule.createdBy || '-'}</p>
                  <p className="text-xs text-gray-500">{formatDateWithTime(schedule.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Updated By
                  </label>
                  <p className="text-gray-700">{schedule.updatedBy || '-'}</p>
                  <p className="text-xs text-gray-500">{formatDateWithTime(schedule.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewScheduledPriceModal;
