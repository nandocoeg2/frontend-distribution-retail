import React, { useState, useEffect } from 'react';

const PurchaseOrderSearch = ({ searchQuery, searchField, onSearch, searchLoading }) => {
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout for 500ms delay
    const timeout = setTimeout(() => {
      onSearch(query, searchField);
    }, 500);

    setDebounceTimeout(timeout);
  };

  // Handle search field change
  const handleSearchFieldChange = (e) => {
    const field = e.target.value;
    if (searchQuery.trim()) {
      onSearch(searchQuery, field);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <select
          value={searchField}
          onChange={handleSearchFieldChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="customer_name">Customer Name</option>
          <option value="tanggal_order">Order Date (YYYY-MM-DD)</option>
          <option value="po_number">PO Number</option>
          <option value="customerId">Customer ID</option>
          <option value="supplierId">Supplier ID</option>
          <option value="statusId">Status ID</option>
          <option value="suratPO">Surat PO</option>
          <option value="invoicePengiriman">Invoice Pengiriman</option>
        </select>
      </div>
      <div className="relative md:col-span-2">
        <input
          type="text"
          placeholder={`Search by ${searchField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}...`}
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

export default PurchaseOrderSearch;
