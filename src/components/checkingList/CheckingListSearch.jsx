import React from 'react';

const fieldOptions = [
  { value: 'checker', label: 'Nama Checker' },
  { value: 'driver', label: 'Nama Driver' },
  { value: 'mobil', label: 'Nomor Kendaraan' },
  { value: 'kota', label: 'Kota Tujuan' },
  { value: 'suratJalanId', label: 'ID Surat Jalan' },
];

const placeholderMap = {
  checker: 'Cari berdasarkan nama checker...',
  driver: 'Cari berdasarkan nama driver...',
  mobil: 'Cari berdasarkan nomor kendaraan...',
  kota: 'Cari berdasarkan kota tujuan...',
  suratJalanId: 'Cari berdasarkan ID surat jalan...',
};

const CheckingListSearch = ({
  searchQuery,
  searchField,
  handleSearchChange,
  handleSearchFieldChange,
  searchLoading,
}) => {
  const placeholder =
    placeholderMap[searchField] || 'Cari checklist surat jalan...';

  return (
    <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Kolom Pencarian
        </label>
        <select
          value={searchField}
          onChange={(event) => handleSearchFieldChange(event.target.value)}
          className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          {fieldOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className='md:col-span-2'>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Kata Kunci
        </label>
        <div className='relative'>
          <input
            type='text'
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className='w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            {searchLoading ? (
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent'></div>
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

export default CheckingListSearch;
