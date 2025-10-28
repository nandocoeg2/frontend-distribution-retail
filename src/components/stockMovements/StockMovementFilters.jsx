import React, { useMemo } from 'react';
import {
  FunnelIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
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
}) => {
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.type && filters.type !== 'all') ||
      (filters.status && filters.status !== 'all') ||
      (filters.search && filters.search.trim() !== '') ||
      (filters.dateFilterType && filters.dateFilterType !== '')
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
    <section className='rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm sm:p-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <span className='inline-flex rounded-full bg-indigo-100 p-2 text-indigo-600'>
            <AdjustmentsHorizontalIcon className='h-5 w-5' aria-hidden='true' />
          </span>
          <div>
            <h2 className='text-base font-semibold text-gray-900'>
              Cari Pergerakan Stok
            </h2>
            <p className='text-xs text-gray-500'>
              Kombinasikan pencarian dokumen, tipe pergerakan, dan status proses
              untuk menemukan data yang kamu butuhkan.
            </p>
          </div>
        </div>

        <button
          type='button'
          onClick={handleReset}
          disabled={isLoading || !hasActiveFilters}
          className='inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
        >
          <ArrowPathIcon className='mr-2 h-4 w-4' aria-hidden='true' />
          Reset Filter
        </button>
      </div>

      <form
        className='mt-5 space-y-4'
        onSubmit={(event) => event.preventDefault()}
      >
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='sm:col-span-2'>
            <label
              htmlFor='stock-movements-search'
              className='text-sm font-medium text-gray-700'
            >
              Kata Kunci Dokumen
            </label>
            <div className='relative mt-2'>
              <MagnifyingGlassIcon
                className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400'
                aria-hidden='true'
              />
              <input
                id='stock-movements-search'
                type='text'
                name='search'
                value={filters.search}
                onChange={handleSearchChange}
                disabled={isLoading}
                placeholder='Nomor movement, catatan stok, atau nama supplier'
                className='block w-full rounded-xl border border-transparent bg-white px-10 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
              <div className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-300'>
                <FunnelIcon className='h-5 w-5' aria-hidden='true' />
              </div>
            </div>
            <p className='mt-2 text-xs text-gray-500'>
              Gunakan kata kunci spesifik untuk mempercepat pencarian, misalnya{' '}
              <span className='font-medium text-gray-800'>SIN-2025</span> atau{' '}
              <span className='font-medium text-gray-800'>Supplier Sejahtera</span>.
            </p>
          </div>

          <div>
            <label
              htmlFor='movement-type-filter'
              className='text-sm font-medium text-gray-700'
            >
              Jenis Pergerakan
            </label>
            <div className='relative mt-2'>
              <select
                id='movement-type-filter'
                name='type'
                value={filters.type}
                onChange={handleTypeChange}
                disabled={isLoading}
                className='block w-full appearance-none rounded-xl border border-transparent bg-white px-4 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                {MOVEMENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className='pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400'
                aria-hidden='true'
              />
            </div>
            <p className='mt-2 text-xs text-gray-500'>
              Filter berdasarkan jenis pergerakan: stock in dari supplier, stock out ke customer, atau retur pelanggan.
            </p>
          </div>

          <div>
            <label
              htmlFor='movement-status-filter'
              className='text-sm font-medium text-gray-700'
            >
              Status Proses
            </label>
            <div className='relative mt-2'>
              <select
                id='movement-status-filter'
                name='status'
                value={filters.status}
                onChange={handleStatusChange}
                disabled={isLoading}
                className='block w-full appearance-none rounded-xl border border-transparent bg-white px-4 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                {MOVEMENT_STATUS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className='pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400'
                aria-hidden='true'
              />
            </div>
            <p className='mt-2 text-xs text-gray-500'>
              Lihat pergerakan yang masih <span className='font-medium text-gray-700'>Pending</span>,{' '}
              sudah <span className='font-medium text-green-600'>Completed</span>, atau{' '}
              <span className='font-medium text-red-500'>Rejected</span>.
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <div>
            <label
              htmlFor='date-filter-type'
              className='text-sm font-medium text-gray-700'
            >
              Filter Waktu
            </label>
            <div className='relative mt-2'>
              <select
                id='date-filter-type'
                name='dateFilterType'
                value={filters.dateFilterType || ''}
                onChange={handleDateFilterTypeChange}
                disabled={isLoading}
                className='block w-full appearance-none rounded-xl border border-transparent bg-white px-4 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                {DATE_FILTER_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className='pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400'
                aria-hidden='true'
              />
            </div>
            <p className='mt-2 text-xs text-gray-500'>
              Pilih periode waktu untuk filter data pergerakan stok.
            </p>
          </div>

          {filters.dateFilterType === 'custom' && (
            <>
              <div>
                <label
                  htmlFor='start-date'
                  className='text-sm font-medium text-gray-700'
                >
                  Tanggal Mulai
                </label>
                <div className='relative mt-2'>
                  <CalendarIcon
                    className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400'
                    aria-hidden='true'
                  />
                  <input
                    id='start-date'
                    type='datetime-local'
                    name='startDate'
                    value={filters.startDate || ''}
                    onChange={handleStartDateChange}
                    disabled={isLoading}
                    className='block w-full rounded-xl border border-transparent bg-white px-10 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>
                <p className='mt-2 text-xs text-gray-500'>
                  Pilih tanggal dan waktu awal periode.
                </p>
              </div>

              <div>
                <label
                  htmlFor='end-date'
                  className='text-sm font-medium text-gray-700'
                >
                  Tanggal Akhir
                </label>
                <div className='relative mt-2'>
                  <CalendarIcon
                    className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400'
                    aria-hidden='true'
                  />
                  <input
                    id='end-date'
                    type='datetime-local'
                    name='endDate'
                    value={filters.endDate || ''}
                    onChange={handleEndDateChange}
                    disabled={isLoading}
                    className='block w-full rounded-xl border border-transparent bg-white px-10 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>
                <p className='mt-2 text-xs text-gray-500'>
                  Pilih tanggal dan waktu akhir periode.
                </p>
              </div>
            </>
          )}
        </div>
      </form>

      {hasActiveFilters && (
        <div className='mt-4 flex flex-wrap items-center gap-2 text-xs'>
          <span className='text-gray-500'>Filter aktif:</span>
          {filters.search && filters.search.trim() !== '' && (
            <span className='inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700'>
              Kata kunci: {filters.search}
            </span>
          )}
          {filters.type && filters.type !== 'all' && (
            <span className='inline-flex items-center rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700'>
              Tipe: {MOVEMENT_TYPES.find((option) => option.value === filters.type)?.label}
            </span>
          )}
          {filters.status && filters.status !== 'all' && (
            <span className='inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700'>
              Status: {MOVEMENT_STATUS.find((option) => option.value === filters.status)?.label}
            </span>
          )}
          {filters.dateFilterType && filters.dateFilterType !== '' && (
            <span className='inline-flex items-center rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-700'>
              Waktu: {DATE_FILTER_TYPES.find((option) => option.value === filters.dateFilterType)?.label}
            </span>
          )}
        </div>
      )}
    </section>
  );
};

export default StockMovementFilters;
