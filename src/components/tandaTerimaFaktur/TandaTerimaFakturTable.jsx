import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';
import { formatCurrency, formatDate } from '@/utils/formatUtils';

const TandaTerimaFakturTable = ({
  tandaTerimaFakturs,
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
  const data = Array.isArray(tandaTerimaFakturs) ? tandaTerimaFakturs : [];
  const isEmpty = data.length === 0;
  const actionDisabled = Boolean(loading);
  const trimmedQuery = typeof searchQuery === 'string' ? searchQuery.trim() : '';
  const showEmptyState = isEmpty && !loading;
  const emptyMessage =
    hasActiveFilters || trimmedQuery
      ? 'Tanda terima faktur tidak ditemukan.'
      : 'Belum ada data tanda terima faktur.';

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Tanggal
            </th>
            <th className='px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              TOP
            </th>
            <th className='px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Group Customer
            </th>
            <th className='px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Company
            </th>
            <th className='px-3 py-2 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              Grand Total
            </th>
            <th className='px-3 py-2 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {showEmptyState ? (
            <tr>
              <td colSpan={6} className='px-3 py-4 text-center text-sm text-gray-500'>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className='hover:bg-gray-50'>
                <td className='px-3 py-2 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>{formatDate(item.tanggal)}</div>
                </td>
                <td className='px-3 py-2 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item?.termOfPayment?.kode_top || '-'}
                  </div>
                  {item?.termOfPayment?.batas_hari != null && (
                    <div className='text-xs text-gray-500'>
                      {item.termOfPayment.batas_hari} hari
                    </div>
                  )}
                </td>
                <td className='px-3 py-2 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item?.groupCustomer?.nama_group ||
                      item?.groupCustomer?.namaGroup ||
                      '-'}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {item?.groupCustomer?.kode_group ||
                      item?.groupCustomer?.kodeGroup ||
                      '-'}
                  </div>
                </td>
                <td className='px-3 py-2 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item?.company?.nama_perusahaan || '-'}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {item?.company?.kode_company || item?.code_supplier || '-'}
                  </div>
                </td>
                <td className='px-3 py-2 whitespace-nowrap text-right'>
                  <div className='text-sm font-medium text-gray-900'>
                    {formatCurrency(item.grand_total)}
                  </div>
                </td>
                <td className='px-3 py-2 text-sm font-medium text-right whitespace-nowrap'>
                  <div className='flex justify-end space-x-1'>
                    <button
                      onClick={() => onView?.(item)}
                      className='p-1 text-indigo-600 hover:text-indigo-900 disabled:text-indigo-300'
                      title='Lihat detail'
                      disabled={actionDisabled}
                    >
                      <EyeIcon className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => onEdit?.(item)}
                      className='p-1 text-indigo-600 hover:text-indigo-900 disabled:text-indigo-300'
                      title='Edit'
                      disabled={actionDisabled}
                    >
                      <PencilIcon className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => onDelete?.(item)}
                      className='p-1 text-red-600 hover:text-red-900 disabled:text-red-300'
                      title='Hapus'
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
              <td colSpan={6} className='px-3 py-4 text-center text-sm text-gray-500'>
                <div className='flex items-center justify-center space-x-2'>
                  <div className='w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                  <span>Memuat data...</span>
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

export default TandaTerimaFakturTable;
