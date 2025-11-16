import React, { useState } from 'react';
import {
  DocumentTextIcon,
  ShoppingCartIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  PrinterIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';
import { InfoTable, StatusBadge, TabContainer, Tab, TabContent, TabPanel } from '../ui';
import { AccordionItem } from '../ui';
import invoicePengirimanService from '../../services/invoicePengirimanService';
import toastService from '../../services/toastService';

const InvoicePengirimanDetailCard = ({ invoice, onClose, loading = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Detail Invoice Pengiriman</h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            {invoice?.no_invoice || 'No invoice number available'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateInvoicePenagihan}
            disabled={isGenerating || loading}
            className="inline-flex items-center px-3 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            title="Generate All Documents (Invoice Penagihan, Kwitansi, Faktur Pajak)"
          >
            <DocumentPlusIcon className="w-4 h-4 mr-1" />
            {isGenerating ? 'Generating All Documents...' : 'Generate All Documents'}
          </button>
          <button
            onClick={handlePrintInvoice}
            disabled={isPrinting || loading}
            className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            title="Print Invoice"
          >
            <PrinterIcon className="w-4 h-4 mr-1" />
            {isPrinting ? 'Printing...' : 'Print'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">Loading invoice details...</span>
        </div>
      ) : (
        <div>
          {/* Tab Navigation */}
          <TabContainer
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
            className="mb-6"
          >
            <Tab
              id="overview"
              label="Ringkasan"
              icon={<DocumentTextIcon className="w-4 h-4" />}
            />
            <Tab
              id="details"
              label="Detail Barang"
              icon={<ShoppingCartIcon className="w-4 h-4" />}
              badge={detailCount}
            />
          </TabContainer>

          {/* Tab Content */}
          <TabContent activeTab={activeTab}>
            <TabPanel tabId="overview">
              <div className="space-y-6">
                {/* Basic Information */}
                <AccordionItem
                  title="Informasi Dasar"
                  isExpanded={expandedSections.basicInfo}
                  onToggle={() => toggleSection('basicInfo')}
                  bgColor="bg-gradient-to-r from-indigo-50 to-indigo-100"
                >
                  <InfoTable
                    data={[
                      { label: 'Nomor Invoice', value: invoice.no_invoice },
                      {
                        label: 'Tanggal',
                        value: formatDate(invoice.tanggal),
                      },
                      {
                        label: 'Jatuh Tempo',
                        value: formatDate(invoice.expired_date),
                      },
                      {
                        label: 'Term of Payment',
                        value:
                          invoice.termOfPayment?.kode_top ||
                          invoice.termOfPayment?.kodeTop ||
                          invoice.termOfPaymentId ||
                          invoice.TOP ||
                          '-',
                      },
                      {
                        label: 'Tujuan Pengiriman',
                        value: invoice.deliver_to || '-',
                      },
                      {
                        label: 'Tipe Invoice',
                        value: invoice.type || '-',
                      },
                      {
                        label: 'Status',
                        component: (
                          <StatusBadge
                            status={statusLabel || '-'}
                            variant={statusVariant}
                            dot
                          />
                        ),
                      },
                      {
                        label: 'Purchase Order',
                        value: invoice.purchaseOrder?.po_number || '-',
                      },
                      {
                        label: 'Customer',
                        value: invoice.purchaseOrder?.customer?.namaCustomer || '-',
                      },
                      {
                        label: 'Status Print',
                        component: (
                          <StatusBadge
                            status={invoice.is_printed ? 'Sudah di Print' : 'Belum Print'}
                            variant={invoice.is_printed ? 'success' : 'secondary'}
                            dot
                          />
                        ),
                      },
                    ]}
                  />
                </AccordionItem>

                {/* Financial Details */}
                <AccordionItem
                  title="Rincian Finansial"
                  isExpanded={expandedSections.pricingInfo}
                  onToggle={() => toggleSection('pricingInfo')}
                  bgColor="bg-gradient-to-r from-green-50 to-green-100"
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
                        value: formatCurrency(invoice.ppnRupiah ?? invoice.ppn_rupiah),
                      },
                      {
                        label: 'Grand Total',
                        value: formatCurrency(invoice.grand_total),
                      },
                    ]}
                  />
                </AccordionItem>

                {/* System Information */}
                <AccordionItem
                  title="Informasi Sistem"
                  isExpanded={expandedSections.metaInfo}
                  onToggle={() => toggleSection('metaInfo')}
                  bgColor="bg-gradient-to-r from-purple-50 to-purple-100"
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
                      {
                        label: 'Dibuat Oleh',
                        value: invoice.createdBy || '-',
                      },
                      {
                        label: 'Diperbarui Oleh',
                        value: invoice.updatedBy || '-',
                      },
                    ]}
                  />
                </AccordionItem>
              </div>
            </TabPanel>

            <TabPanel tabId="details">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <ShoppingCartIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Rincian Barang</h3>
                  </div>
                  <div className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                    {detailCount} item
                  </div>
                </div>

                {invoice.invoiceDetails && invoice.invoiceDetails.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Barang
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PLU
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Satuan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Harga
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoice.invoiceDetails.map((detail, index) => (
                          <tr key={detail.id || index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {detail.nama_barang}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {detail.PLU}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {detail.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {detail.satuan}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(detail.harga)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(detail.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Tidak ada detail barang untuk invoice ini.
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

export default InvoicePengirimanDetailCard;
