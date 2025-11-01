import React, { useEffect, useState } from 'react';
import { XMarkIcon, LinkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';
import useInvoicePenagihanAutocomplete from '../../hooks/useInvoicePenagihanAutocomplete';

const MutasiBankAssignDocumentModal = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  mutation,
}) => {
  const [invoicePenagihanId, setInvoicePenagihanId] = useState('');
  
  const {
    options: invoiceOptions,
    loading: invoiceLoading,
    fetchOptions: searchInvoices,
  } = useInvoicePenagihanAutocomplete({
    selectedValue: invoicePenagihanId,
    initialFetch: false,
  });

  useEffect(() => {
    if (open) {
      setInvoicePenagihanId('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!invoicePenagihanId.trim()) {
      return;
    }
    onSubmit?.({
      invoicePenagihanId: invoicePenagihanId.trim(),
    });
  };

  const handleInvoiceChange = (event) => {
    const value = event?.target ? event.target.value : event || '';
    setInvoicePenagihanId(value);
  };

  const hasDocument = Boolean(
    mutation?.invoicePenagihanId ||
    mutation?.invoicePengirimanId ||
    mutation?.tandaTerimaFakturId
  );

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4'>
      <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Kaitkan Dokumen
            </h2>
            <p className='text-sm text-gray-500'>
              Pilih Invoice Penagihan yang akan dikaitkan dengan mutasi bank.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md p-2 hover:bg-gray-100'
            aria-label='Tutup'
            disabled={loading}
          >
            <XMarkIcon className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='px-6 py-5 space-y-5'>
          <div className='rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700'>
            <LinkIcon className='h-5 w-5 inline mr-2' />
            <span>
              Setelah dikaitkan, status mutasi otomatis menjadi{' '}
              <strong>MATCHED</strong>.
            </span>
          </div>

          {hasDocument ? (
            <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800'>
              <p className='font-semibold'>Perhatian:</p>
              <p className='mt-1'>
                Mutasi ini sudah memiliki dokumen terkait. Kaitan baru akan
                menggantikan dokumen sebelumnya.
              </p>
            </div>
          ) : null}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Invoice Penagihan
            </label>
            <Autocomplete
              options={invoiceOptions}
              value={invoicePenagihanId || ''}
              onChange={handleInvoiceChange}
              placeholder='Cari Invoice Penagihan'
              displayKey='label'
              valueKey='id'
              name='invoicePenagihanId'
              loading={invoiceLoading || loading}
              onSearch={searchInvoices}
              showId
              required
            />
            <p className='mt-1 text-xs text-gray-500'>
              Sistem akan secara otomatis mengaitkan Invoice Pengiriman terkait jika ada.
            </p>
          </div>

          {mutation && !hasDocument ? (
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600'>
              <p className='font-semibold text-gray-800'>
                Mutasi terkait:
              </p>
              <p className='mt-1'>
                {mutation?.reference_number ||
                  mutation?.referenceNumber ||
                  mutation?.description ||
                  'Referensi tidak tersedia'}
              </p>
            </div>
          ) : null}

          <div className='flex items-center justify-between border-t border-gray-200 pt-4'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading}
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-60'
            >
              Batal
            </button>
            <button
              type='submit'
              disabled={loading || !invoicePenagihanId.trim()}
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300'
            >
              {loading ? 'Memproses...' : 'Kaitkan Dokumen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MutasiBankAssignDocumentModal;

