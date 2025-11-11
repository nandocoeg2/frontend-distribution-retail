import React, { useState } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  ClockIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  InboxStackIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';
import { TabContainer, Tab, TabContent, TabPanel, InfoTable, StatusBadge } from '../ui';
import ActivityTimeline from '../common/ActivityTimeline';

const FakturPajakDetailCard = ({ fakturPajak, onClose, loading = false }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!fakturPajak) return null;

  const detail = fakturPajak;
  const statusVariant = detail?.status?.status_code?.toLowerCase().includes('completed') ||
    detail?.status?.status_code?.toLowerCase().includes('issued')
    ? 'success'
    : detail?.status?.status_code?.toLowerCase().includes('cancelled')
      ? 'danger'
      : detail?.status?.status_code?.toLowerCase().includes('processing')
        ? 'warning'
        : 'secondary';

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Detail Faktur Pajak</h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            {detail?.no_pajak || 'No faktur pajak available'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
          <span className="ml-3 text-sm text-gray-600">Loading faktur pajak details...</span>
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
              label="Overview"
              icon={<DocumentTextIcon className="w-4 h-4" />}
            />
            <Tab
              id="customer"
              label="Customer"
              icon={<UserIcon className="w-4 h-4" />}
            />
            <Tab
              id="related"
              label="Related Data"
              icon={<DocumentCheckIcon className="w-4 h-4" />}
            />
            <Tab
              id="activity"
              label="Activity"
              icon={<ClockIcon className="w-4 h-4" />}
              badge={detail?.auditTrails?.length || 0}
            />
          </TabContainer>

          {/* Tab Content */}
          <TabContent activeTab={activeTab}>
            <TabPanel tabId="overview">
              <div className="space-y-6">
                {/* Main Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Utama</h3>
                  </div>
                  <InfoTable
                    data={[
                      { label: 'Nomor Faktur Pajak', value: detail?.no_pajak, copyable: true },
                      {
                        label: 'Tanggal Invoice',
                        value: detail?.tanggal_invoice ? formatDate(detail.tanggal_invoice) : '-',
                      },
                      {
                        label: 'Status',
                        component: (
                          <StatusBadge
                            status={detail?.status?.status_name || detail?.status?.status_code || 'Unknown'}
                            variant={statusVariant}
                            dot
                          />
                        ),
                      },
                    ]}
                  />
                </div>

                {/* Financial Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <BanknotesIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Keuangan</h3>
                  </div>
                  <InfoTable
                    data={[
                      { label: 'Total Harga Jual', value: formatCurrency(detail?.total_harga_jual) },
                      { label: 'Potongan Harga', value: formatCurrency(detail?.potongan_harga) },
                      { label: 'Dasar Pengenaan Pajak (DPP)', value: formatCurrency(detail?.dasar_pengenaan_pajak) },
                      { label: 'PPN (Rp)', value: formatCurrency(detail?.ppn_rp) },
                      {
                        label: 'PPN (%)',
                        value: detail?.ppn_percentage != null ? `${detail.ppn_percentage}%` : '-',
                      },
                    ]}
                  />
                </div>

                {/* Term of Payment */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Term of Payment</h3>
                  </div>
                  <InfoTable
                    data={[
                      { label: 'Term of Payment', value: detail?.termOfPayment?.name || '-' },
                      {
                        label: 'Jumlah Hari',
                        value: detail?.termOfPayment?.days != null ? `${detail.termOfPayment.days} hari` : '-',
                      },
                      { label: 'Deskripsi', value: detail?.termOfPayment?.description || '-' },
                    ]}
                  />
                </div>

                {/* Audit Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Audit Information</h3>
                  </div>
                  <InfoTable
                    data={[
                      { label: 'Created By', value: detail?.createdBy || '-' },
                      {
                        label: 'Created At',
                        value: detail?.createdAt ? formatDateTime(detail.createdAt) : '-',
                      },
                      { label: 'Updated By', value: detail?.updatedBy || '-' },
                      {
                        label: 'Updated At',
                        value: detail?.updatedAt ? formatDateTime(detail.updatedAt) : '-',
                      },
                    ]}
                  />
                </div>
              </div>
            </TabPanel>

            <TabPanel tabId="customer">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Informasi Customer</h3>
                </div>
                <InfoTable
                  data={[
                    { label: 'Nama Customer', value: detail?.customer?.nama_customer || '-' },
                    { label: 'Kode Customer', value: detail?.customer?.kode_customer || '-', copyable: true },
                    { label: 'Alamat', value: detail?.customer?.alamat || '-' },
                    { label: 'NPWP', value: detail?.customer?.npwp || '-', copyable: true },
                  ]}
                />
              </div>
            </TabPanel>

            <TabPanel tabId="related">
              <div className="space-y-6">
                {/* Invoice Penagihan */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <DocumentCheckIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Invoice Penagihan Terkait</h3>
                  </div>
                  {detail?.invoicePenagihan && Array.isArray(detail.invoicePenagihan) && detail.invoicePenagihan.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nomor Invoice
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tanggal Invoice
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Invoice
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {detail.invoicePenagihan.map((invoice, index) => (
                            <tr key={invoice.id || index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {invoice.no_invoice_penagihan || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {invoice.tanggal ? formatDate(invoice.tanggal) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(invoice.total_price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {invoice.customer?.nama_customer || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : detail?.invoicePenagihan && !Array.isArray(detail.invoicePenagihan) ? (
                    <InfoTable
                      data={[
                        { label: 'Nomor Invoice', value: detail.invoicePenagihan.no_invoice || '-' },
                        {
                          label: 'Tanggal Invoice',
                          value: formatDate(detail.invoicePenagihan.tanggal_invoice),
                        },
                        { label: 'Total Invoice', value: formatCurrency(detail.invoicePenagihan.total_price) },
                        { label: 'Customer Invoice', value: detail.invoicePenagihan.customer?.nama_customer || '-' },
                      ]}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">No invoice penagihan data available.</div>
                  )}
                </div>

                {/* Laporan Penerimaan Barang */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <InboxStackIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Laporan Penerimaan Barang</h3>
                  </div>
                  {detail?.laporanPenerimaanBarang ? (
                    <InfoTable
                      data={[
                        { label: 'Nomor LPB', value: detail.laporanPenerimaanBarang.no_lpb || '-', copyable: true },
                        {
                          label: 'Tanggal Terima',
                          value: formatDate(detail.laporanPenerimaanBarang.tanggal_terima),
                        },
                        {
                          label: 'Total Kuantitas',
                          value: detail.laporanPenerimaanBarang.total_quantity != null
                            ? detail.laporanPenerimaanBarang.total_quantity
                            : '-',
                        },
                      ]}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">No laporan penerimaan barang data available.</div>
                  )}
                </div>
              </div>
            </TabPanel>

            <TabPanel tabId="activity">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                </div>

                {detail?.auditTrails && Array.isArray(detail.auditTrails) && detail.auditTrails.length > 0 ? (
                  <ActivityTimeline
                    auditTrails={detail.auditTrails.map((trail) => ({
                      ...trail,
                      details: trail.changes || {},
                      timestamp: trail.timestamp,
                      user: trail.userId,
                    }))}
                    title=""
                    showCount={false}
                    emptyMessage="No activity found."
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">No activity found.</div>
                )}
              </div>
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default FakturPajakDetailCard;
