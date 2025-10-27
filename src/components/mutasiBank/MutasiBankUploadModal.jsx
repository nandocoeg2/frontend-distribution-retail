import React, { useEffect, useState } from 'react';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const MutasiBankUploadModal = ({
  open,
  onClose,
  onUpload,
  uploading = false,
}) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
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
      setError(
        submitError?.message || 'Gagal mengunggah file mutasi bank. Coba lagi.'
      );
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4'>
      <div className='w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Unggah Mutasi Bank
            </h2>
            <p className='text-sm text-gray-500'>
              Unggah file mutasi (.xlsx, .xls, atau .csv) untuk memulai proses
              rekonsiliasi.
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
              <p className='mt-2 text-sm text-red-600'>{error}</p>
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
              disabled={uploading}
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
