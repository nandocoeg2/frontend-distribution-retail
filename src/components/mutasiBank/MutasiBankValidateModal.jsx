import React, { useEffect, useState } from 'react';
import { XMarkIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'VALID', label: 'Valid' },
  { value: 'INVALID', label: 'Invalid' },
];

const MutasiBankValidateModal = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  mutation,
  initialStatus = 'VALID',
  selectedCount = 1,
}) => {
  const [status, setStatus] = useState(initialStatus || 'VALID');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setStatus(initialStatus || 'VALID');
      setNotes('');
    }
  }, [open, initialStatus]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      status,
      notes,
    });
  };

  const isBulkValidation = selectedCount > 1;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4'>
      <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Validasi Mutasi Bank
            </h2>
            <p className='text-sm text-gray-500'>
              Tentukan hasil verifikasi mutasi bank yang dipilih.
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
            <CheckBadgeIcon className='h-5 w-5 inline mr-2' />
            {isBulkValidation ? (
              <span>
                Anda akan memvalidasi{' '}
                <strong>{selectedCount} mutasi bank</strong> sekaligus.
              </span>
            ) : (
              <span>
                Pastikan status sesuai dengan hasil verifikasi dokumen terkait.
              </span>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Status Validasi
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={loading}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder='Tambahkan catatan validasi apabila diperlukan'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={loading}
            />
          </div>

          {mutation && !isBulkValidation ? (
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600'>
              <p className='font-semibold text-gray-800'>
                Mutasi terkait dokumen:
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
              disabled={loading}
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300'
            >
              {loading ? 'Memproses...' : 'Simpan Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MutasiBankValidateModal;
