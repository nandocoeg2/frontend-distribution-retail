import React, { useEffect, useMemo, useState } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'VALID', label: 'Valid' },
  { value: 'INVALID', label: 'Invalid' },
];

const INVALID_NOTES_MIN_LENGTH = 5;

const hasLinkedDocument = (mutation) => {
  if (!mutation) return false;
  return Boolean(
    mutation.invoicePenagihanId ||
      mutation.invoicePengirimanId ||
      mutation.tandaTerimaFakturId ||
      mutation.invoicePenagihan ||
      mutation.invoicePengiriman ||
      mutation.tandaTerimaFaktur
  );
};

const MutasiBankValidateModal = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  mutation,
  initialStatus = 'VALID',
  selectedCount = 1,
  submitError = null,
  onRequestAssignDocument,
}) => {
  const [status, setStatus] = useState(initialStatus || 'VALID');
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(initialStatus || 'VALID');
      setNotes('');
      setTouched(false);
    }
  }, [open, initialStatus]);

  const isBulkValidation = selectedCount > 1;
  const linked = useMemo(() => hasLinkedDocument(mutation), [mutation]);

  // Mirror backend guards for instant feedback
  const validationError = useMemo(() => {
    if (status === 'VALID' && !isBulkValidation && !linked) {
      return {
        field: 'status',
        message:
          'Mutasi belum terhubung ke dokumen apa pun. Assign Invoice Penagihan / Pengiriman / TTF terlebih dahulu sebelum memvalidasi sebagai VALID.',
      };
    }
    if (status === 'INVALID' && notes.trim().length < INVALID_NOTES_MIN_LENGTH) {
      return {
        field: 'notes',
        message: `Catatan wajib diisi minimal ${INVALID_NOTES_MIN_LENGTH} karakter saat menandai mutasi sebagai INVALID.`,
      };
    }
    return null;
  }, [status, notes, linked, isBulkValidation]);

  const showValidationError = touched && validationError;
  const isSubmitDisabled = loading || Boolean(validationError);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (validationError) {
      return;
    }
    onSubmit?.({ status, notes });
  };

  const handleAssignFromBanner = () => {
    if (onRequestAssignDocument) {
      onRequestAssignDocument(mutation);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4'>
      <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Validasi Mutasi Bank
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

        <form onSubmit={handleSubmit} className='px-6 py-5 space-y-4'>
          {/* Server-side error (e.g. 409 conflict that survived client guards) */}
          {submitError ? (
            <div className='flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800'>
              <ExclamationTriangleIcon className='h-5 w-5 flex-shrink-0 mt-0.5' />
              <div>
                <p className='font-semibold'>Gagal menyimpan validasi</p>
                <p className='mt-0.5'>{submitError}</p>
              </div>
            </div>
          ) : null}

          {/* Warning when picking VALID without linked document */}
          {!isBulkValidation && status === 'VALID' && !linked ? (
            <div className='flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800'>
              <InformationCircleIcon className='h-5 w-5 flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='font-semibold'>Belum ada dokumen ter-link</p>
                <p className='mt-0.5'>
                  Mutasi ini belum terhubung ke Invoice Penagihan / Pengiriman /
                  Tanda Terima Faktur. Validasi VALID akan ditolak server.
                </p>
                {onRequestAssignDocument ? (
                  <button
                    type='button'
                    onClick={handleAssignFromBanner}
                    disabled={loading}
                    className='mt-2 inline-flex items-center rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100'
                  >
                    Assign Dokumen Sekarang
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Status Validasi
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setTouched(true);
              }}
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
              Catatan
              {status === 'INVALID' ? (
                <span className='text-red-600 ml-0.5'>*</span>
              ) : (
                <span className='text-gray-400 font-normal'> (Opsional)</span>
              )}
            </label>
            <textarea
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setTouched(true);
              }}
              rows={4}
              placeholder={
                status === 'INVALID'
                  ? `Wajib (minimal ${INVALID_NOTES_MIN_LENGTH} karakter). Contoh: "Transfer salah, sudah refund."`
                  : 'Tambahkan catatan validasi apabila diperlukan'
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                showValidationError && validationError.field === 'notes'
                  ? 'border-red-300'
                  : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {status === 'INVALID' ? (
              <p className='mt-1 text-xs text-gray-500'>
                {notes.trim().length}/{INVALID_NOTES_MIN_LENGTH}+ karakter
              </p>
            ) : null}
          </div>

          {/* Inline form-level validation error */}
          {showValidationError ? (
            <p className='text-sm text-red-600'>{validationError.message}</p>
          ) : null}

          {mutation && !isBulkValidation ? (
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600'>
              <p className='font-semibold text-gray-800'>
                Mutasi terkait dokumen:
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
              disabled={isSubmitDisabled}
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed'
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
