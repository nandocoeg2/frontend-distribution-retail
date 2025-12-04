import React from 'react';
import { FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export const purchaseOrderFilterDefaults = { search: '', shippingStatus: 'all', billingStatus: 'all', paymentStatus: 'all', onlyPending: false };

const PurchaseOrderFilters = ({ filters = purchaseOrderFilterDefaults, onChange = () => {}, onReset = () => {}, options = { shippingStatus: [], billingStatus: [], paymentStatus: [] } }) => {
  const handleChange = (e) => onChange({ ...filters, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const Select = ({ name, label, entries }) => (
    <div>
      <label htmlFor={name} className='text-[10px] font-semibold text-gray-500 uppercase'>{label}</label>
      <select id={name} name={name} value={filters[name]} onChange={handleChange} className='w-full px-2 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded focus:border-indigo-500 focus:outline-none'>
        <option value='all'>All</option>
        {entries.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-1.5 text-xs font-medium text-gray-600'>
          <FunnelIcon className='w-4 h-4 text-indigo-500' />
          <span>Filter</span>
        </div>
        <div className='flex items-center gap-2'>
          <label className='inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-gray-600 border border-gray-200 rounded bg-gray-50'>
            <input type='checkbox' name='onlyPending' checked={Boolean(filters.onlyPending)} onChange={handleChange} className='w-3 h-3 text-indigo-600 border-gray-300 rounded' />
            Pending saja
          </label>
          <button type='button' onClick={() => onReset({ ...purchaseOrderFilterDefaults })} className='inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100'>
            <ArrowPathIcon className='w-3 h-3' />Reset
          </button>
        </div>
      </div>
      <div className='grid grid-cols-2 gap-2 md:grid-cols-4'>
        <div>
          <label htmlFor='search' className='text-[10px] font-semibold text-gray-500 uppercase'>Cari PO</label>
          <input type='text' id='search' name='search' value={filters.search} onChange={handleChange} placeholder='PO-001' className='w-full px-2 py-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded focus:border-indigo-500 focus:outline-none' />
        </div>
        <Select name='shippingStatus' label='Pengiriman' entries={options.shippingStatus} />
        <Select name='billingStatus' label='Tagihan' entries={options.billingStatus} />
        <Select name='paymentStatus' label='Pembayaran' entries={options.paymentStatus} />
      </div>
    </div>
  );
};

export default PurchaseOrderFilters;
