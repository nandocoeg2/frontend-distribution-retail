import React from 'react';

const KwitansiSearch = ({
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
            Nomor Kwitansi
          </label>
          <input
            type='text'
            value={filters.no_kwitansi || ''}
            onChange={handleChange('no_kwitansi')}
            placeholder='Contoh: KW-2024-001'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nama Penerima
          </label>
          <input
            type='text'
            value={filters.kepada || ''}
            onChange={handleChange('kepada')}
            placeholder='Contoh: Budi Santoso'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Invoice Penagihan ID
          </label>
          <input
            type='text'
            value={filters.invoicePenagihanId || ''}
            onChange={handleChange('invoicePenagihanId')}
            placeholder='Masukkan ID invoice penagihan'
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
            placeholder='Masukkan ID status kwitansi'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <p className='mt-1 text-xs text-gray-500'>
            Gunakan ID status. Contoh: status-id, status-id-updated.
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Term of Payment ID
          </label>
          <input
            type='text'
            value={filters.termOfPaymentId || ''}
            onChange={handleChange('termOfPaymentId')}
            placeholder='Masukkan ID term of payment'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Tanggal Mulai
            </label>
            <input
              type='date'
              value={filters.tanggal_start || ''}
              onChange={handleChange('tanggal_start')}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Tanggal Akhir
            </label>
            <input
              type='date'
              value={filters.tanggal_end || ''}
              onChange={handleChange('tanggal_end')}
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
          {isLoading ? 'Mencari...' : 'Cari Kwitansi'}
        </button>
      </div>
    </form>
  );
};

export default KwitansiSearch;
