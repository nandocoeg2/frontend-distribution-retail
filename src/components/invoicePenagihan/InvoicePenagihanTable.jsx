import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import Pagination from '../common/Pagination';

const InvoicePenagihanTable = ({
  invoices,
  pagination,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onView,
  searchQuery,
}) => {
  const data = Array.isArray(invoices) ? invoices : [];

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              No Invoice
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Tanggal
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Kepada
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Grand Total
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
              Status
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {data.length === 0 ? (
            <tr>
              <td colSpan='6' className='px-6 py-4 text-center text-gray-500'>
                {searchQuery
                  ? 'Invoice penagihan tidak ditemukan.'
                  : 'Belum ada data invoice penagihan.'}
              </td>
            </tr>
          ) : (
            data.map((invoice) => (
              <tr key={invoice.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {invoice.no_invoice_penagihan || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {formatDate(invoice.tanggal)}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {invoice.kepada || invoice?.purchaseOrder?.customer?.namaCustomer || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {formatCurrency(invoice.grand_total)}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className='inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-blue-100 text-blue-800'>
                    {invoice?.status?.status_name || 'Belum Ditentukan'}
                  </span>
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

export default InvoicePenagihanTable;

