import React, { useMemo } from 'react';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const MOVEMENT_TYPES = [
  { label: 'All Types', value: 'all' },
  { label: 'Stock In', value: 'STOCK_IN' },
  { label: 'Stock Out', value: 'STOCK_OUT' },
  { label: 'Return', value: 'RETURN' },
];

const MOVEMENT_STATUS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const DATE_FILTER_TYPES = [
  { label: 'Semua Waktu', value: '' },
  { label: 'Hari Ini', value: 'daily' },
  { label: '7 Hari Terakhir', value: 'weekly' },
  { label: 'Bulan Ini', value: 'monthly' },
  { label: 'Tahun Ini', value: 'yearly' },
  { label: 'Custom Range', value: 'custom' },
];

const StockMovementFilters = ({
  filters,
  onChange,
  onReset,
  isLoading = false,
  itemOptions = [],
}) => {
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.type && filters.type !== 'all') ||
      (filters.status && filters.status !== 'all') ||
      (filters.search && filters.search.trim() !== '') ||
      (filters.dateFilterType && filters.dateFilterType !== '') ||
      (filters.itemId && filters.itemId !== '')
    );
  }, [filters]);

  const handleSearchChange = (event) => {
    onChange({ search: event.target.value });
  };

  const handleTypeChange = (event) => {
    onChange({ type: event.target.value });
  };

  const handleStatusChange = (event) => {
    onChange({ status: event.target.value });
  };

  const handleDateFilterTypeChange = (event) => {
    const newType = event.target.value;
    if (newType !== 'custom') {
      onChange({ dateFilterType: newType, startDate: '', endDate: '' });
    } else {
      onChange({ dateFilterType: newType });
    }
  };

  const handleItemChange = (event) => {
    onChange({ itemId: event.target.value });
  };

  const handleStartDateChange = (event) => {
    onChange({ startDate: event.target.value });
  };

  const handleEndDateChange = (event) => {
    onChange({ endDate: event.target.value });
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <section className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
      <form onSubmit={(event) => event.preventDefault()}>
        {/* Row 1: Search + Type + Status + Product */}
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12'>
          <div className='lg:col-span-4'>
            <label htmlFor='stock-movements-search' className='sr-only'>
              Search
            </label>
            <div className='relative'>
              <MagnifyingGlassIcon
                className='pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
                aria-hidden='true'
              />
              <input
                id='stock-movements-search'
                type='text'
                name='search'
                value={filters.search}
                onChange={handleSearchChange}
                disabled={isLoading}
                placeholder='Cari nomor, catatan, supplier...'
                className='block w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
              />
            </div>
          </div>

          <div className='lg:col-span-2'>
            <label htmlFor='movement-type-filter' className='sr-only'>
              Type
            </label>
            <div className='relative'>
              <select
                id='movement-type-filter'
                name='type'
                value={filters.type}
                onChange={handleTypeChange}
                disabled={isLoading}
                className='block w-full appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
              >
                {MOVEMENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
                aria-hidden='true'
              />
            </div>
          </div>

          <div className='lg:col-span-2'>
            <label htmlFor='movement-status-filter' className='sr-only'>
              Status
            </label>
            <div className='relative'>
              <select
                id='movement-status-filter'
                name='status'
                value={filters.status}
                onChange={handleStatusChange}
                disabled={isLoading}
                className='block w-full appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
              >
                {MOVEMENT_STATUS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
                aria-hidden='true'
              />
            </div>
          </div>

          <div className='lg:col-span-2'>
            <label htmlFor='item-filter' className='sr-only'>
              Produk
            </label>
            <div className='relative'>
              <select
                id='item-filter'
                name='itemId'
                value={filters.itemId || ''}
                onChange={handleItemChange}
                disabled={isLoading}
                className='block w-full appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
              >
                <option value=''>Semua Produk</option>
                {itemOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama_barang || item.name || item.id}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
                aria-hidden='true'
              />
            </div>
          </div>

          <div className='lg:col-span-2'>
            <label htmlFor='date-filter-type' className='sr-only'>
              Waktu
            </label>
            <div className='relative'>
              <select
                id='date-filter-type'
                name='dateFilterType'
                value={filters.dateFilterType || ''}
                onChange={handleDateFilterTypeChange}
                disabled={isLoading}
                className='block w-full appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
              >
                {DATE_FILTER_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
                aria-hidden='true'
              />
            </div>
          </div>
        </div>

        {/* Row 2: Custom Date Range (only when custom is selected) */}
        {filters.dateFilterType === 'custom' && (
          <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='lg:col-span-2'>
              <label htmlFor='start-date' className='sr-only'>
                Tanggal Mulai
              </label>
              <div className='relative'>
                <CalendarIcon
                  className='pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
                  aria-hidden='true'
                />
                <input
                  id='start-date'
                  type='datetime-local'
                  name='startDate'
                  value={filters.startDate || ''}
                  onChange={handleStartDateChange}
                  disabled={isLoading}
                  className='block w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                />
              </div>
            </div>
            <div className='lg:col-span-2'>
              <label htmlFor='end-date' className='sr-only'>
                Tanggal Akhir
              </label>
              <div className='relative'>
                <CalendarIcon
                  className='pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
                  aria-hidden='true'
                />
                <input
                  id='end-date'
                  type='datetime-local'
                  name='endDate'
                  value={filters.endDate || ''}
                  onChange={handleEndDateChange}
                  disabled={isLoading}
                  className='block w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Active Filters + Reset */}
      {hasActiveFilters && (
        <div className='mt-2 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2 text-xs'>
          <span className='text-gray-400'>Filter:</span>
          {filters.search && filters.search.trim() !== '' && (
            <span className='inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-600'>
              "{filters.search}"
            </span>
          )}
          {filters.type && filters.type !== 'all' && (
            <span className='inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-blue-600'>
              {MOVEMENT_TYPES.find((option) => option.value === filters.type)?.label}
            </span>
          )}
          {filters.status && filters.status !== 'all' && (
            <span className='inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600'>
              {MOVEMENT_STATUS.find((option) => option.value === filters.status)?.label}
            </span>
          )}
          {filters.dateFilterType && filters.dateFilterType !== '' && (
            <span className='inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-purple-600'>
              {DATE_FILTER_TYPES.find((option) => option.value === filters.dateFilterType)?.label}
            </span>
          )}
          {filters.itemId && filters.itemId !== '' && (
            <span className='inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-orange-600'>
              {itemOptions.find((item) => item.id === filters.itemId)?.nama_barang || 'Produk'}
            </span>
          )}
          <button
            type='button'
            onClick={handleReset}
            disabled={isLoading}
            className='ml-auto inline-flex items-center rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50'
          >
            <ArrowPathIcon className='mr-1 h-3 w-3' aria-hidden='true' />
            Reset
          </button>
        </div>
      )}
    </section>
  );
};

export default StockMovementFilters;
