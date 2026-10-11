import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const formatDisplayDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

/**
 * Popup "Indikasi PO Pengganti" (tanggal pesan sama dengan tanggal kirim).
 *  - Iya   -> PO dimasukkan ke sistem dan bisa diproses sampai packing
 *  - Tidak -> PO tidak masuk ke sistem
 *
 * @param {boolean} show
 * @param {{ filename?: string, poNumber?: string, poDate?: string, deliveryDate?: string }} item
 * @param {number} remaining - jumlah PO lain yang masih antre setelah yang ini
 * @param {boolean} loading
 * @param {function} onYes
 * @param {function} onNo
 */
const IndikasiPenggantiDialog = ({
  show,
  item,
  remaining = 0,
  loading = false,
  onYes,
  onNo,
}) => {
  if (!show || !item) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-lg w-full mx-4'>
        <div className='flex items-center p-6 border-b border-gray-200'>
          <div className='flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4'>
            <ExclamationTriangleIcon className='w-8 h-8 text-yellow-600' />
          </div>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Indikasi PO Pengganti
            </h3>
            {remaining > 0 && (
              <p className='text-xs text-gray-500'>
                {remaining} PO lain menunggu konfirmasi
              </p>
            )}
          </div>
        </div>

        <div className='p-6 space-y-4'>
          <p className='text-gray-700 leading-relaxed'>
            PO ini terdeteksi sebagai <strong>Indikasi PO Pengganti</strong>{' '}
            karena tanggal pesan sama dengan tanggal kirim. Apakah PO ini tetap
            diproses?
          </p>

          <div className='grid grid-cols-3 gap-2 text-sm bg-gray-50 border border-gray-200 rounded-md p-3'>
            <div className='text-gray-500'>No. PO</div>
            <div className='col-span-2 font-semibold break-all'>
              {item.poNumber || '-'}
            </div>
            {item.filename && (
              <>
                <div className='text-gray-500'>File</div>
                <div className='col-span-2 break-all'>{item.filename}</div>
              </>
            )}
            <div className='text-gray-500'>Tanggal Pesan</div>
            <div className='col-span-2'>{formatDisplayDate(item.poDate)}</div>
            <div className='text-gray-500'>Tanggal Kirim</div>
            <div className='col-span-2'>
              {formatDisplayDate(item.deliveryDate)}
            </div>
          </div>

          <ul className='text-sm text-gray-600 list-disc pl-5 space-y-1'>
            <li>
              <strong>Iya</strong>: PO masuk ke sistem dan bisa diproses sampai
              packing.
            </li>
            <li>
              <strong>Tidak</strong>: PO tidak masuk ke sistem.
            </li>
          </ul>
        </div>

        <div className='flex justify-end space-x-3 px-6 pb-6'>
          <button
            type='button'
            onClick={onNo}
            disabled={loading}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            Tidak
          </button>
          <button
            type='button'
            onClick={onYes}
            disabled={loading}
            className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {loading ? 'Memproses...' : 'Iya'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndikasiPenggantiDialog;
