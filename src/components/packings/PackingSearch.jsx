import React from 'react';
import useStatuses from '../../hooks/useStatuses';

const PackingSearch = ({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  searchLoading,
}) => {
  const { packingStatuses, fetchPackingStatuses } = useStatuses();

  React.useEffect(() => {
    fetchPackingStatuses();
  }, [fetchPackingStatuses]);

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

  const isLoading = Boolean(searchLoading);

  return (
    <form
      onSubmit={handleSubmit}
      className='p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nomor Packing
          </label>
          <input
            type='text'
            value={filters.packing_number || ''}
            onChange={handleChange('packing_number')}
            placeholder='Contoh: PKG-2024-001'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Purchase Order ID
          </label>
          <input
            type='text'
            value={filters.purchaseOrderId || ''}
            onChange={handleChange('purchaseOrderId')}
            placeholder='Masukkan ID purchase order'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status Packing
          </label>
          <select
            value={filters.status_code || ''}
            onChange={handleChange('status_code')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Semua Status</option>
            {Array.isArray(packingStatuses) &&
              packingStatuses.map((status) => (
                <option
                  key={status.id || status.status_code}
                  value={status.status_code || status.status_name || ''}
                >
                  {status.status_name || status.status_code}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Tanggal Packing
          </label>
          <input
            type='date'
            value={filters.tanggal_packing || ''}
            onChange={handleChange('tanggal_packing')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status Cetak
          </label>
          <select
            value={filters.is_printed || ''}
            onChange={handleChange('is_printed')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Semua Status Cetak</option>
            <option value='true'>Sudah Dicetak</option>
            <option value='false'>Belum Dicetak</option>
          </select>
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
          {isLoading ? 'Mencari...' : 'Cari Packing'}
        </button>
      </div>
    </form>
  );
};

export default PackingSearch;
