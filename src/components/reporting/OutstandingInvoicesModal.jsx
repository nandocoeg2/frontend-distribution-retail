import React, { useState, useMemo, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge.jsx';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

const formatNumber = (value) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat('id-ID').format(num);
};

const OutstandingInvoicesModal = ({
  show,
  onClose,
  invoices = [],
  totalAmount = 0,
  totalCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (show) {
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [show]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  // Filter invoices by customer name, company name, invoice number, or PO number
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase().trim();

    return invoices.filter((item) => {
      const customer = item.customerName || '';
      const company = item.companyName || '';
      const invoiceNo = item.noInvoice || '';
      const poNo = item.poNumber || '';

      return (
        customer.toLowerCase().includes(q) ||
        company.toLowerCase().includes(q) ||
        invoiceNo.toLowerCase().includes(q) ||
        poNo.toLowerCase().includes(q)
      );
    });
  }, [invoices, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/60 to-orange-50/40'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-amber-100 rounded-xl text-amber-600'>
              <BanknotesIcon className='w-6 h-6' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                Daftar Invoice Menunggu Pembayaran (Outstanding)
              </h2>
              <p className='text-xs text-gray-500'>
                Daftar tagihan yang belum lunas pada periode ini
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-700'
            aria-label='Tutup'
          >
            <XMarkIcon className='w-5 h-5' />
          </button>
        </div>

        {/* Summary Card Banner */}
        <div className='px-6 py-3 bg-amber-50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <span className='text-xs font-semibold text-amber-800 uppercase tracking-wider'>
              Total Nilai Outstanding:
            </span>
            <span className='ml-2 text-base font-bold text-amber-900'>
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className='text-xs font-medium text-amber-800'>
            {formatNumber(totalCount || invoices.length)} invoice menunggu pembayaran
          </div>
        </div>

        {/* Search */}
        <div className='p-4 border-b border-gray-100 bg-white flex items-center justify-between'>
          <div className='relative w-full sm:w-80'>
            <MagnifyingGlassIcon className='absolute left-3 top-2.5 w-4 h-4 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder='Cari nama customer, invoice, atau PO...'
              className='w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition'
            />
          </div>
          {searchQuery && (
            <button
              type='button'
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className='text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1'
            >
              Reset Pencarian
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className='flex-1 overflow-y-auto min-h-[300px] max-h-[50vh] p-6'>
          {paginatedList.length > 0 ? (
            <div className='overflow-x-auto rounded-xl border border-gray-200'>
              <table className='w-full text-left text-sm divide-y divide-gray-200'>
                <thead className='bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  <tr>
                    <th scope='col' className='px-4 py-3 w-16 text-center'>
                      No
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      Customer
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      No. Invoice
                    </th>
                    <th scope='col' className='px-4 py-3'>
                      Tanggal
                    </th>
                    <th scope='col' className='px-6 py-3 text-right'>
                      Nominal Outstanding
                    </th>
                    <th scope='col' className='px-4 py-3 text-center'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 bg-white'>
                  {paginatedList.map((item, index) => {
                    const rowNumber =
                      (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr
                        key={item.id || item.noInvoice || index}
                        className='hover:bg-amber-50/30 transition-colors'
                      >
                        <td className='px-4 py-3.5 text-center text-xs font-medium text-gray-500'>
                          {rowNumber}
                        </td>
                        <td className='px-6 py-3.5'>
                          <div className='font-semibold text-gray-900'>
                            {item.customerName || 'Customer Tidak Diketahui'}
                          </div>
                          {item.companyName && item.companyName !== '-' && (
                            <div className='flex items-center text-xs text-gray-500 mt-0.5'>
                              <BuildingOfficeIcon className='w-3.5 h-3.5 mr-1 text-gray-400' />
                              <span>{item.companyName}</span>
                            </div>
                          )}
                        </td>
                        <td className='px-6 py-3.5'>
                          <div className='font-medium text-gray-800'>
                            {item.noInvoice || '-'}
                          </div>
                          {item.poNumber && (
                            <div className='text-xs text-gray-500 mt-0.5'>
                              PO: {item.poNumber}
                            </div>
                          )}
                        </td>
                        <td className='px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap'>
                          {item.date ? formatDate(item.date) : '-'}
                        </td>
                        <td className='px-6 py-3.5 text-right font-semibold text-amber-700 whitespace-nowrap'>
                          {formatCurrency(item.amount)}
                        </td>
                        <td className='px-4 py-3.5 text-center'>
                          <StatusBadge
                            status={
                              item.statusName ||
                              item.statusCode ||
                              'Menunggu Pembayaran'
                            }
                            variant='warning'
                            size='sm'
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-48 text-center text-gray-400'>
              <BanknotesIcon className='w-12 h-12 stroke-1 mb-2 text-gray-300' />
              <p className='text-sm font-medium text-gray-600'>
                Tidak ada invoice outstanding
              </p>
              <p className='text-xs text-gray-400 mt-1'>
                {searchQuery
                  ? 'Coba sesuaikan kata kunci pencarian Anda'
                  : 'Semua invoice pada periode ini telah lunas'}
              </p>
            </div>
          )}
        </div>

        {/* Footer & Pagination */}
        <div className='flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 gap-3'>
          <div className='text-xs text-gray-500'>
            Menampilkan{' '}
            <span className='font-semibold text-gray-700'>
              {filteredList.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            -{' '}
            <span className='font-semibold text-gray-700'>
              {Math.min(currentPage * itemsPerPage, filteredList.length)}
            </span>{' '}
            dari{' '}
            <span className='font-semibold text-gray-700'>
              {filteredList.length}
            </span>{' '}
            invoice
          </div>

          <div className='flex items-center space-x-2'>
            {totalPages > 1 && (
              <div className='flex items-center space-x-1'>
                <button
                  type='button'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className='px-2.5 py-1 text-xs font-medium border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white'
                >
                  Sebelumnya
                </button>
                <span className='text-xs px-2 text-gray-600'>
                  {currentPage} / {totalPages}
                </span>
                <button
                  type='button'
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className='px-2.5 py-1 text-xs font-medium border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white'
                >
                  Selanjutnya
                </button>
              </div>
            )}
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition'
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutstandingInvoicesModal;
