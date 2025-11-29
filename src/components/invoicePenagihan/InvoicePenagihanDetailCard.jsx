import React, { useState } from 'react';
import { 
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';
import { AccordionItem, InfoTable } from '../ui';
import InvoicePenagihanForm from './InvoicePenagihanForm';
import toastService from '../../services/toastService';

const InvoicePenagihanDetailCard = ({
  invoice,
  onClose,
  onUpdate,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSave = async (payload) => {
    if (!onUpdate) {
      toastService.error('Handler update invoice penagihan tidak tersedia.');
      return;
    }

    try {
      setSaving(true);
      const result = await onUpdate(invoice.id, payload);
      if (result) {
        setIsEditMode(false);
        toastService.success('Invoice penagihan berhasil diperbarui.');
      }
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Gagal memperbarui invoice penagihan.';
      toastService.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='bg-white shadow rounded-lg overflow-hidden'>
      {/* Header */}
      <div className='flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50'>
        <div className='flex items-center gap-2'>
          <div className='p-1.5 rounded bg-indigo-100'>
            <DocumentTextIcon className='w-4 h-4 text-indigo-600' />
          </div>
          <div>
            <h3 className='text-sm font-bold text-gray-900'>
              Invoice Penagihan
              {isEditMode && <span className="ml-2 text-xs font-normal text-indigo-600">(Editing)</span>}
            </h3>
            <p className='text-xs text-gray-600'>
              {invoice.no_invoice_penagihan || '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isEditMode ? (
            <>
              {onUpdate && (
                <button
                  onClick={handleEditClick}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 bg-white border border-indigo-600 rounded hover:bg-indigo-50"
                  title="Edit"
                >
                  <PencilIcon className="w-3 h-3 mr-1" />
                  Edit
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className='p-1 rounded hover:bg-gray-100'
                  title='Tutup'
                >
                  <XMarkIcon className='w-4 h-4 text-gray-500' />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200 bg-gray-50'>
        <nav className='flex px-2 gap-1'>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 px-2 border-b-2 text-xs font-medium flex items-center gap-1 ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <DocumentTextIcon className='w-4 h-4' />
            <span>Ringkasan</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-1.5 px-2 border-b-2 text-xs font-medium flex items-center gap-1 ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <CurrencyDollarIcon className='w-4 h-4' />
            <span>Detail</span>
            <span className='px-1.5 py-0.5 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full'>
              {invoice.invoicePenagihanDetails?.length || 0}
            </span>
          </button>
        </nav>
      </div>

      <div className='p-3 max-h-[500px] overflow-y-auto'>
        {isLoading ? (
          <div className='flex justify-center items-center py-6'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
            <span className='ml-2 text-xs text-gray-600'>Memuat...</span>
          </div>
        ) : isEditMode ? (
          <div className='bg-gray-50 rounded p-3'>
            <InvoicePenagihanForm
              initialValues={invoice}
              onSubmit={handleSave}
              onCancel={handleCancelEdit}
              submitLabel='Simpan'
              loading={saving}
              isEditMode={true}
            />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className='space-y-2'>
                <AccordionItem
                  title='Info Dasar'
                  isExpanded={expandedSections.basicInfo}
                  onToggle={() => toggleSection('basicInfo')}
                  bgColor='bg-indigo-50'
                  compact
                >
                  <InfoTable
                    compact
                    data={[
                      { label: 'No. Invoice', value: invoice.no_invoice_penagihan || '-' },
                      { label: 'Tanggal', value: formatDate(invoice.tanggal) },
                      { label: 'Kepada', value: invoice.kepada || '-' },
                      { label: 'PO#', value: invoice?.purchaseOrder?.po_number || invoice.purchaseOrderId || '-' },
                      { label: 'Customer', value: invoice?.purchaseOrder?.customer?.namaCustomer || '-' },
                      { label: 'TOP', value: invoice?.termOfPayment?.kode_top || invoice.termOfPaymentId || '-' },
                    ]}
                  />
                </AccordionItem>

                <AccordionItem
                  title='Pembayaran'
                  isExpanded={expandedSections.paymentInfo}
                  onToggle={() => toggleSection('paymentInfo')}
                  bgColor='bg-emerald-50'
                  compact
                >
                  <InfoTable
                    compact
                    data={[
                      { label: 'Sub Total', value: formatCurrency(invoice.sub_total) },
                      { label: 'Diskon', value: formatCurrency(invoice.total_discount) },
                      { label: 'Total', value: formatCurrency(invoice.total_price) },
                      { label: 'PPN', value: typeof invoice.ppn_percentage === 'number' ? `${invoice.ppn_percentage}%` : invoice.ppn_percentage || '0%' },
                      { label: 'PPN (Rp)', value: formatCurrency(invoice.ppnRupiah ?? invoice.ppn_rupiah) },
                      { label: 'Grand Total', value: formatCurrency(invoice.grand_total) },
                    ]}
                  />
                </AccordionItem>

                <AccordionItem
                  title='Status & Dokumen'
                  isExpanded={expandedSections.statusInfo}
                  onToggle={() => toggleSection('statusInfo')}
                  bgColor='bg-yellow-50'
                  compact
                >
                  <InfoTable
                    compact
                    data={[
                      { label: 'Status', value: invoice?.status?.status_name || invoice?.status?.status_code || '-' },
                      { label: 'Kwitansi', value: invoice?.kwitansi?.no_kwitansi || (invoice?.kwitansiId ? 'Ada' : '-') },
                      { label: 'Faktur Pajak', value: invoice?.fakturPajak?.no_faktur_pajak || (invoice?.fakturPajakId ? 'Ada' : '-') },
                      { label: 'TTF', value: invoice?.tandaTerimaFaktur?.no_tanda_terima_faktur || (invoice?.tandaTerimaFakturId ? 'Ada' : '-') },
                    ]}
                  />
                </AccordionItem>

                <AccordionItem
                  title='Info Sistem'
                  isExpanded={expandedSections.metaInfo}
                  onToggle={() => toggleSection('metaInfo')}
                  bgColor='bg-gray-50'
                  compact
                >
                  <InfoTable
                    compact
                    data={[
                      { label: 'Dibuat', value: formatDateTime(invoice.createdAt) },
                      { label: 'Diperbarui', value: formatDateTime(invoice.updatedAt) },
                      { label: 'Oleh', value: invoice.createdBy || '-' },
                    ]}
                  />
                </AccordionItem>
              </div>
            )}

            {activeTab === 'details' && (
              <div className='overflow-hidden bg-white border border-gray-200 rounded'>
                {invoice.invoicePenagihanDetails && invoice.invoicePenagihanDetails.length > 0 ? (
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200 text-xs'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-2 py-1.5 text-left font-medium text-gray-500'>Barang</th>
                          <th className='px-2 py-1.5 text-left font-medium text-gray-500'>PLU</th>
                          <th className='px-2 py-1.5 text-right font-medium text-gray-500'>Qty</th>
                          <th className='px-2 py-1.5 text-left font-medium text-gray-500'>Sat</th>
                          <th className='px-2 py-1.5 text-right font-medium text-gray-500'>Harga</th>
                          <th className='px-2 py-1.5 text-right font-medium text-gray-500'>Disc%</th>
                          <th className='px-2 py-1.5 text-right font-medium text-gray-500'>Total</th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-100'>
                        {invoice.invoicePenagihanDetails.map((detail, index) => (
                          <tr key={detail.id || index} className='hover:bg-gray-50'>
                            <td className='px-2 py-1.5 text-gray-900'>{detail.nama_barang}</td>
                            <td className='px-2 py-1.5 text-gray-600'>{detail.PLU}</td>
                            <td className='px-2 py-1.5 text-right text-gray-900'>{detail.quantity}</td>
                            <td className='px-2 py-1.5 text-gray-600'>{detail.satuan}</td>
                            <td className='px-2 py-1.5 text-right text-gray-900'>{formatCurrency(detail.harga)}</td>
                            <td className='px-2 py-1.5 text-right text-gray-600'>
                              {typeof detail.discount_percentage === 'number' ? `${detail.discount_percentage}%` : '-'}
                            </td>
                            <td className='px-2 py-1.5 text-right font-medium text-gray-900'>{formatCurrency(detail.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='py-6 text-center'>
                    <DocumentTextIcon className='w-8 h-8 mx-auto text-gray-300 mb-2' />
                    <p className='text-xs text-gray-500'>Tidak ada detail barang</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvoicePenagihanDetailCard;
