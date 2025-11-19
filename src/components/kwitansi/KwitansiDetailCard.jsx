import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';
import { InfoTable, StatusBadge } from '../ui';
import { TabContainer, Tab } from '../ui/Tabs';
import Autocomplete from '../common/Autocomplete';
import ActivityTimeline from '../common/ActivityTimeline';
import toastService from '@/services/toastService';
import useTermOfPaymentAutocomplete from '@/hooks/useTermOfPaymentAutocomplete';


const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('completed') || value.includes('paid')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed') || value.includes('overdue')) {
    return 'danger';
  }

  if (value.includes('processing')) {
    return 'warning';
  }

  if (value.includes('pending')) {
    return 'secondary';
  }

  return 'default';
};

const toDateInputValue = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().split('T')[0];
};

const KwitansiDetailCard = ({ 
  kwitansi, 
  onClose, 
  loading = false,
  onExport,
  exportLoading,
  updateKwitansi,
  onUpdate,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    invoicePenagihanId: '',
    no_kwitansi: '',
    tanggal: '',
    kepada: '',
    grand_total: '',
    termOfPaymentId: '',
    statusId: '',
  });
  const [saving, setSaving] = useState(false);

  const {
    options: termOfPaymentOptions,
    loading: termOfPaymentLoading,
    fetchOptions: searchTermOfPayments
  } = useTermOfPaymentAutocomplete({
    selectedId: formData.termOfPaymentId
  });

  // Create options for disabled autocomplete fields
  const invoicePenagihanOptions = detail?.invoicePenagihan ? [
    {
      id: detail.invoicePenagihan.id,
      label: detail.invoicePenagihan.no_invoice_penagihan || detail.invoicePenagihan.no_invoice || 'N/A',
      value: detail.invoicePenagihan.id
    }
  ] : [];

  const statusOptions = detail?.status ? [
    {
      id: detail.status.id,
      label: detail.status.status_name || detail.status.status_code || 'N/A',
      value: detail.status.id
    }
  ] : [];

  useEffect(() => {
    if (kwitansi) {
      setFormData({
        invoicePenagihanId: kwitansi.invoicePenagihanId || kwitansi.invoicePenagihan?.id || '',
        no_kwitansi: kwitansi.no_kwitansi || '',
        tanggal: toDateInputValue(kwitansi.tanggal),
        kepada: kwitansi.kepada || '',
        grand_total: kwitansi.grand_total != null ? String(kwitansi.grand_total) : '',
        termOfPaymentId: kwitansi.termOfPaymentId || kwitansi.termOfPayment?.id || '',
        statusId: kwitansi.statusId || kwitansi.status?.id || '',
      });
    }
  }, [kwitansi]);

  if (!kwitansi) return null;

  const detail = kwitansi || {};
  const statusCode = detail?.status?.status_code;

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset to original values
    if (kwitansi) {
      setFormData({
        invoicePenagihanId: kwitansi.invoicePenagihanId || kwitansi.invoicePenagihan?.id || '',
        no_kwitansi: kwitansi.no_kwitansi || '',
        tanggal: toDateInputValue(kwitansi.tanggal),
        kepada: kwitansi.kepada || '',
        grand_total: kwitansi.grand_total != null ? String(kwitansi.grand_total) : '',
        termOfPaymentId: kwitansi.termOfPaymentId || kwitansi.termOfPayment?.id || '',
        statusId: kwitansi.statusId || kwitansi.status?.id || '',
      });
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.no_kwitansi.trim()) {
      toastService.error('Nomor kwitansi wajib diisi');
      return;
    }
    if (!formData.kepada.trim()) {
      toastService.error('Nama penerima wajib diisi');
      return;
    }
    if (!formData.termOfPaymentId.trim()) {
      toastService.error('Term of payment wajib diisi');
      return;
    }
    if (!formData.statusId.trim()) {
      toastService.error('Status wajib diisi');
      return;
    }

    const grandTotalNumber = Number(formData.grand_total);
    if (
      formData.grand_total === '' ||
      Number.isNaN(grandTotalNumber) ||
      grandTotalNumber <= 0
    ) {
      toastService.error('Grand total harus berupa angka dan lebih besar dari 0');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        invoicePenagihanId: formData.invoicePenagihanId.trim(),
        no_kwitansi: formData.no_kwitansi.trim(),
        kepada: formData.kepada.trim(),
        grand_total: grandTotalNumber,
        termOfPaymentId: formData.termOfPaymentId.trim(),
        statusId: formData.statusId.trim(),
      };

      if (formData.tanggal) {
        const date = new Date(formData.tanggal);
        if (!Number.isNaN(date.getTime())) {
          payload.tanggal = date.toISOString();
        }
      }

      const result = await updateKwitansi(kwitansi.id, payload);
      
      if (result) {
        toastService.success('Kwitansi berhasil diperbarui');
        setIsEditMode(false);
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating kwitansi:', error);
      toastService.error(error.message || 'Gagal memperbarui kwitansi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Detail Kwitansi
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            {detail.no_kwitansi || 'No kwitansi available'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditMode ? (
            <>
              {updateKwitansi && (
                <button
                  onClick={handleEditClick}
                  className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}
              {onExport && (
                <button
                  onClick={() => onExport(detail)}
                  disabled={loading || exportLoading || !detail?.id}
                  className="inline-flex items-center px-3 py-2 border border-indigo-600 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  title="Print Kwitansi"
                >
                  {exportLoading ? (
                    <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-1'></span>
                  ) : (
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  )}
                  Print
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">Loading kwitansi details...</span>
        </div>
      ) : isEditMode ? (
        /* EDIT MODE */
        <div className="bg-gray-50 rounded-lg p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Penagihan <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  label=""
                  options={invoicePenagihanOptions}
                  value={formData.invoicePenagihanId}
                  onChange={handleInputChange('invoicePenagihanId')}
                  placeholder="Invoice Penagihan"
                  displayKey="label"
                  valueKey="id"
                  name="invoicePenagihanId"
                  required
                  disabled
                  showId
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Kwitansi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.no_kwitansi}
                  onChange={handleInputChange('no_kwitansi')}
                  placeholder="Contoh: KW-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Kwitansi
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={handleInputChange('tanggal')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.kepada}
                  onChange={handleInputChange('kepada')}
                  placeholder="Nama penerima kwitansi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grand Total (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.grand_total}
                  onChange={handleInputChange('grand_total')}
                  placeholder="Masukkan nominal grand total"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term of Payment <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  label=""
                  options={termOfPaymentOptions}
                  value={formData.termOfPaymentId}
                  onChange={handleInputChange('termOfPaymentId')}
                  placeholder="Cari Term of Payment"
                  displayKey="label"
                  valueKey="id"
                  name="termOfPaymentId"
                  required
                  loading={termOfPaymentLoading}
                  onSearch={searchTermOfPayments}
                  showId
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  label=""
                  options={statusOptions}
                  value={formData.statusId}
                  onChange={handleInputChange('statusId')}
                  placeholder="Status"
                  displayKey="label"
                  valueKey="id"
                  name="statusId"
                  required
                  disabled
                  showId
                />
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW MODE */
        <div>
          <TabContainer
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
          >
            <Tab id="overview" label="Overview" />
            <Tab id="invoice" label="Invoice Penagihan" />
            <Tab id="term" label="Term of Payment" />
            <Tab id="activity" label="Activity Timeline" />
          </TabContainer>

          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Informasi Utama */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Kwitansi</h3>
                  </div>
                  <InfoTable
                    data={[
                      { label: 'Nomor Kwitansi', value: detail.no_kwitansi || '-', copyable: true },
                      { label: 'Tanggal Kwitansi', value: formatDate(detail.tanggal) },
                      { label: 'Nama Penerima', value: detail.kepada || '-' },
                      { label: 'Grand Total', value: formatCurrency(detail.grand_total) },
                      {
                        label: 'Status',
                        component: statusCode ? (
                          <StatusBadge
                            status={statusCode}
                            variant={resolveStatusVariant(statusCode)}
                            dot
                          />
                        ) : <span>-</span>,
                      },
                    ]}
                  />
                </div>

                {/* Metadata */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Metadata</h3>
                  </div>
                  <InfoTable
                    data={[
                      { label: 'Dibuat Oleh', value: detail.createdBy || '-' },
                      { label: 'Tanggal Dibuat', value: formatDateTime(detail.createdAt) },
                      { label: 'Diperbarui Oleh', value: detail.updatedBy || '-' },
                      { label: 'Tanggal Diperbarui', value: formatDateTime(detail.updatedAt) },
                    ]}
                  />
                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Penagihan Terkait</h3>
                </div>
                <InfoTable
                  data={[
                    { label: 'Nomor Invoice', value: detail?.invoicePenagihan?.no_invoice_penagihan || detail?.invoicePenagihan?.no_invoice || '-', copyable: true },
                    { label: 'Tanggal Invoice', value: formatDate(detail?.invoicePenagihan?.tanggal) },
                    { label: 'Grand Total', value: formatCurrency(detail?.invoicePenagihan?.grand_total) },
                    { label: 'Customer', value: detail?.invoicePenagihan?.purchaseOrder?.customer?.namaCustomer || '-' },
                    { label: 'Kode Customer', value: detail?.invoicePenagihan?.purchaseOrder?.customer?.kodeCustomer || '-' },
                    { label: 'NPWP Customer', value: detail?.invoicePenagihan?.purchaseOrder?.customer?.NPWP || '-' },
                  ]}
                />
              </div>
            )}

            {activeTab === 'term' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Term of Payment</h3>
                </div>
                <InfoTable
                  data={[
                    { label: 'Kode TOP', value: detail?.termOfPayment?.kode_top || '-' },
                    { 
                      label: 'Batas Hari', 
                      value: detail?.termOfPayment?.batas_hari != null 
                        ? `${detail.termOfPayment.batas_hari} hari` 
                        : '-' 
                    },
                  ]}
                />
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <ActivityTimeline
                  auditTrails={detail.auditTrails || []}
                  title="Riwayat Perubahan"
                  emptyMessage="Belum ada riwayat perubahan."
                  showCount={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KwitansiDetailCard;
