import React, { useState } from 'react';
import { useScheduledPrices } from '../hooks/useScheduledPrices';
import ScheduledPriceTable from '../components/scheduledPrice/ScheduledPriceTable';
import ScheduledPriceFilters from '../components/scheduledPrice/ScheduledPriceFilters';
import AddScheduledPriceModal from '../components/scheduledPrice/AddScheduledPriceModal';
import EditScheduledPriceModal from '../components/scheduledPrice/EditScheduledPriceModal';
import ViewScheduledPriceModal from '../components/scheduledPrice/ViewScheduledPriceModal';
import CancelScheduleModal from '../components/scheduledPrice/CancelScheduleModal';
import useScheduledPriceOperations from '../hooks/useScheduledPriceOperations';
import authService from '../services/authService';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ScheduledPrice = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    itemPriceId: '',
    effectiveDateFrom: '',
    effectiveDateTo: ''
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const { deleteSchedule, getSchedule, loading: operationLoading } = useScheduledPriceOperations();

  // Get companyId from auth service to filter schedules
  const companyData = authService.getCompanyData();
  const companyId = companyData?.id || null;

  const queryParams = {
    page,
    limit,
    companyId, // Filter by company
    ...filters
  };

  const { data, isLoading, error, refetch } = useScheduledPrices(queryParams);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

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

  const handleView = async (schedule) => {
    try {
      // Fetch full details including customer, itemPrice, item relations
      const fullSchedule = await getSchedule(schedule.id);
      setSelectedSchedule(fullSchedule);
      setShowViewModal(true);
    } catch (err) {
      console.error('Failed to fetch schedule details:', err);
      // Fallback to existing data if fetch fails
      setSelectedSchedule(schedule);
      setShowViewModal(true);
    }
  };

  const handleCancel = (schedule) => {
    setSelectedSchedule(schedule);
    setShowCancelModal(true);
  };

  const handleDelete = async (schedule) => {
    if (window.confirm(`Are you sure you want to delete this schedule?`)) {
      const success = await deleteSchedule(schedule.id);
      if (success) {
        refetch();
      }
    }
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const schedules = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };

  return (
    <div>
      <div className="max-w-full mx-auto">
        <div className="bg-white shadow-md rounded-lg p-3">
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

          {/* Filters */}
          <ScheduledPriceFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Table */}
          <div className="mt-3">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error.message || 'Failed to load schedules'}</p>
              </div>
            )}

            <ScheduledPriceTable
              schedules={schedules}
              loading={isLoading}
              onEdit={handleEdit}
              onView={handleView}
              onCancel={handleCancel}
              onDelete={handleDelete}
            />

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="mt-3 flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {((meta.page - 1) * meta.limit) + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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

          {showViewModal && selectedSchedule && (
            <ViewScheduledPriceModal
              schedule={selectedSchedule}
              onClose={() => {
                setShowViewModal(false);
                setSelectedSchedule(null);
              }}
            />
          )}

          {showCancelModal && selectedSchedule && (
            <CancelScheduleModal
              schedule={selectedSchedule}
              onClose={() => {
                setShowCancelModal(false);
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
