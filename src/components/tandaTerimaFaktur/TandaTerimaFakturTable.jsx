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
  const trimmedQuery =
    typeof searchQuery === 'string' ? searchQuery.trim() : '';
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
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Kode Supplier
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Tanggal
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Customer
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Company
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Grand Total
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Status
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Term of Payment
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
                colSpan={8}
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
                    {item.code_supplier || '-'}
                  </div>
                  <div className='text-xs text-gray-500'>
                    ID: {item.id || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {formatDate(item.tanggal)}
                  </div>
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
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item?.company?.company_name || '-'}
                  </div>
                  {item?.company?.company_code && (
                    <div className='text-xs text-gray-500'>
                      {item.company.company_code}
                    </div>
                  )}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {formatCurrency(item.grand_total)}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className='inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-green-100 text-green-800'>
                    {item?.status?.status_code || 'Belum Ditentukan'}
                  </span>
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
                      title='Lihat detail tanda terima faktur'
                      disabled={actionDisabled}
                    >
                      <EyeIcon className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => onEdit?.(item)}
                      className='p-1 text-indigo-600 hover:text-indigo-900 disabled:text-indigo-300'
                      title='Ubah tanda terima faktur'
                      disabled={actionDisabled}
                    >
                      <PencilIcon className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => onDelete?.(item.id)}
                      className='p-1 text-red-600 hover:text-red-900 disabled:text-red-300'
                      title='Hapus tanda terima faktur'
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
                colSpan={8}
                className='px-6 py-6 text-center text-sm text-gray-500'
              >
                <div className='flex items-center justify-center space-x-2'>
                  <div className='w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                  <span>Memuat data tanda terima faktur...</span>
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
