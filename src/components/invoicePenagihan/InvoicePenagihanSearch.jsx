import React from 'react';
import Autocomplete from '../common/Autocomplete';
import usePurchaseOrderAutocomplete from '@/hooks/usePurchaseOrderAutocomplete';
import useTermOfPaymentAutocomplete from '@/hooks/useTermOfPaymentAutocomplete';

const InvoicePenagihanSearch = ({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  loading,
}) => {
  const {
    options: purchaseOrderOptions,
    loading: purchaseOrderLoading,
    fetchOptions: searchPurchaseOrders,
  } = usePurchaseOrderAutocomplete({
    selectedValue: filters.purchaseOrderId,
  });
  const {
    options: termOfPaymentOptions,
    loading: termOfPaymentLoading,
    fetchOptions: searchTermOfPayments
  } = useTermOfPaymentAutocomplete({
    selectedValue: filters.termOfPaymentId
  });

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

  const handleAutocompleteChange = (field) => (eventOrValue) => {
    const value = eventOrValue?.target
      ? eventOrValue.target.value
      : eventOrValue || '';
    onFiltersChange?.(field, value);
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
            Nomor Invoice Penagihan
          </label>
          <input
            type='text'
            value={filters.no_invoice_penagihan || ''}
            onChange={handleChange('no_invoice_penagihan')}
            placeholder='Contoh: IPN-2024-001'
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
            placeholder='Contoh: Customer ABC'
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
            placeholder='Masukkan ID status invoice'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Purchase Order ID
          </label>
          <Autocomplete
            label=''
            options={purchaseOrderOptions}
            value={filters.purchaseOrderId || ''}
            onChange={handleAutocompleteChange('purchaseOrderId')}
            placeholder='Cari Purchase Order'
            displayKey='label'
            valueKey='id'
            name='purchaseOrderId'
            loading={purchaseOrderLoading}
            onSearch={searchPurchaseOrders}
            showId
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Term of Payment ID
          </label>
          <Autocomplete
            label=''
            options={termOfPaymentOptions}
            value={filters.termOfPaymentId || ''}
            onChange={handleChange('termOfPaymentId')}
            placeholder='Cari Term of Payment'
            displayKey='label'
            valueKey='id'
            name='termOfPaymentId'
            loading={termOfPaymentLoading}
            onSearch={searchTermOfPayments}
            showId
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Kwitansi ID
          </label>
          <input
            type='text'
            value={filters.kwitansiId || ''}
            onChange={handleChange('kwitansiId')}
            placeholder='Masukkan ID kwitansi'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Faktur Pajak ID
          </label>
          <input
            type='text'
            value={filters.fakturPajakId || ''}
            onChange={handleChange('fakturPajakId')}
            placeholder='Masukkan ID faktur pajak'
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
          {isLoading ? 'Mencari...' : 'Cari Invoice'}
        </button>
      </div>
    </form>
  );
};

export default InvoicePenagihanSearch;
