import React, { useState } from 'react';
import { AccordionItem, InfoTable } from '../ui';

const ViewInvoicePengirimanModal = ({ show, onClose, invoice }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    pricingInfo: false,
    metaInfo: false,
  });

  if (!show || !invoice) return null;

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
      badge: invoice.invoiceDetails?.length,
    },
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div className='bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-indigo-100 rounded-lg'>
              <span className='text-2xl font-semibold text-indigo-600'>
                INV
              </span>
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                Detail Invoice Pengiriman
              </h2>
              <p className='text-sm text-gray-600'>{invoice.no_invoice}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 transition-colors rounded-lg hover:bg-gray-100'
            aria-label='Tutup detail invoice pengiriman'
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
            aria-label='Tabs invoice pengiriman'
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors `}
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

        <div className='flex-1 p-6 overflow-y-auto'>
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
                    { label: 'Nomor Invoice', value: invoice.no_invoice },
                    { label: 'Tanggal', value: formatDate(invoice.tanggal) },
                    {
                      label: 'Jatuh Tempo',
                      value: formatDate(invoice.expired_date),
                    },
                    { label: 'Term of Payment', value: invoice.TOP || '-' },
                    {
                      label: 'Tujuan Pengiriman',
                      value: invoice.deliver_to || '-',
                    },
                    {
                      label: 'Tipe Invoice',
                      value: invoice.type || 'PENGIRIMAN',
                    },
                    {
                      label: 'Status Pembayaran',
                      value: invoice.statusPembayaran?.name || '-',
                    },
                    {
                      label: 'Purchase Order',
                      value: invoice.purchaseOrder?.no_po || '-',
                    },
                    { label: 'Invoice ID', value: invoice.id, copyable: true },
                  ]}
                />
              </AccordionItem>

              <AccordionItem
                title='Rincian Finansial'
                isExpanded={expandedSections.pricingInfo}
                onToggle={() => toggleSection('pricingInfo')}
                bgColor='bg-gradient-to-r from-green-50 to-green-100'
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
                      value: invoice.ppn_percentage
                        ? `${invoice.ppn_percentage}%`
                        : '-',
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
                  {invoice.invoiceDetails?.length || 0} item
                </div>
              </div>

              {invoice.invoiceDetails && invoice.invoiceDetails.length > 0 ? (
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
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {invoice.invoiceDetails.map((detail, index) => (
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
                      INV
                    </span>
                  </div>
                  <h3 className='mb-2 text-lg font-medium text-gray-900'>
                    Belum ada detail barang
                  </h3>
                  <p className='text-gray-500'>
                    Tidak ditemukan item untuk invoice pengiriman ini.
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

export default ViewInvoicePengirimanModal;
