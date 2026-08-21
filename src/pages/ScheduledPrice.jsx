import React, { useState, useRef } from 'react';
import ScheduledPriceTableServerSide from '../components/scheduledPrice/ScheduledPriceTableServerSide';
import AddScheduledPriceModal from '../components/scheduledPrice/AddScheduledPriceModal';
import EditScheduledPriceModal from '../components/scheduledPrice/EditScheduledPriceModal';
import useScheduledPriceOperations from '../hooks/useScheduledPriceOperations';
import authService from '../services/authService';
import { PlusIcon } from '@heroicons/react/24/outline';

const ScheduledPrice = () => {
  const tableRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const { deleteSchedule, getSchedule, loading: operationLoading } = useScheduledPriceOperations();

  // Get companyId from auth service to filter schedules
  const companyData = authService.getCompanyData();
  const companyId = companyData?.id || null;

  const handleEdit = async (schedule) => {
    try {
      // Fetch full details for editing
      const fullSchedule = await getSchedule(schedule.id);
      setSelectedSchedule(fullSchedule);
      setShowEditModal(true);
    } catch (err) {
      console.error('Failed to fetch schedule details:', err);
      // Fallback to existing data if fetch fails
      setSelectedSchedule(schedule);
      setShowEditModal(true);
    }
  };

  const handleDelete = async (scheduleId) => {
    const success = await deleteSchedule(scheduleId);
    if (success) {
      tableRef.current?.refresh();
    }
  };

  const handleModalSuccess = () => {
    tableRef.current?.refresh();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="max-w-full mx-auto w-full h-full flex flex-col">
        <div className="bg-white shadow rounded-lg overflow-hidden p-3 flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="mb-2">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-sm font-semibold text-gray-900">Scheduled Price</h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4 mr-1.5" />
                  Add Schedule
                </button>
              </div>
            </div>
          </div>

          {/* Server-side Table */}
          <div className="mt-3 flex-1 flex flex-col min-h-0">
            <ScheduledPriceTableServerSide
              ref={tableRef}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deleteLoading={operationLoading}
              companyId={companyId}
            />
          </div>

          {/* Modals */}
          {showAddModal && (
            <AddScheduledPriceModal
              onClose={() => setShowAddModal(false)}
              onSuccess={handleModalSuccess}
            />
          )}

          {showEditModal && selectedSchedule && (
            <EditScheduledPriceModal
              schedule={selectedSchedule}
              onClose={() => {
                setShowEditModal(false);
                setSelectedSchedule(null);
              }}
              onSuccess={handleModalSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduledPrice;
