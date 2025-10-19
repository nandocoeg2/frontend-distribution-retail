import React from 'react';
import HeroIcon from '../atoms/HeroIcon.jsx';
import ReturnStatusBadge from './ReturnStatusBadge.jsx';
import { formatDateTime } from '@/utils/formatUtils';

const ReturnClassifyModal = ({
  open,
  onClose,
  returnItem,
  onConfirm,
  loading,
}) => {
  if (!open || !returnItem) {
    return null;
  }

  const {
    returnNumber,
    inventory,
    quantity,
    reason,
    status,
    createdAt,
  } = returnItem;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div className='w-full max-w-lg overflow-hidden bg-white rounded-lg shadow-xl'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Klasifikasi Retur
            </h2>
            <p className='text-sm text-gray-500'>
              Pilih tindakan untuk retur berikut.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 transition-colors hover:text-gray-600'
            aria-label='Tutup'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 6l12 12M6 18L18 6'
              />
            </svg>
          </button>
        </div>

        <div className='px-6 py-5 space-y-4'>
          <div className='p-4 bg-gray-50 rounded-lg'>
            <dl className='grid grid-cols-1 gap-3 text-sm md:grid-cols-2'>
              <div>
                <dt className='text-gray-500'>Nomor Retur</dt>
                <dd className='font-medium text-gray-900'>
                  {returnNumber || '-'}
                </dd>
              </div>
              <div>
                <dt className='text-gray-500'>Status Saat Ini</dt>
                <dd className='mt-1'>
                  <ReturnStatusBadge status={status} />
                </dd>
              </div>
              <div>
                <dt className='text-gray-500'>Produk</dt>
                <dd className='font-medium text-gray-900'>
                  {inventory?.nama_barang || inventory?.name || '-'}
                </dd>
              </div>
              <div>
                <dt className='text-gray-500'>Jumlah</dt>
                <dd className='font-medium text-gray-900'>
                  {quantity ?? '-'}
                </dd>
              </div>
              <div className='md:col-span-2'>
                <dt className='text-gray-500'>Alasan Retur</dt>
                <dd className='font-medium text-gray-900'>
                  {reason || '-'}
                </dd>
              </div>
              <div className='md:col-span-2'>
                <dt className='text-gray-500'>Dibuat Pada</dt>
                <dd className='font-medium text-gray-900'>
                  {formatDateTime(createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className='p-4 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg'>
            <p className='font-semibold'>Catatan:</p>
            <p className='mt-1 text-blue-700'>
              Pastikan tindakan yang dipilih sesuai dengan kondisi barang.
              &lsquo;Stok Ulang&apos; akan menambah stok barang di gudang, sementara
              &lsquo;Tolak&apos; menandakan barang tidak layak dijual kembali.
            </p>
          </div>
        </div>

        <div className='flex justify-between px-6 py-4 border-t border-gray-100 bg-gray-50'>
          <button
            type='button'
            onClick={onClose}
            disabled={loading}
            className='inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50'
          >
            Batal
          </button>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => onConfirm('reject')}
              disabled={loading}
              className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:opacity-60'
            >
              {loading ? (
                <span className='flex items-center'>
                  <span className='w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin'></span>
                  Memproses...
                </span>
              ) : (
                <>
                  <HeroIcon name='exclamation-circle' className='w-5 h-5 mr-2' />
                  Tolak
                </>
              )}
            </button>
            <button
              type='button'
              onClick={() => onConfirm('restock')}
              disabled={loading}
              className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:opacity-60'
            >
              {loading ? (
                <span className='flex items-center'>
                  <span className='w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin'></span>
                  Memproses...
                </span>
              ) : (
                <>
                  <HeroIcon name='check-circle' className='w-5 h-5 mr-2' />
                  Stok Ulang
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnClassifyModal;
