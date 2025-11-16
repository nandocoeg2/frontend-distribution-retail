import React, { useState } from 'react';
import { 
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';
import { AccordionItem, InfoTable, TabContainer, Tab, TabContent, TabPanel } from '../ui';

const InvoicePenagihanDetailCard = ({
  invoice,
  onClose,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    paymentInfo: true,
    statusInfo: false,
    metaInfo: false,
  });

  if (!invoice) return null;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className='bg-white shadow-md rounded-lg p-6 mt-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6 border-b border-gray-200 pb-4'>
        <div className='flex items-center space-x-4'>
          <div className='p-2 bg-indigo-100 rounded-lg'>
            <DocumentTextIcon className='w-6 h-6 text-indigo-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>
              Detail Invoice Penagihan
            </h2>
            <p className='text-sm text-gray-600'>
              {invoice.no_invoice_penagihan || '-'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            title='Tutup detail'
          >
            <XMarkIcon className='w-5 h-5 text-gray-500' />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-3 text-sm text-gray-600'>Memuat detail invoice...</span>
        </div>
      ) : (
        <div>
          {/* Tab Navigation */}
          <TabContainer
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant='underline'
            className='mb-6'
          >
            <Tab
              id='overview'
              label='Ringkasan'
              icon={<DocumentTextIcon className='w-4 h-4' />}
            />
            <Tab
              id='details'
              label='Detail Barang'
              icon={<CurrencyDollarIcon className='w-4 h-4' />}
              badge={invoice.invoicePenagihanDetails?.length || 0}
            />
          </TabContainer>

          {/* Tab Content */}
          <TabContent activeTab={activeTab}>
            <TabPanel tabId='overview'>
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
                        value: formatCurrency(invoice.ppnRupiah ?? invoice.ppn_rupiah),
                      },
                      {
                        label: 'Grand Total',
                        value: formatCurrency(invoice.grand_total),
                      },
                    ]}
                  />
                </AccordionItem>

                <AccordionItem
                  title='Status & Dokumen'
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
                      {
                        label: 'Kwitansi',
                        value: invoice?.kwitansi?.no_kwitansi || (invoice?.kwitansiId ? 'Ada' : 'Belum ada'),
                      },
                      {
                        label: 'Faktur Pajak',
                        value: invoice?.fakturPajak?.no_faktur_pajak || (invoice?.fakturPajakId ? 'Ada' : 'Belum ada'),
                      },
                      {
                        label: 'Tanda Terima Faktur',
                        value: invoice?.tandaTerimaFaktur?.no_tanda_terima_faktur || (invoice?.tandaTerimaFakturId ? 'Ada' : 'Belum ada'),
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
            </TabPanel>

            <TabPanel tabId='details'>
              <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Rincian Barang
                  </h3>
                  <div className='px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full'>
                    {invoice.invoicePenagihanDetails?.length || 0} item
                  </div>
                </div>

                {invoice.invoicePenagihanDetails &&
                invoice.invoicePenagihanDetails.length > 0 ? (
                  <div className='overflow-x-auto'>
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
                      <DocumentTextIcon className='w-8 h-8 text-gray-400' />
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
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default InvoicePenagihanDetailCard;
