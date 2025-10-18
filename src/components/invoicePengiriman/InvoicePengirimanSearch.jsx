import React from 'react';

const InvoicePengirimanSearch = ({
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

  const values = filters || {};
  const isLoading = Boolean(loading);

  const resolvePrintedValue = () => {
    if (values.is_printed === true) {
      return 'true';
    }
    if (values.is_printed === false) {
      return 'false';
    }
    return values.is_printed || '';
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nomor Invoice
          </label>
          <input
            type='text'
            value={values.no_invoice || ''}
            onChange={handleChange('no_invoice')}
            placeholder='Contoh: INV-2024-001'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Tujuan Pengiriman
          </label>
          <input
            type='text'
            value={values.deliver_to || ''}
            onChange={handleChange('deliver_to')}
            placeholder='Masukkan nama penerima'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Purchase Order ID
          </label>
          <input
            type='text'
            value={values.purchaseOrderId || ''}
            onChange={handleChange('purchaseOrderId')}
            placeholder='Masukkan ID Purchase Order'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Tipe Invoice
          </label>
          <select
            value={values.type || ''}
            onChange={handleChange('type')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Semua Tipe</option>
            <option value='PENGIRIMAN'>PENGIRIMAN</option>
            <option value='PEMBAYARAN'>PEMBAYARAN</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status Invoice
          </label>
          <select
            value={values.status_code || ''}
            onChange={handleChange('status_code')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Semua Status</option>
            <option value='PENDING INVOICE'>PENDING INVOICE</option>
            <option value='PAID INVOICE'>PAID INVOICE</option>
            <option value='OVERDUE INVOICE'>OVERDUE INVOICE</option>
            <option value='CANCELLED INVOICE'>CANCELLED INVOICE</option>
            <option value='PAYMENT_PENDING'>PAYMENT_PENDING</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status Cetak
          </label>
          <select
            value={resolvePrintedValue()}
            onChange={handleChange('is_printed')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Semua Status</option>
            <option value='true'>Sudah Dicetak</option>
            <option value='false'>Belum Dicetak</option>
          </select>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Tanggal Mulai
            </label>
            <input
              type='date'
              value={values.tanggal_start || ''}
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
              value={values.tanggal_end || ''}
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
          {isLoading ? 'Mencari...' : 'Cari Invoice'}
        </button>
      </div>
    </form>
  );
};

export default InvoicePengirimanSearch;
