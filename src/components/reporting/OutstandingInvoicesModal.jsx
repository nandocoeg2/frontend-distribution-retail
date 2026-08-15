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

  useEffect(() => {
    if (show) {
      setSearchQuery('');
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

  // Filtered invoices
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

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='flex flex-col w-full max-w-4xl h-[640px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/60 to-orange-50/40 shrink-0'>
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
        <div className='px-6 py-3 bg-amber-50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-4 shrink-0'>
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
        <div className='p-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0'>
          <div className='relative w-full sm:w-80'>
            <MagnifyingGlassIcon className='absolute left-3 top-2.5 w-4 h-4 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Cari nama customer, invoice, atau PO...'
              className='w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition'
            />
          </div>
          {searchQuery && (
            <button
              type='button'
              onClick={() => setSearchQuery('')}
              className='text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1'
            >
              Reset Pencarian
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className='flex-1 overflow-y-auto p-4 bg-gray-50/30'>
          {filteredList.length > 0 ? (
            <div className='overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white'>
              <table className='w-full text-left text-xs border-collapse'>
                <thead className='bg-gray-100 text-gray-700 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'>
                  <tr>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-3 py-2 w-14 text-center border-r border-b border-gray-300 font-bold z-10'
                    >
                      NO
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 border-r border-b border-gray-300 font-bold z-10'
                    >
                      CUSTOMER
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 border-r border-b border-gray-300 font-bold z-10'
                    >
                      NO. INVOICE
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 border-r border-b border-gray-300 font-bold z-10'
                    >
                      TANGGAL
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 border-r border-b border-gray-300 font-bold text-right z-10'
                    >
                      NOMINAL OUTSTANDING
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 w-36 text-center border-b border-gray-300 font-bold z-10'
                    >
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white font-sans'>
                  {filteredList.map((item, index) => {
                    const rowNumber = index + 1;
                    return (
                      <tr
                        key={item.id || item.noInvoice || index}
                        className='hover:bg-amber-50/60 even:bg-gray-50/40 transition-colors'
                      >
                        <td className='px-3 py-2 text-center text-xs font-mono text-gray-500 border-r border-gray-200'>
                          {rowNumber}
                        </td>
                        <td className='px-4 py-2 font-semibold text-gray-900 border-r border-gray-200'>
                          <div>
                            {item.customerName || 'Customer Tidak Diketahui'}
                          </div>
                          {item.companyName && item.companyName !== '-' && (
                            <div className='text-[10px] text-gray-500 font-normal'>
                              {item.companyName}
                            </div>
                          )}
                        </td>
                        <td className='px-4 py-2 text-gray-800 border-r border-gray-200 font-medium'>
                          <div>{item.noInvoice || '-'}</div>
                          {item.poNumber && (
                            <div className='text-[10px] text-gray-500 font-normal'>
                              PO: {item.poNumber}
                            </div>
                          )}
                        </td>
                        <td className='px-4 py-2 text-gray-600 border-r border-gray-200 whitespace-nowrap'>
                          {item.date ? formatDate(item.date) : '-'}
                        </td>
                        <td className='px-4 py-2 text-right font-bold text-amber-800 border-r border-gray-200 whitespace-nowrap'>
                          {formatCurrency(item.amount)}
                        </td>
                        <td className='px-4 py-2 text-center'>
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
            <div className='flex flex-col items-center justify-center h-44 text-center text-gray-400'>
              <BanknotesIcon className='w-10 h-10 stroke-1 mb-2 text-gray-300' />
              <p className='text-xs font-semibold text-gray-600'>
                Tidak ada invoice outstanding
              </p>
              <p className='text-[11px] text-gray-400 mt-0.5'>
                {searchQuery
                  ? 'Coba sesuaikan kata kunci pencarian Anda'
                  : 'Semua invoice pada periode ini telah lunas'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 shrink-0'>
          <div className='text-xs text-gray-500'>
            Total{' '}
            <span className='font-semibold text-gray-700'>
              {filteredList.length}
            </span>{' '}
            invoice
          </div>

          <button
            type='button'
            onClick={onClose}
            className='px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition shadow-sm'
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutstandingInvoicesModal;
