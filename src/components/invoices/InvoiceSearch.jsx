import React, { useState } from 'react';

const InvoiceSearch = ({ searchQuery, handleSearchChange, searchLoading }) => {
  const [localSearch, setLocalSearch] = useState(searchQuery || {
    no_invoice: '',
    deliver_to: '',
    type: '',
    statusPembayaranId: '',
    purchaseOrderId: '',
    tanggal_start: '',
    tanggal_end: ''
  });

  const handleInputChange = (field, value) => {
    const updatedSearch = { ...localSearch, [field]: value };
    setLocalSearch(updatedSearch);
    handleSearchChange(updatedSearch);
  };

  const clearSearch = () => {
    const emptySearch = {
      no_invoice: '',
      deliver_to: '',
      type: '',
      statusPembayaranId: '',
      purchaseOrderId: '',
      tanggal_start: '',
      tanggal_end: ''
    };
    setLocalSearch(emptySearch);
    handleSearchChange(emptySearch);
  };

  return (
    <div className='mb-4 p-4 bg-gray-50 rounded-lg'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div>
          <label htmlFor='no_invoice' className='block text-sm font-medium text-gray-700'>
            Invoice No
          </label>
          <input
            type='text'
            id='no_invoice'
            value={localSearch.no_invoice}
            onChange={(e) => handleInputChange('no_invoice', e.target.value)}
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
            placeholder='Search by invoice number...'
          />
        </div>

        <div>
          <label htmlFor='deliver_to' className='block text-sm font-medium text-gray-700'>
            Deliver To
          </label>
          <input
            type='text'
            id='deliver_to'
            value={localSearch.deliver_to}
            onChange={(e) => handleInputChange('deliver_to', e.target.value)}
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
            placeholder='Search by recipient...'
          />
        </div>

        <div>
          <label htmlFor='type' className='block text-sm font-medium text-gray-700'>
            Type
          </label>
          <select
            id='type'
            value={localSearch.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
          >
            <option value=''>All Types</option>
            <option value='PEMBAYARAN'>PEMBAYARAN</option>
          </select>
        </div>

        <div>
          <label htmlFor='statusPembayaranId' className='block text-sm font-medium text-gray-700'>
            Payment Status
          </label>
          <input
            type='text'
            id='statusPembayaranId'
            value={localSearch.statusPembayaranId}
            onChange={(e) => handleInputChange('statusPembayaranId', e.target.value)}
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
            placeholder='Payment status ID...'
          />
        </div>

        <div>
          <label htmlFor='purchaseOrderId' className='block text-sm font-medium text-gray-700'>
            Purchase Order ID
          </label>
          <input
            type='text'
            id='purchaseOrderId'
            value={localSearch.purchaseOrderId}
            onChange={(e) => handleInputChange('purchaseOrderId', e.target.value)}
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
            placeholder='PO ID...'
          />
        </div>

        <div>
          <label htmlFor='tanggal_start' className='block text-sm font-medium text-gray-700'>
            Start Date
          </label>
          <input
            type='date'
            id='tanggal_start'
            value={localSearch.tanggal_start}
            onChange={(e) => handleInputChange('tanggal_start', e.target.value)}
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
          />
        </div>

        <div>
          <label htmlFor='tanggal_end' className='block text-sm font-medium text-gray-700'>
            End Date
          </label>
          <input
            type='date'
            id='tanggal_end'
            value={localSearch.tanggal_end}
            onChange={(e) => handleInputChange('tanggal_end', e.target.value)}
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
          />
        </div>

        <div className='flex items-end'>
          <button
            onClick={clearSearch}
            className='px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
          >
            Clear Search
          </button>
        </div>
      </div>

      {searchLoading && (
        <div className='mt-2 text-sm text-gray-500'>
          Searching...
        </div>
      )}
    </div>
  );
};

export default InvoiceSearch;
