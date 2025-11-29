import React, { useState } from 'react';
import {
  DocumentTextIcon,
  ShoppingCartIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  PrinterIcon,
  DocumentPlusIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';
import { InfoTable, StatusBadge, TabContainer, Tab, TabContent, TabPanel } from '../ui';
import { AccordionItem } from '../ui';
import invoicePengirimanService from '../../services/invoicePengirimanService';
import toastService from '../../services/toastService';
import InvoicePengirimanForm from './InvoicePengirimanForm';

const InvoicePengirimanDetailCard = ({ invoice, onClose, loading = false, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    pricingInfo: false,
    metaInfo: false,
  });

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

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await invoicePengirimanService.updateInvoicePengiriman(invoice.id, formData);
      toastService.success('Invoice pengiriman berhasil diperbarui');
      setIsEditMode(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
      toastService.error(error.message || 'Gagal memperbarui invoice');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!invoice || loading) return;

    setIsPrinting(true);
    try {
      const html = await invoicePengirimanService.exportInvoicePengiriman(invoice.id);
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        toastService.error('Tidak dapat membuka jendela cetak. Periksa pengaturan pop-up browser.');
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      toastService.success('Invoice siap dicetak');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toastService.error('Gagal mencetak invoice pengiriman');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleGenerateInvoicePenagihan = async () => {
    if (!invoice || loading) return;

    setIsGenerating(true);
    try {
      const response = await invoicePengirimanService.generateInvoicePenagihan(invoice.id);

      if (response?.success) {
        // Extract all generated documents from the response
        const invoicePenagihan = response.data;
        const kwitansi = response.data?.kwitansi;
        const fakturPajak = response.data?.fakturPajak;

        // Create detailed success message showing all 3 documents
        const successMessage = `✅ Berhasil membuat semua dokumen:\n📋 Invoice Penagihan: ${invoicePenagihan?.no_invoice_penagihan || 'N/A'}\n💰 Kwitansi: ${kwitansi?.no_kwitansi || 'N/A'}\n📄 Faktur Pajak: ${fakturPajak?.no_pajak || 'N/A'}`;
        toastService.success(successMessage);

        // Log all generated documents for debugging
        if (invoicePenagihan?.id) {
          console.log('Generated Documents:', {
            invoicePenagihan: { id: invoicePenagihan.id, number: invoicePenagihan.no_invoice_penagihan },
            kwitansi: { id: kwitansi?.id, number: kwitansi?.no_kwitansi },
            fakturPajak: { id: fakturPajak?.id, number: fakturPajak?.no_pajak }
          });
        }
      } else {
        toastService.error(response?.error?.message || 'Gagal membuat dokumen invoice');
      }
    } catch (error) {
      console.error('Error generating invoice penagihan:', error);

      // Handle specific error cases
      if (error?.response?.status === 409) {
        toastService.error('Invoice Penagihan sudah ada untuk Invoice Pengiriman ini');
      } else if (error?.response?.status === 404) {
        toastService.error('Invoice Pengiriman tidak ditemukan');
      } else if (error?.response?.status === 400) {
        const errorMessage = error?.response?.data?.error?.message || 'Data tidak valid untuk membuat dokumen invoice';
        toastService.error(errorMessage);
      } else {
        toastService.error('Gagal membuat dokumen invoice. Silakan coba lagi.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!invoice) return null;

  const detailCount = invoice?.invoiceDetails?.length ?? 0;
  const statusInfo = invoice?.status || invoice?.statusPembayaran || null;
  const statusLabel = statusInfo?.status_name || statusInfo?.status_code || '';
  const normalizedStatus = statusLabel.toLowerCase();
  const statusVariant = normalizedStatus.includes('paid')
    ? 'success'
    : normalizedStatus.includes('cancelled')
      ? 'danger'
      : normalizedStatus.includes('overdue')
        ? 'danger'
        : normalizedStatus.includes('pending')
          ? 'secondary'
          : 'secondary';

  return (
    <div className='bg-white shadow rounded-lg p-3 mt-3'>
      <div className='flex justify-between items-center mb-2'>
        <div className='flex items-center gap-2'>
          <DocumentTextIcon className='h-4 w-4 text-indigo-600' />
          <div>
            <h2 className='text-sm font-bold text-gray-900'>Invoice Pengiriman</h2>
            <p className='text-xs text-gray-600'>{invoice?.no_invoice || '-'}</p>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          {!isEditMode ? (
            <>
              <button onClick={handleEditClick} className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700'>
                <PencilIcon className='w-3 h-3 mr-1' />Edit
              </button>
              <button onClick={handleGenerateInvoicePenagihan} disabled={isGenerating || loading} className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50'>
                {isGenerating ? '...' : 'Generate'}
              </button>
              <button onClick={handlePrintInvoice} disabled={isPrinting || loading} className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50'>
                {isPrinting ? '...' : 'Print'}
              </button>
              {onClose && (
                <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded' title='Close'>
                  <XMarkIcon className='w-4 h-4 text-gray-500' />
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={handleCancelEdit} disabled={saving} className='px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50'>Batal</button>
              <button type='submit' form='invoice-pengiriman-form' disabled={saving} className='px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50'>
                {saving ? '...' : 'Simpan'}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center py-4'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-xs text-gray-600'>Loading...</span>
        </div>
      ) : isEditMode ? (
        <div className='bg-gray-50 rounded p-3'>
          <InvoicePengirimanForm
            initialValues={invoice}
            onSubmit={handleSave}
            onCancel={handleCancelEdit}
            isSubmitting={saving}
            formId="invoice-pengiriman-form"
          />
        </div>
      ) : (
        <div>
          <TabContainer activeTab={activeTab} onTabChange={setActiveTab} variant='underline' className='mb-2'>
            <Tab id='overview' label='Ringkasan' icon={<DocumentTextIcon className='w-3 h-3' />} />
            <Tab id='details' label='Items' icon={<ShoppingCartIcon className='w-3 h-3' />} badge={detailCount} />
          </TabContainer>

          <TabContent activeTab={activeTab}>
            <TabPanel tabId='overview'>
              <div className='space-y-2'>
                <AccordionItem title='Info Dasar' isExpanded={expandedSections.basicInfo} onToggle={() => toggleSection('basicInfo')} bgColor='bg-indigo-50' compact>
                  <InfoTable compact data={[
                    { label: 'No. Invoice', value: invoice.no_invoice },
                    { label: 'Tanggal', value: formatDate(invoice.tanggal) },
                    { label: 'Jatuh Tempo', value: formatDate(invoice.expired_date) },
                    { label: 'TOP', value: invoice.termOfPayment?.kode_top || invoice.TOP || '-' },
                    { label: 'Status', component: <StatusBadge status={statusLabel || '-'} variant={statusVariant} size='xs' dot /> },
                    { label: 'PO#', value: invoice.purchaseOrder?.po_number || '-' },
                    { label: 'Customer', value: invoice.purchaseOrder?.customer?.namaCustomer || '-' },
                    { label: 'Print', component: <StatusBadge status={invoice.is_printed ? 'Printed' : 'Not Printed'} variant={invoice.is_printed ? 'success' : 'secondary'} size='xs' dot /> },
                  ]} />
                </AccordionItem>

                <AccordionItem title='Finansial' isExpanded={expandedSections.pricingInfo} onToggle={() => toggleSection('pricingInfo')} bgColor='bg-green-50' compact>
                  <InfoTable compact data={[
                    { label: 'Sub Total', value: formatCurrency(invoice.sub_total) },
                    { label: 'Diskon', value: formatCurrency(invoice.total_discount) },
                    { label: 'PPN', value: invoice.ppn_percentage ? `${invoice.ppn_percentage}%` : '-' },
                    { label: 'Grand Total', value: formatCurrency(invoice.grand_total) },
                  ]} />
                </AccordionItem>

                <AccordionItem title='System' isExpanded={expandedSections.metaInfo} onToggle={() => toggleSection('metaInfo')} bgColor='bg-purple-50' compact>
                  <InfoTable compact data={[
                    { label: 'Created', value: formatDateTime(invoice.createdAt) },
                    { label: 'Updated', value: formatDateTime(invoice.updatedAt) },
                  ]} />
                </AccordionItem>
              </div>
            </TabPanel>

            <TabPanel tabId='details'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-xs font-medium text-gray-700'>Rincian Barang</span>
                <span className='px-2 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full'>{detailCount} item</span>
              </div>
              {invoice.invoiceDetails && invoice.invoiceDetails.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200 text-xs'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase'>Barang</th>
                        <th className='px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase'>Qty</th>
                        <th className='px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase'>Harga</th>
                        <th className='px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase'>Total</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-100'>
                      {invoice.invoiceDetails.map((d, i) => (
                        <tr key={d.id || i} className='hover:bg-gray-50'>
                          <td className='px-2 py-1 text-xs text-gray-900'>{d.nama_barang}</td>
                          <td className='px-2 py-1 text-xs text-gray-900'>{d.quantity}</td>
                          <td className='px-2 py-1 text-xs text-gray-900'>{formatCurrency(d.harga)}</td>
                          <td className='px-2 py-1 text-xs font-medium text-gray-900'>{formatCurrency(d.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className='py-4 text-center text-xs text-gray-500'>Tidak ada detail barang</div>}
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default InvoicePengirimanDetailCard;
