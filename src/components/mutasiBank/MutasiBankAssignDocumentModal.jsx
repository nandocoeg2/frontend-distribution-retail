import React, { useEffect, useState, useMemo } from 'react';
import {
  XMarkIcon,
  LinkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';
import useTandaTerimaFakturAutocomplete from '../../hooks/useTandaTerimaFakturAutocomplete';
import { formatCurrency } from '../../utils/formatUtils';

const MutasiBankAssignDocumentModal = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  mutation,
  submitError = null,
}) => {
  const [tandaTerimaFakturId, setTandaTerimaFakturId] = useState('');

  const {
    options: ttfOptions,
    loading: ttfLoading,
    fetchOptions: searchTTF,
  } = useTandaTerimaFakturAutocomplete({
    selectedValue: tandaTerimaFakturId,
    initialFetch: true,
  });

  useEffect(() => {
    if (open) {
      setTandaTerimaFakturId('');
      searchTTF('');
    }
  }, [open, searchTTF]);

  const selectedTtfOption = useMemo(
    () => ttfOptions.find((opt) => String(opt.id) === String(tandaTerimaFakturId)),
    [ttfOptions, tandaTerimaFakturId]
  );

  const mutationAmount = Number(mutation?.jumlah || mutation?.amount || 0);
  const ttfGross = Number(selectedTtfOption?.raw?.grand_total || 0);
  const ttfRetur = Array.isArray(selectedTtfOption?.raw?.notaReturs)
    ? selectedTtfOption.raw.notaReturs.reduce((sum, nr) => sum + Number(nr.nominal || 0), 0)
    : 0;
  const ttfNet = ttfGross - ttfRetur;
  const targetTtfAmount = ttfNet > 0 ? ttfNet : ttfGross;
  const amountDiff = Math.abs(mutationAmount - targetTtfAmount);
  const hasAmountMismatch = Boolean(selectedTtfOption && mutationAmount > 0 && targetTtfAmount > 0 && amountDiff > 1000);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!tandaTerimaFakturId.trim()) {
      return;
    }
    onSubmit?.({
      tandaTerimaFakturId: tandaTerimaFakturId.trim(),
    });
  };

  const handleTTFChange = (event) => {
    const value = event?.target ? event.target.value : event || '';
    setTandaTerimaFakturId(value);
  };

  const hasDocument = Boolean(
    mutation?.tandaTerimaFakturId ||
    mutation?.invoicePenagihanId ||
    mutation?.invoicePengirimanId
  );

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4'>
      <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Kaitkan Dokumen
            </h2>
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

          {submitError ? (
            <div className='flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800'>
              <ExclamationTriangleIcon className='h-5 w-5 flex-shrink-0 mt-0.5' />
              <div>
                <p className='font-semibold'>Gagal mengaitkan dokumen</p>
                <p className='mt-0.5'>{submitError}</p>
              </div>
            </div>
          ) : null}

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
              Tanda Terima Faktur (TTF)
            </label>
            <Autocomplete
              options={ttfOptions}
              value={tandaTerimaFakturId || ''}
              onChange={handleTTFChange}
              placeholder='Cari Tanda Terima Faktur (TTF)...'
              displayKey='label'
              valueKey='id'
              name='tandaTerimaFakturId'
              loading={ttfLoading || loading}
              onSearch={searchTTF}
              required
            />
          </div>

          {hasAmountMismatch ? (
            <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1'>
              <div className='flex items-center gap-1 font-semibold text-amber-900'>
                <ExclamationTriangleIcon className='h-4 w-4 flex-shrink-0' />
                <span>Peringatan Perbedaan Nominal:</span>
              </div>
              <p>
                Nominal mutasi: <strong>{formatCurrency(mutationAmount)}</strong>
              </p>
              <p>
                Nominal TTF {ttfRetur > 0 ? '(setelah retur)' : ''}: <strong>{formatCurrency(targetTtfAmount)}</strong> (Selisih: {formatCurrency(amountDiff)})
              </p>
              <p className='text-[11px] text-amber-700'>
                Pastikan dokumen yang dipilih sudah sesuai sebelum mengaitkan dokumen.
              </p>
            </div>
          ) : null}

          {mutation && !hasDocument ? (
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600'>
              <p className='font-semibold text-gray-800'>
                Mutasi terkait:
              </p>
              <p className='mt-1'>
                {mutation?.reference_number ||
                  mutation?.referenceNumber ||
                  mutation?.description ||
                  mutation?.keterangan ||
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
              disabled={loading || !tandaTerimaFakturId.trim()}
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

