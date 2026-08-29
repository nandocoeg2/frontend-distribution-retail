import React, { useEffect, useState } from 'react';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import authService from '../../services/authService';

const MutasiBankUploadModal = ({
  open,
  onClose,
  onUpload,
  uploading = false,
}) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);

  useEffect(() => {
    if (open) {
      const currentCompany = authService.getCompanyData();
      setCompany(currentCompany);
    } else {
      setFile(null);
      setError('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    setFile(selectedFile || null);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Silakan pilih file mutasi bank.');
      return;
    }

    try {
      await onUpload?.(file);
      setFile(null);
    } catch (submitError) {
      const serverMessage =
        submitError?.response?.data?.message ||
        submitError?.message ||
        'Gagal mengunggah file mutasi bank. Coba lagi.';
      setError(serverMessage);
    }
  };

  const hasAccountNumber = Boolean(company?.no_rekening);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4'>
      <div className='w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Unggah Mutasi Bank
            </h2>
            <p className='text-sm text-gray-500'>
              Unggah file mutasi (.xlsx, .xls, atau .csv) untuk rekening perusahaan aktif.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md p-2 hover:bg-gray-100'
            aria-label='Tutup'
            disabled={uploading}
          >
            <XMarkIcon className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='px-6 py-5 space-y-5'>
          {/* Company Bank Account Info Banner */}
          <div className='rounded-lg border border-blue-100 bg-blue-50/70 p-4'>
            <div className='flex items-start gap-3'>
              <BuildingOfficeIcon className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
              <div className='text-sm text-gray-700 flex-1'>
                <div className='font-semibold text-gray-900 mb-1'>
                  Perusahaan Aktif: {company?.nama_perusahaan || company?.nama || 'Perusahaan Saat Ini'}
                </div>
                <div className='grid grid-cols-2 gap-2 text-xs text-gray-600'>
                  <div>
                    <span className='font-medium text-gray-700'>Bank:</span>{' '}
                    {company?.bank || '-'}
                  </div>
                  <div>
                    <span className='font-medium text-gray-700'>No. Rekening:</span>{' '}
                    <span className='font-mono font-bold text-blue-900'>
                      {company?.no_rekening || 'Belum diatur'}
                    </span>
                  </div>
                </div>
                <p className='mt-2 text-[11px] text-blue-700 leading-relaxed'>
                  * File mutasi yang diunggah harus memuat nomor rekening yang sama dengan rekening perusahaan aktif di atas.
                </p>
              </div>
            </div>
          </div>

          {!hasAccountNumber && (
            <div className='flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800'>
              <ExclamationTriangleIcon className='h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0' />
              <span>
                Perusahaan aktif belum memiliki data nomor rekening. Harap lengkapi profil perusahaan terlebih dahulu sebelum mengunggah mutasi.
              </span>
            </div>
          )}

          <div>
            <label
              htmlFor='mutasiBankFile'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Pilih File
            </label>
            <label
              className='flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors'
            >
              <ArrowUpTrayIcon className='h-8 w-8 text-blue-500 mb-2' />
              <span className='text-sm font-medium text-blue-600'>
                {file ? file.name : 'Klik untuk memilih file'}
              </span>
              <span className='mt-1 text-xs text-gray-500'>
                Format yang didukung: .xlsx, .xls, .csv (maks. 10 MB)
              </span>
              <input
                id='mutasiBankFile'
                name='mutasiBankFile'
                type='file'
                accept='.xlsx,.xls,.csv'
                onChange={handleFileChange}
                className='hidden'
                disabled={uploading}
              />
            </label>
            {error ? (
              <div className='mt-3 flex items-start gap-2 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200'>
                <ExclamationTriangleIcon className='h-4 w-4 text-red-600 mt-0.5 flex-shrink-0' />
                <span className='font-medium'>{error}</span>
              </div>
            ) : null}
          </div>

          <div className='flex items-center justify-between border-t border-gray-200 pt-4'>
            <button
              type='button'
              onClick={onClose}
              disabled={uploading}
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-60'
            >
              Batal
            </button>
            <button
              type='submit'
              disabled={uploading || !hasAccountNumber}
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300'
            >
              {uploading ? 'Mengunggah...' : 'Unggah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MutasiBankUploadModal;
