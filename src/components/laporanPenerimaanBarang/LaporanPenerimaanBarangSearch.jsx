import React from 'react';

const fieldOptions = [
  { value: 'q', label: 'Semua Kolom' },
  { value: 'po_number', label: 'Nomor PO' },
  { value: 'nama_customer', label: 'Nama Customer' },
  { value: 'alamat_customer', label: 'Alamat Customer' },
  { value: 'status', label: 'Status' },
];

const placeholderMap = {
  q: 'Cari berdasarkan nomor PO, customer, alamat, atau status...',
  po_number: 'Cari berdasarkan nomor purchase order...',
  nama_customer: 'Cari berdasarkan nama customer...',
  alamat_customer: 'Cari berdasarkan alamat customer...',
  status: 'Cari berdasarkan status laporan...',
};

const LaporanPenerimaanBarangSearch = ({
  searchQuery,
  searchField,
  handleSearchChange,
  handleSearchFieldChange,
  searchLoading,
}) => {
  const placeholder = placeholderMap[searchField] || 'Cari laporan penerimaan barang...';

  return (
    <div className='mb-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Kolom Pencarian</label>
        <select
          value={searchField}
          onChange={(event) => handleSearchFieldChange(event.target.value)}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          {fieldOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className='md:col-span-2'>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Kata Kunci</label>
        <div className='relative'>
          <input
            type='text'
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            {searchLoading ? (
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent'></div>
            ) : (
              <svg
                className='h-4 w-4 text-gray-400'
                fill='none'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaporanPenerimaanBarangSearch;
