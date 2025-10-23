import React from 'react';
import { FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const MOVEMENT_TYPES = [
  { label: 'All Types', value: 'all' },
  { label: 'Stock In', value: 'STOCK_IN' },
  { label: 'Return', value: 'RETURN' },
];

const MOVEMENT_STATUS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const StockMovementFilters = ({
  filters,
  onChange,
  onReset,
  isLoading = false,
}) => {
  const handleSearchChange = (event) => {
    onChange({ search: event.target.value });
  };

  const handleTypeChange = (event) => {
    onChange({ type: event.target.value });
  };

  const handleStatusChange = (event) => {
    onChange({ status: event.target.value });
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <form
      className='grid grid-cols-1 gap-4 md:grid-cols-4'
      onSubmit={(event) => event.preventDefault()}
    >
      <div className='md:col-span-2'>
        <label
          htmlFor='stock-movements-search'
          className='block text-sm font-medium text-gray-700'
        >
          Search Movements
        </label>
        <div className='mt-1 relative rounded-md shadow-sm'>
          <input
            id='stock-movements-search'
            type='text'
            name='search'
            value={filters.search}
            onChange={handleSearchChange}
            disabled={isLoading}
            placeholder='Movement number, notes, supplier...'
            className='block w-full rounded-md border-gray-300 pr-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
          />
          <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400'>
            <FunnelIcon className='h-5 w-5' aria-hidden='true' />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor='movement-type-filter'
          className='block text-sm font-medium text-gray-700'
        >
          Movement Type
        </label>
        <select
          id='movement-type-filter'
          name='type'
          value={filters.type}
          onChange={handleTypeChange}
          disabled={isLoading}
          className='mt-1 block w-full rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
        >
          {MOVEMENT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor='movement-status-filter'
          className='block text-sm font-medium text-gray-700'
        >
          Status
        </label>
        <select
          id='movement-status-filter'
          name='status'
          value={filters.status}
          onChange={handleStatusChange}
          disabled={isLoading}
          className='mt-1 block w-full rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
        >
          {MOVEMENT_STATUS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className='flex items-end justify-end md:justify-start'>
        <button
          type='button'
          onClick={handleReset}
          disabled={isLoading}
          className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60'
        >
          <ArrowPathIcon className='mr-2 h-4 w-4' aria-hidden='true' />
          Reset Filters
        </button>
      </div>
    </form>
  );
};

export default StockMovementFilters;

