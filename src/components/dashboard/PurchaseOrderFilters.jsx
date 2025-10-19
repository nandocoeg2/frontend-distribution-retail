import React from 'react';
import { FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export const purchaseOrderFilterDefaults = {
  search: '',
  shippingStatus: 'all',
  billingStatus: 'all',
  paymentStatus: 'all',
  onlyPending: false,
};

const PurchaseOrderFilters = ({
  filters = purchaseOrderFilterDefaults,
  onChange = () => {},
  onReset = () => {},
  options = {
    shippingStatus: [],
    billingStatus: [],
    paymentStatus: [],
  },
}) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value });
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange({ ...filters, [name]: checked });
  };

  const renderSelect = (name, label, entries) => (
    <div className='space-y-1'>
      <label htmlFor={name} className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={filters[name]}
        onChange={handleInputChange}
        className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
      >
        <option value='all'>Semua</option>
        {entries.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className='rounded-none border-0 bg-transparent p-0 shadow-none'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2 text-sm font-medium text-gray-700'>
          <FunnelIcon className='h-5 w-5 text-indigo-500' aria-hidden='true' />
          <span>Penyaringan data purchase order</span>
        </div>
        <div className='flex items-center gap-3'>
          <label className='inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600'>
            <input
              type='checkbox'
              name='onlyPending'
              checked={Boolean(filters.onlyPending)}
              onChange={handleCheckboxChange}
              className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
            />
            Fokus status masih proses
          </label>
          <button
            type='button'
            onClick={() => onReset({ ...purchaseOrderFilterDefaults })}
            className='inline-flex items-center gap-1 rounded-lg border border-transparent bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
          >
            <ArrowPathIcon className='h-4 w-4' aria-hidden='true' />
            Reset
          </button>
        </div>
      </div>

      <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <div className='space-y-1'>
          <label htmlFor='search' className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
            Cari Nomor PO / Status
          </label>
          <input
            type='text'
            id='search'
            name='search'
            value={filters.search}
            onChange={handleInputChange}
            placeholder='Contoh: PO-001 atau Terkirim'
            className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
          />
        </div>
        {renderSelect('shippingStatus', 'Status Pengiriman', options.shippingStatus)}
        {renderSelect('billingStatus', 'Status Tagihan', options.billingStatus)}
        {renderSelect('paymentStatus', 'Status Pembayaran', options.paymentStatus)}
      </div>
    </div>
  );
};

export default PurchaseOrderFilters;
