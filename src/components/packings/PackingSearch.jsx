import React from 'react';
import useStatuses from '../../hooks/useStatuses';

const PackingSearch = ({ searchLoading, searchFilters, handleFilterChange, clearFilters }) => {
  const { packingStatuses, fetchPackingStatuses } = useStatuses();

  // Load packing statuses on mount
  React.useEffect(() => {
    fetchPackingStatuses();
  }, [fetchPackingStatuses]);

  return (
    <div className="mb-4 space-y-4">
      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={searchFilters.statusId || ''}
            onChange={(e) => handleFilterChange({ ...searchFilters, statusId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            {Array.isArray(packingStatuses) && packingStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.status_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Packing</label>
          <input
            type="date"
            value={searchFilters.tanggal_packing || ''}
            onChange={(e) => handleFilterChange({ ...searchFilters, tanggal_packing: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Packing Number</label>
          <input
            type="text"
            placeholder="Search packing number..."
            value={searchFilters.packing_number || ''}
            onChange={(e) => handleFilterChange({ ...searchFilters, packing_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {searchLoading && (
        <div className="flex items-center justify-center text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Searching...
        </div>
      )}
    </div>
  );
};

export default PackingSearch;

