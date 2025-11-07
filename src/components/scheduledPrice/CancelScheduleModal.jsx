import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useScheduledPriceOperations from '../../hooks/useScheduledPriceOperations';

const CancelScheduleModal = ({ schedule, onClose, onSuccess }) => {
  const { cancelSchedule, loading } = useScheduledPriceOperations();
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await cancelSchedule(schedule.id, reason);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Cancel schedule error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cancel Schedule</h2>
            <p className="text-sm text-gray-600 mt-1">
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700">
              Are you sure you want to cancel this price schedule?
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-900">
                {schedule.itemPrice?.inventory?.nama_barang || 'Unknown Item'}
              </p>
              <p className="text-sm text-gray-600">
                PLU: {schedule.itemPrice?.inventory?.plu || '-'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Scheduled Price: Rp {schedule.harga?.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Impact:</strong> Future purchase orders will use the current price instead of this scheduled price.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                No, Keep It
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300"
              >
                {loading ? 'Cancelling...' : 'Yes, Cancel Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CancelScheduleModal;
