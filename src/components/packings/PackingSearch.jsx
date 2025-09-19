import React from 'react';
import useStatuses from '../../hooks/useStatuses';

const PackingSearch = ({ 
  searchQuery, 
  searchField, 
  handleSearchChange, 
  handleSearchFieldChange, 
  searchLoading,
  searchFilters,
  handleFilterChange,
  clearFilters
}) => {
  const { packingStatuses, fetchPackingStatuses } = useStatuses();

  // Load packing statuses on mount
  React.useEffect(() => {
    fetchPackingStatuses();
  }, [fetchPackingStatuses]);

  const renderSearchInput = () => {
    switch (searchField) {
      case 'tanggal_packing':
        return (
          <input
            type="date"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'statusId':
        return (
          <select
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            {Array.isArray(packingStatuses) && packingStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.status_name}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            placeholder={`Search by ${searchField ? searchField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : 'field'}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="mb-4 space-y-4">
      {/* Basic Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <select
            value={searchField}
            onChange={(e) => handleSearchFieldChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="packing_number">Packing Number</option>
            <option value="tanggal_packing">Tanggal Packing</option>
            <option value="statusId">Status</option>
            <option value="purchaseOrderId">Purchase Order ID</option>
          </select>
        </div>
        <div className="relative md:col-span-2">
          {renderSearchInput()}
          {searchField !== 'statusId' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg 
                className="h-5 w-5 text-gray-400" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          )}
        </div>
      </div>

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

