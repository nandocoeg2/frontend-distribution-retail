import React, { useState } from 'react';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';
import { AccordionItem, InfoTable } from '../ui';

const toBooleanLabel = (value, fallback = '-') => {
  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak';
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true') return 'Ya';
    if (lower === 'false') return 'Tidak';
  }
  return fallback;
};

const ViewInvoicePenagihanModal = ({
  show,
  onClose,
  invoice,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    paymentInfo: true,
    statusInfo: false,
    metaInfo: false,
  });

  if (!show || !invoice) return null;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: '[O]' },
    {
      id: 'details',
      label: 'Detail Barang',
      icon: '[D]',
      badge: invoice.invoicePenagihanDetails?.length,
    },
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div className='bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-indigo-100 rounded-lg'>
              <span className='text-2xl font-semibold text-indigo-600'>
                IPN
              </span>
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                Detail Invoice Penagihan
              </h2>
              <p className='text-sm text-gray-600'>
                {invoice.no_invoice_penagihan || '-'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 transition-colors rounded-lg hover:bg-gray-100'
            aria-label='Tutup detail invoice penagihan'
          >
            <svg
              className='w-6 h-6 text-gray-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='border-b border-gray-200 bg-gray-50'>
          <nav
            className='flex px-6 space-x-8'
            aria-label='Tabs invoice penagihan'
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className='flex items-center px-1 py-4 space-x-2 text-sm font-medium transition-colors border-b-2'
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className='px-2 py-1 ml-2 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full'>
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        <div className='relative flex-1 p-6 overflow-y-auto'>
          {isLoading ? (
            <div className='absolute inset-0 z-10 flex items-center justify-center bg-white/75'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin'></div>
                <p className='text-sm font-medium text-gray-700'>
                  Memuat detail invoice...
                </p>
              </div>
            </div>
          ) : null}
          {activeTab === 'overview' && (
            <div className='space-y-6'>
              <AccordionItem
                title='Informasi Dasar'
                isExpanded={expandedSections.basicInfo}
                onToggle={() => toggleSection('basicInfo')}
                bgColor='bg-gradient-to-r from-indigo-50 to-indigo-100'
              >
                <InfoTable
                  data={[
                    {
                      label: 'Nomor Invoice',
                      value: invoice.no_invoice_penagihan || '-',
                    },
                    { label: 'Tanggal', value: formatDate(invoice.tanggal) },
                    { label: 'Kepada', value: invoice.kepada || '-' },
                    {
                      label: 'Purchase Order',
                      value:
                        invoice?.purchaseOrder?.po_number ||
                        invoice.purchaseOrderId ||
                        '-',
                    },
                    {
                      label: 'Kode Customer',
                      value:
                        invoice?.purchaseOrder?.customer?.kodeCustomer ||
                        invoice?.purchaseOrder?.customer?.id ||
                        '-',
                    },
                    {
                      label: 'Nama Customer',
                      value:
                        invoice?.purchaseOrder?.customer?.namaCustomer || '-',
                    },
                    {
                      label: 'Term of Payment',
                      value:
                        invoice?.termOfPayment?.kode_top ||
                        invoice.termOfPaymentId ||
                        '-',
                    },
                  ]}
                />
              </AccordionItem>

              <AccordionItem
                title='Informasi Pembayaran'
                isExpanded={expandedSections.paymentInfo}
                onToggle={() => toggleSection('paymentInfo')}
                bgColor='bg-gradient-to-r from-emerald-50 to-emerald-100'
              >
                <InfoTable
                  data={[
                    {
                      label: 'Sub Total',
                      value: formatCurrency(invoice.sub_total),
                    },
                    {
                      label: 'Total Diskon',
                      value: formatCurrency(invoice.total_discount),
                    },
                    {
                      label: 'Total Harga',
                      value: formatCurrency(invoice.total_price),
                    },
                    {
                      label: 'PPN (%)',
                      value:
                        typeof invoice.ppn_percentage === 'number'
                          ? `${invoice.ppn_percentage}%`
                          : invoice.ppn_percentage || '0%',
                    },
                    {
                      label: 'PPN (Rp)',
                      value: formatCurrency(invoice.ppn_rupiah),
                    },
                    {
                      label: 'Grand Total',
                      value: formatCurrency(invoice.grand_total),
                    },
                  ]}
                />
              </AccordionItem>

              <AccordionItem
                title='Status & Flag'
                isExpanded={expandedSections.statusInfo}
                onToggle={() => toggleSection('statusInfo')}
                bgColor='bg-gradient-to-r from-yellow-50 to-yellow-100'
              >
                <InfoTable
                  data={[
                    {
                      label: 'Status',
                      value:
                        invoice?.status?.status_name ||
                        invoice?.status?.status_code ||
                        invoice.statusId ||
                        '-',
                    },
                    { label: 'Status KW', value: toBooleanLabel(invoice.kw) },
                    { label: 'Status FP', value: toBooleanLabel(invoice.fp) },
                  ]}
                />
              </AccordionItem>

              <AccordionItem
                title='Informasi Sistem'
                isExpanded={expandedSections.metaInfo}
                onToggle={() => toggleSection('metaInfo')}
                bgColor='bg-gradient-to-r from-purple-50 to-purple-100'
              >
                <InfoTable
                  data={[
                    {
                      label: 'Dibuat Pada',
                      value: formatDateTime(invoice.createdAt),
                    },
                    {
                      label: 'Diperbarui Pada',
                      value: formatDateTime(invoice.updatedAt),
                    },
                    { label: 'Dibuat Oleh', value: invoice.createdBy || '-' },
                    {
                      label: 'Diperbarui Oleh',
                      value: invoice.updatedBy || '-',
                    },
                  ]}
                />
              </AccordionItem>
            </div>
          )}

          {activeTab === 'details' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  Rincian Barang
                </h3>
                <div className='px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full'>
                  {invoice.invoicePenagihanDetails?.length || 0} item
                </div>
              </div>

              {invoice.invoicePenagihanDetails &&
              invoice.invoicePenagihanDetails.length > 0 ? (
                <div className='overflow-x-auto bg-white border border-gray-200 rounded-lg'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                          Barang
                        </th>
                        <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                          PLU
                        </th>
                        <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                          Qty
                        </th>
                        <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                          Satuan
                        </th>
                        <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                          Harga
                        </th>
                        <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                          Diskon (%)
                        </th>
                        <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                          Diskon (Rp)
                        </th>
                        <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {invoice.invoicePenagihanDetails.map((detail, index) => (
                        <tr
                          key={detail.id || index}
                          className='hover:bg-gray-50'
                        >
                          <td className='px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap'>
                            {detail.nama_barang}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                            {detail.PLU}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                            {detail.quantity}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                            {detail.satuan}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                            {formatCurrency(detail.harga)}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                            {typeof detail.discount_percentage === 'number'
                              ? `${detail.discount_percentage}%`
                              : detail.discount_percentage || '-'}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                            {formatCurrency(detail.discount_rupiah)}
                          </td>
                          <td className='px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap'>
                            {formatCurrency(detail.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='py-12 text-center'>
                  <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                    <span className='text-2xl font-semibold text-gray-400'>
                      IPN
                    </span>
                  </div>
                  <h3 className='mb-2 text-lg font-medium text-gray-900'>
                    Belum ada detail barang
                  </h3>
                  <p className='text-gray-500'>
                    Tidak ditemukan item untuk invoice penagihan ini.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className='p-6 border-t border-gray-200 bg-gray-50'>
          <div className='flex justify-end space-x-3'>
            <button
              onClick={onClose}
              className='px-6 py-2 font-medium text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600'
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInvoicePenagihanModal;


