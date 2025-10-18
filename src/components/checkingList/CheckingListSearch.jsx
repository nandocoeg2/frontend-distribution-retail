import React from 'react';

const CheckingListSearch = ({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  loading,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch?.();
  };

  const handleReset = () => {
    onReset?.();
  };

  const handleChange = (field) => (event) => {
    onFiltersChange?.(field, event.target.value);
  };

  const isLoading = Boolean(loading);

  return (
    <form
      onSubmit={handleSubmit}
      className='p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nomor Surat Jalan
          </label>
          <input
            type='text'
            value={filters.no_surat_jalan || ''}
            onChange={handleChange('no_surat_jalan')}
            placeholder='Contoh: SJ-2024-001'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Penerima (Deliver To)
          </label>
          <input
            type='text'
            value={filters.deliver_to || ''}
            onChange={handleChange('deliver_to')}
            placeholder='Contoh: Customer ABC'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            PIC
          </label>
          <input
            type='text'
            value={filters.PIC || ''}
            onChange={handleChange('PIC')}
            placeholder='Contoh: John Doe'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Checker
          </label>
          <input
            type='text'
            value={filters.checker || ''}
            onChange={handleChange('checker')}
            placeholder='Contoh: Ahmad Wijaya'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Driver
          </label>
          <input
            type='text'
            value={filters.driver || ''}
            onChange={handleChange('driver')}
            placeholder='Contoh: Budi Santoso'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nomor Kendaraan
          </label>
          <input
            type='text'
            value={filters.mobil || ''}
            onChange={handleChange('mobil')}
            placeholder='Contoh: B 1234 XYZ'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Kota
          </label>
          <input
            type='text'
            value={filters.kota || ''}
            onChange={handleChange('kota')}
            placeholder='Contoh: Jakarta'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status ID
          </label>
          <input
            type='text'
            value={filters.statusId || ''}
            onChange={handleChange('statusId')}
            placeholder='Masukkan ID status checklist'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <p className='mt-1 text-xs text-gray-500'>
            Gunakan kode status checklist yang valid.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Tanggal Mulai
            </label>
            <input
              type='date'
              value={filters.tanggal_from || ''}
              onChange={handleChange('tanggal_from')}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Tanggal Akhir
            </label>
            <input
              type='date'
              value={filters.tanggal_to || ''}
              onChange={handleChange('tanggal_to')}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-3 mt-6 sm:flex-row sm:items-center sm:justify-end'>
        <button
          type='button'
          onClick={handleReset}
          className='inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
        >
          Atur Ulang
        </button>
        <button
          type='submit'
          disabled={isLoading}
          className='inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed'
        >
          {isLoading ? 'Mencari...' : 'Cari Checklist'}
        </button>
      </div>
    </form>
  );
};

export default CheckingListSearch;
