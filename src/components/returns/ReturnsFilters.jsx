import React from 'react';
import HeroIcon from '../atoms/HeroIcon.jsx';

const ReturnsFilters = ({
  filters,
  statusOptions,
  onFiltersChange,
  onSearch,
  onReset,
  loading,
}) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onFiltersChange(name, value);
  };

  return (
    <form
      onSubmit={onSearch}
      className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-4 md:items-end'
    >
      <div className='md:col-span-2'>
        <label
          htmlFor='return-search'
          className='block text-sm font-medium text-gray-700'
        >
          Pencarian
        </label>
        <div className='relative mt-1 rounded-md shadow-sm'>
          <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none'>
            <HeroIcon name='magnifying-glass' className='w-5 h-5' />
          </span>
          <input
            id='return-search'
            name='search'
            type='text'
            value={filters.search}
            onChange={handleInputChange}
            placeholder='Cari berdasarkan nomor retur atau nama barang'
            className='block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
          />
        </div>
      </div>

      <div>
        <label
          htmlFor='return-status'
          className='block text-sm font-medium text-gray-700'
        >
          Status
        </label>
        <select
          id='return-status'
          name='status'
          value={filters.status}
          onChange={handleInputChange}
          className='block w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className='flex items-center gap-3'>
        <button
          type='submit'
          disabled={loading}
          className='inline-flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 border border-transparent rounded-md shadow-sm disabled:opacity-60 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          <HeroIcon name='magnifying-glass' className='w-5 h-5 mr-2' />
          Cari
        </button>
        <button
          type='button'
          onClick={onReset}
          disabled={loading}
          className='inline-flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors bg-white border border-gray-300 rounded-md shadow-sm disabled:opacity-50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          <HeroIcon name='arrow-path' className='w-4 h-4 mr-2' />
          Reset
        </button>
      </div>
    </form>
  );
};

export default ReturnsFilters;
