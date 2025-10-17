import React from 'react';
import { XMarkIcon, CreditCardIcon, ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable } from '../ui';

const ViewTermOfPaymentModal = ({ show, onClose, termOfPayment }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Term of Payment Details</h2>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <CreditCardIcon className="h-4 w-4 text-gray-400" />
              {termOfPayment?.kode_top || 'No TOP code available'}
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
          {termOfPayment ? (
            <div className="space-y-6">
              {/* Payment Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                </div>
                <InfoTable
                  data={[
                    { label: 'Term Code', value: termOfPayment?.kode_top, copyable: true },
                    { label: 'Days Limit', value: termOfPayment?.batas_hari ? `${termOfPayment.batas_hari} days` : 'N/A' },
                    { label: 'Description', value: termOfPayment?.description },
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
                    { label: 'Created By', value: termOfPayment?.createdBy },
                    { label: 'Created At', value: formatDateTime(termOfPayment?.createdAt) },
                    { label: 'Updated By', value: termOfPayment?.updatedBy },
                    { label: 'Updated At', value: formatDateTime(termOfPayment?.updatedAt) },
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Term of payment data is not available.
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

export default ViewTermOfPaymentModal;
