import React from 'react';

const SuratJalanSearch = ({ searchQuery, searchField, handleSearchChange, handleSearchFieldChange, searchLoading }) => {
  const getPlaceholder = () => {
    return `Search by ${searchField ? searchField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : 'field'}...`;
  };

  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <select
          value={searchField}
          onChange={(e) => handleSearchFieldChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="no_surat_jalan">No Surat Jalan</option>
          <option value="deliver_to">Deliver To</option>
        </select>
      </div>
      <div className="relative md:col-span-2">
        <input
          type="text"
          placeholder={getPlaceholder()}
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
        {searchLoading && (
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Searching...
          </div>
        )}
      </div>
    </div>
  );
};

export default SuratJalanSearch;
