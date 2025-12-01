import React from 'react'; // Removed unused useEffect, useMemo
import Autocomplete from '../common/Autocomplete';
import useCustomersPage from '../../hooks/useCustomersPage';
import { usePurchaseOrderStatuses } from '../../hooks/useStatusTypes';
import useCompanyAutocomplete from '../../hooks/useCompanyAutocomplete'; // Changed from useSupplierSearch

const PurchaseOrderSearch = ({
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
  const { statuses: purchaseOrderStatuses } = usePurchaseOrderStatuses();
  const companyFilterValue = filters?.companyId; // Changed from supplierId
  // Changed from useSupplierSearch to useCompanyAutocomplete
  const {
    options: companyOptions,
    loading: companyLoading,
    fetchOptions: searchCompanies,
  } = useCompanyAutocomplete({ selectedValue: companyFilterValue });

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch?.();
  };

  const handleReset = () => {
    onReset?.();
  };

  const handleChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    onFiltersChange?.(field, value);
  };

  const handleCompanyChange = (event) => {
    const value = event?.target ? event.target.value : event;
    onFiltersChange?.('companyId', value); // Changed from supplierId
  };

  const handleCustomerChange = (event) => {
    const value = event?.target ? event.target.value : event;
    onFiltersChange?.('customerId', value);
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
            Nomor PO
          </label>
          <input
            type='text'
            value={filters?.po_number || ''}
            onChange={handleChange('po_number')}
            placeholder='Contoh: PO-2024-001'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nama Customer
          </label>
          <input
            type='text'
            value={filters?.customer_name || ''}
            onChange={handleChange('customer_name')}
            placeholder='Contoh: PT Contoh Sejahtera'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Customer ID
          </label>
          <Autocomplete
            label=''
            options={Array.isArray(customerResults) ? customerResults : []}
            value={filters?.customerId || ''}
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
            Status Purchase Order
          </label>
          <select
            value={filters?.status_code || ''}
            onChange={handleChange('status_code')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Semua Status</option>
            {Array.isArray(purchaseOrderStatuses) &&
              purchaseOrderStatuses.map((status) => (
                <option key={status.id} value={status.status_code}>
                  {status.status_code} -{' '}
                  {status.status_description || status.status_name || 'Tidak ada deskripsi'}
                </option>
              ))}
          </select>
          <p className='mt-1 text-xs text-gray-500'>
            Gunakan status code seperti PENDING PURCHASE ORDER atau COMPLETED PURCHASE ORDER.
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Tanggal Masuk PO
          </label>
          <input
            type='date'
            value={filters?.tanggal_masuk_po || ''}
            onChange={handleChange('tanggal_masuk_po')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <p className='mt-1 text-xs text-gray-500'>
            Filter berdasarkan tanggal masuk PO (format YYYY-MM-DD).
          </p>
        </div>
      </div>

      <div className='flex flex-col gap-3 mt-6 sm:flex-row sm:items-center sm:justify-end'>
        <button
          type='button'
          onClick={handleReset}
          className='inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-60'
          disabled={isLoading}
        >
          Atur Ulang
        </button>
        <button
          type='submit'
          disabled={isLoading}
          className='inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed'
        >
          {isLoading ? 'Mencari...' : 'Cari Purchase Order'}
        </button>
      </div>
    </form>
  );
};

export default PurchaseOrderSearch;
