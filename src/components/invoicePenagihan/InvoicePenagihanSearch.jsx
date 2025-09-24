import React, { useMemo } from 'react';

const SELECT_OPTIONS = {
  kw: [
    { value: '', label: 'Semua KW' },
    { value: 'true', label: 'KW - Ya' },
    { value: 'false', label: 'KW - Tidak' },
  ],
  fp: [
    { value: '', label: 'Semua FP' },
    { value: 'true', label: 'FP - Ya' },
    { value: 'false', label: 'FP - Tidak' },
  ],
};

const DATE_FIELDS = new Set(['tanggal_start', 'tanggal_end']);

const InvoicePenagihanSearch = ({
  searchQuery,
  searchField,
  handleSearchChange,
  handleSearchFieldChange,
  searchLoading,
}) => {
  const inputType = useMemo(() => {
    if (DATE_FIELDS.has(searchField)) {
      return 'date';
    }
    if (SELECT_OPTIONS[searchField]) {
      return 'select';
    }
    return 'text';
  }, [searchField]);

  const placeholder = useMemo(() => {
    const label = searchField
      ? searchField
          .replace(/([A-Z])/g, ' ')
          .replace(/_/g, ' ')
          .trim()
      : 'field';
    return `Cari berdasarkan ${label}`;
  }, [searchField]);

  return (
    <div className='grid grid-cols-1 gap-4 mb-4 md:grid-cols-3'>
      <div>
        <select
          value={searchField}
          onChange={(e) => handleSearchFieldChange(e.target.value)}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          <option value='no_invoice_penagihan'>Nomor Invoice</option>
          <option value='kepada'>Kepada</option>
          <option value='statusId'>Status ID</option>
          <option value='purchaseOrderId'>Purchase Order ID</option>
          <option value='termOfPaymentId'>Term of Payment ID</option>
          <option value='kw'>Status KW</option>
          <option value='fp'>Status FP</option>
          <option value='tanggal_start'>Tanggal Mulai</option>
          <option value='tanggal_end'>Tanggal Akhir</option>
        </select>
      </div>
      <div className='relative md:col-span-2'>
        {inputType === 'select' ? (
          <select
            value={searchQuery}
            onChange={handleSearchChange}
            className='w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {SELECT_OPTIONS[searchField].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            placeholder={inputType === 'date' ? undefined : placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className='w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        )}
        <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
          <svg
            className='w-5 h-5 text-gray-400'
            fill='none'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
          </svg>
        </div>
        {searchLoading && (
          <div className='flex items-center mt-2 text-sm text-gray-600'>
            <div className='w-4 h-4 mr-2 border-b-2 border-blue-600 rounded-full animate-spin'></div>
            Mencari data...
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePenagihanSearch;
