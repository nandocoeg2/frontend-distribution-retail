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
  onGenerateKwitansi,
  generatingInvoiceId,
  onGenerateTandaTerimaFaktur,
  generatingTandaTerimaInvoiceId,
  onGenerateFakturPajak,
  generatingFakturInvoiceId,
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
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase'>
              Generate Kwitansi
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase'>
              Generate Tanda Terima Faktur
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase'>
              Generate Faktur Pajak
            </th>
            <th className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {data.length === 0 ? (
            <tr>
              <td colSpan='9' className='px-6 py-4 text-center text-gray-500'>
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
                <td className='px-6 py-4 text-center whitespace-nowrap'>
                  <div className='flex flex-col items-center justify-center space-y-1'>
                    <div className='flex items-center space-x-2'>
                      {generatingInvoiceId === invoice.id ? (
                        <span className='w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin'></span>
                      ) : null}
                      <input
                        type='checkbox'
                        className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50'
                        checked={Boolean(
                          invoice?.kwitansiId || invoice?.kwitansi?.id
                        )}
                        onChange={(event) => {
                          if (event.target.checked && onGenerateKwitansi) {
                            onGenerateKwitansi(invoice);
                          }
                        }}
                        disabled={
                          Boolean(invoice?.kwitansiId || invoice?.kwitansi?.id) ||
                          generatingInvoiceId === invoice.id
                        }
                        aria-label='Generate kwitansi untuk invoice ini'
                      />
                    </div>
                    {invoice?.kwitansi?.no_kwitansi || invoice?.kwitansiId ? (
                      <span className='text-xs text-gray-500'>
                        {invoice?.kwitansi?.no_kwitansi || invoice?.kwitansiId}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className='px-6 py-4 text-center whitespace-nowrap'>
                  <div className='flex flex-col items-center justify-center space-y-1'>
                    <div className='flex items-center space-x-2'>
                      {generatingTandaTerimaInvoiceId === invoice.id ? (
                        <span className='w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin'></span>
                      ) : null}
                      <input
                        type='checkbox'
                        className='w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50'
                        checked={Boolean(
                          invoice?.tandaTerimaFakturId ||
                            invoice?.tandaTerimaFaktur?.id
                        )}
                        onChange={(event) => {
                          if (
                            event.target.checked &&
                            onGenerateTandaTerimaFaktur
                          ) {
                            onGenerateTandaTerimaFaktur(invoice);
                          }
                        }}
                        disabled={
                          Boolean(
                            invoice?.tandaTerimaFakturId ||
                              invoice?.tandaTerimaFaktur?.id
                          ) || generatingTandaTerimaInvoiceId === invoice.id
                        }
                        aria-label='Generate tanda terima faktur untuk invoice ini'
                      />
                    </div>
                    {invoice?.tandaTerimaFaktur?.code_supplier ||
                    invoice?.tandaTerimaFaktur?.id ||
                    invoice?.tandaTerimaFakturId ? (
                      <span className='text-xs text-gray-500'>
                        {invoice?.tandaTerimaFaktur?.code_supplier ||
                          invoice?.tandaTerimaFaktur?.id ||
                          invoice?.tandaTerimaFakturId}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className='px-6 py-4 text-center whitespace-nowrap'>
                  <div className='flex flex-col items-center justify-center space-y-1'>
                    <div className='flex items-center space-x-2'>
                      {generatingFakturInvoiceId === invoice.id ? (
                        <span className='w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin'></span>
                      ) : null}
                      <input
                        type='checkbox'
                        className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50'
                        checked={Boolean(
                          invoice?.fakturPajakId || invoice?.fakturPajak?.id
                        )}
                        onChange={(event) => {
                          if (event.target.checked && onGenerateFakturPajak) {
                            onGenerateFakturPajak(invoice);
                          }
                        }}
                        disabled={
                          Boolean(
                            invoice?.fakturPajakId || invoice?.fakturPajak?.id
                          ) || generatingFakturInvoiceId === invoice.id
                        }
                        aria-label='Generate faktur pajak untuk invoice ini'
                      />
                    </div>
                    {invoice?.fakturPajak?.no_pajak || invoice?.fakturPajakId ? (
                      <span className='text-xs text-gray-500'>
                        {invoice?.fakturPajak?.no_pajak || invoice?.fakturPajakId}
                      </span>
                    ) : null}
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

export default InvoicePenagihanTable;

