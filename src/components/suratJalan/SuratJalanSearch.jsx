import React from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT SURAT JALAN', label: 'Draft Surat Jalan' },
  { value: 'READY TO SHIP SURAT JALAN', label: 'Ready to Ship' },
  { value: 'SHIPPED SURAT JALAN', label: 'Shipped' },
  { value: 'DELIVERED SURAT JALAN', label: 'Delivered' },
  { value: 'CANCELLED SURAT JALAN', label: 'Cancelled' },
];

const PRINT_STATUS_OPTIONS = [
  { value: '', label: 'Semua Status Cetak' },
  { value: 'true', label: 'Sudah Dicetak' },
  { value: 'false', label: 'Belum Dicetak' },
];

const SuratJalanSearch = ({
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

  const handleInputChange = (field) => (event) => {
    onFiltersChange?.(field, event.target.value);
  };

  const handleSelectChange = (field) => (event) => {
    const value = event.target.value;
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
            Nomor Surat Jalan
          </label>
          <input
            type='text'
            value={filters.no_surat_jalan || ''}
            onChange={handleInputChange('no_surat_jalan')}
            placeholder='Contoh: SJ-2024-001'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nama Penerima
          </label>
          <input
            type='text'
            value={filters.deliver_to || ''}
            onChange={handleInputChange('deliver_to')}
            placeholder='Contoh: Customer ABC'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            PIC
          </label>
          <input
            type='text'
            value={filters.PIC || ''}
            onChange={handleInputChange('PIC')}
            placeholder='Contoh: John Doe'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Invoice ID
          </label>
          <input
            type='text'
            value={filters.invoiceId || ''}
            onChange={handleInputChange('invoiceId')}
            placeholder='Masukkan ID invoice terkait'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Purchase Order ID
          </label>
          <input
            type='text'
            value={filters.purchaseOrderId || ''}
            onChange={handleInputChange('purchaseOrderId')}
            placeholder='Masukkan ID purchase order'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status Surat Jalan
          </label>
          <select
            value={filters.status_code || ''}
            onChange={handleSelectChange('status_code')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Checklist Surat Jalan ID
          </label>
          <input
            type='text'
            value={filters.checklistSuratJalanId || ''}
            onChange={handleInputChange('checklistSuratJalanId')}
            placeholder='Masukkan ID checklist terkait'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <p className='mt-1 text-xs text-gray-500'>
            Gunakan ID checklist untuk mencari surat jalan yang sudah ditugaskan
            ke checklist tertentu.
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status Cetak
          </label>
          <select
            value={filters.is_printed ?? ''}
            onChange={handleSelectChange('is_printed')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {PRINT_STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'print-all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className='mt-1 text-xs text-gray-500'>
            Lacak apakah surat jalan sudah pernah dicetak.
          </p>
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
          {isLoading ? 'Mencari...' : 'Cari Surat Jalan'}
        </button>
      </div>
    </form>
  );
};

export default SuratJalanSearch;
