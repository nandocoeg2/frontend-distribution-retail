import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';
import { formatCurrency, formatDate } from '@/utils/formatUtils';

const FakturPajakTable = ({
  fakturPajaks,
  pagination,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onView,
  loading,
  searchQuery,
  hasActiveFilters,
}) => {
  const data = Array.isArray(fakturPajaks) ? fakturPajaks : [];
  const isEmpty = data.length === 0;
  const actionDisabled = Boolean(loading);
  const showEmptyState = isEmpty && !loading;
  const emptyMessage =
    hasActiveFilters || (searchQuery && String(searchQuery).trim() !== '')
      ? 'Faktur pajak tidak ditemukan.'
      : 'Belum ada data faktur pajak.';

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Nomor Faktur
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Nomor Invoice
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Tanggal Invoice
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Nomor LPB
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Nama Customer
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              Total Harga Jual
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              Potongan Harga
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              Dasar Pengenaan Pajak
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              PPN Rupiah
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              TOP
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {showEmptyState ? (
            <tr>
              <td
                colSpan={11}
                className='px-6 py-6 text-center text-sm text-gray-500'
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {item.no_pajak || '-'}
                  </div>
                  {item.createdAt && (
                    <div className='text-xs text-gray-500'>
                      Dibuat {formatDate(item.createdAt)}
                    </div>
                  )}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item?.invoicePenagihan?.no_invoice || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {formatDate(item.tanggal_invoice)}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item?.laporanPenerimaanBarang?.no_lpb || '-'}
                  </div>
                  {item?.laporanPenerimaanBarang?.tanggal_terima && (
                    <div className='text-xs text-gray-500'>
                      {formatDate(
                        item.laporanPenerimaanBarang.tanggal_terima,
                      )}
                    </div>
                  )}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item?.customer?.nama_customer || '-'}
                  </div>
                  {item?.customer?.kode_customer && (
                    <div className='text-xs text-gray-500'>
                      {item.customer.kode_customer}
                    </div>
                  )}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right'>
                  <div className='text-sm text-gray-900'>
                    {formatCurrency(item.total_harga_jual)}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right'>
                  <div className='text-sm text-gray-900'>
                    {formatCurrency(item.potongan_harga)}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right'>
                  <div className='text-sm text-gray-900'>
                    {formatCurrency(item.dasar_pengenaan_pajak)}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right'>
                  <div className='text-sm text-gray-900'>
                    {formatCurrency(item.ppn_rp)}
                  </div>
                  {item.ppn_percentage != null && (
                    <div className='text-xs text-gray-500'>
                      {item.ppn_percentage}% dari DPP
                    </div>
                  )}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item?.termOfPayment?.name || '-'}
                  </div>
                  {item?.termOfPayment?.days != null && (
                    <div className='text-xs text-gray-500'>
                      {item.termOfPayment.days} hari
                    </div>
                  )}
                </td>
                <td className='px-6 py-4 text-sm font-medium text-right whitespace-nowrap'>
                  <div className='flex justify-end space-x-2'>
                    <button
                      onClick={() => onView?.(item)}
                      className='p-1 text-indigo-600 hover:text-indigo-900 disabled:text-indigo-300'
                      title='Lihat detail faktur pajak'
                      disabled={actionDisabled}
                    >
                      <EyeIcon className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => onEdit?.(item)}
                      className='p-1 text-indigo-600 hover:text-indigo-900 disabled:text-indigo-300'
                      title='Ubah faktur pajak'
                      disabled={actionDisabled}
                    >
                      <PencilIcon className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => onDelete?.(item.id)}
                      className='p-1 text-red-600 hover:text-red-900 disabled:text-red-300'
                      title='Hapus faktur pajak'
                      disabled={actionDisabled}
                    >
                      <TrashIcon className='w-4 h-4' />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          {loading && (
            <tr>
              <td
                colSpan={11}
                className='px-6 py-6 text-center text-sm text-gray-500'
              >
                <div className='flex items-center justify-center space-x-2'>
                  <div className='w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                  <span>Memuat data faktur pajak...</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </div>
  );
};

export default FakturPajakTable;
