import React from 'react'; // Removed unused useEffect, useMemo
import Autocomplete from '../common/Autocomplete';
import useCustomersPage from '../../hooks/useCustomersPage';
import useCompanyAutocomplete from '../../hooks/useCompanyAutocomplete'; // Changed from useSupplierSearch
import useTermOfPaymentAutocomplete from '../../hooks/useTermOfPaymentAutocomplete';
import usePurchaseOrderAutocomplete from '../../hooks/usePurchaseOrderAutocomplete';

const LaporanPenerimaanBarangSearch = ({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  loading,
}) => {
  const {
    customers: customerResults = [],
    loading: customersLoading,
    searchCustomers,
  } = useCustomersPage();
  const companyFilterValue = filters?.companyId; // Changed from supplierId
  // Changed from useSupplierSearch to useCompanyAutocomplete
  const {
    options: companyOptions,
    loading: companyLoading,
    fetchOptions: searchCompanies,
  } = useCompanyAutocomplete({ selectedValue: companyFilterValue });

  const {
    options: termOfPaymentOptions,
    loading: termOfPaymentLoading,
    fetchOptions: searchTermOfPayments
  } = useTermOfPaymentAutocomplete({
    selectedValue: filters?.termin_bayar
  });
  const {
    options: purchaseOrderOptions,
    loading: purchaseOrderLoading,
    fetchOptions: searchPurchaseOrders,
  } = usePurchaseOrderAutocomplete({
    selectedValue: filters?.purchaseOrderId,
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

  const handleCustomerChange = (event) => {
    const value = event?.target ? event.target.value : event;
    onFiltersChange?.('customerId', value);
  };

  const handleCompanyChange = (event) => {
    const value = event?.target ? event.target.value : event;
    onFiltersChange?.('companyId', value); // Changed from supplierId
  };

  const handlePurchaseOrderChange = (event) => {
    const value = event?.target ? event.target.value : event;
    onFiltersChange?.('purchaseOrderId', value);
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
            Status Code
          </label>
          <input
            type='text'
            value={filters.status_code || ''}
            onChange={handleChange('status_code')}
            placeholder='Contoh: COMPLETED LAPORAN PENERIMAAN BARANG'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <p className='mt-1 text-xs text-gray-500'>
            Gunakan status LPB persis seperti pada master data.
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Purchase Order ID
          </label>
          <Autocomplete
            label=''
            options={purchaseOrderOptions}
            value={filters.purchaseOrderId || ''}
            onChange={handlePurchaseOrderChange}
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
            Company ID
          </label>
          <Autocomplete
            label=''
            options={companyOptions}
            value={
              companyFilterValue !== undefined && companyFilterValue !== null
                ? String(companyFilterValue)
                : ''
            }
            onChange={handleCompanyChange}
            placeholder='Cari nama atau ID company'
            displayKey='label'
            valueKey='id'
            name='companyId'
            loading={companyLoading}
            onSearch={async (query) => {
              try {
                await searchCompanies(query);
              } catch (error) {
                console.error('Failed to search companies:', error);
              }
            }}
            showId
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Customer ID
          </label>
          <Autocomplete
            label=''
            options={Array.isArray(customerResults) ? customerResults : []}
            value={filters.customerId || ''}
            onChange={handleCustomerChange}
            placeholder='Cari nama atau ID customer'
            displayKey='namaCustomer'
            valueKey='id'
            name='customerId'
            loading={customersLoading}
            onSearch={async (query) => {
              try {
                await searchCustomers(query, 1, 20);
              } catch (error) {
                console.error('Failed to search customers:', error);
              }
            }}
            showId
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Termin Bayar ID
          </label>
          <Autocomplete
            label=''
            options={termOfPaymentOptions}
            value={filters.termin_bayar || ''}
            onChange={handleChange('termin_bayar')}
            placeholder='Cari Term of Payment'
            displayKey='label'
            valueKey='id'
            name='termin_bayar'
            loading={termOfPaymentLoading}
            onSearch={searchTermOfPayments}
            showId
          />
        </div>

        <div className='md:col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Kata Kunci
          </label>
          <div className='relative'>
            <input
              type='text'
              value={filters.q || ''}
              onChange={handleChange('q')}
              placeholder='Cari berdasarkan nomor PO, customer, atau kata kunci lain...'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              {isLoading ? (
                <div className='animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent'></div>
              ) : (
                <svg
                  className='h-4 w-4 text-gray-400'
                  fill='none'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
                </svg>
              )}
            </div>
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
          {isLoading ? 'Mencari...' : 'Cari Laporan'}
        </button>
      </div>
    </form>
  );
};

export default LaporanPenerimaanBarangSearch;
