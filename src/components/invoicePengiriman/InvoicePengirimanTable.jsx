import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import Pagination from '../common/Pagination';

const InvoicePengirimanTable = ({
  invoices,
  pagination,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onView,
  searchQuery,
  onTogglePenagihan,
  creatingPenagihanId,
}) => {
  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase'>
              Penagihan
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              No Invoice
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Tanggal
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Tujuan Pengiriman
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Grand Total
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan='6' className='px-6 py-4 text-center text-gray-500'>
                {searchQuery
                  ? 'Invoice pengiriman tidak ditemukan.'
                  : 'Belum ada data invoice pengiriman.'}
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice.id} className='hover:bg-gray-50'>
                <td className='px-4 py-4 text-center whitespace-nowrap'>
                  <div className='flex items-center justify-center'>
                    {creatingPenagihanId === invoice.id ? (
                      <span className='inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></span>
                    ) : (
                      <input
                        type='checkbox'
                        className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed'
                        checked={Boolean(invoice.invoicePenagihanId)}
                        disabled={
                          Boolean(invoice.invoicePenagihanId) ||
                          !onTogglePenagihan
                        }
                        onChange={() => {
                          if (!invoice.invoicePenagihanId && onTogglePenagihan) {
                            onTogglePenagihan(invoice);
                          }
                        }}
                      />
                    )}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {invoice.no_invoice}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {formatDate(invoice.tanggal)}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {invoice.deliver_to || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {formatCurrency(invoice.grand_total)}
                  </div>
                </td>
                <td className='px-6 py-4 text-sm font-medium text-right whitespace-nowrap'>
                  <div className='flex justify-end space-x-2'>
                    <button
                      onClick={() => onView(invoice)}
                      className='p-1 text-indigo-600 hover:text-indigo-900'
                      title='Lihat detail'
                    >
                      <EyeIcon className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => onEdit(invoice)}
                      className='p-1 text-indigo-600 hover:text-indigo-900'
                      title='Ubah'
                    >
                      <PencilIcon className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => onDelete(invoice.id)}
                      className='p-1 text-red-600 hover:text-red-900'
                      title='Hapus'
                    >
                      <TrashIcon className='w-4 h-4' />
                    </button>
                  </div>
                </td>
              </tr>
            ))
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

export default InvoicePengirimanTable;
