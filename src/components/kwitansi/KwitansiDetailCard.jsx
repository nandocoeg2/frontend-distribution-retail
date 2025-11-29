import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  PencilIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';
import { InfoTable, StatusBadge, AccordionItem } from '../ui';
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
  onExportPaket,
  exportPaketLoading,
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

  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    invoice: false,
    term: false,
    activity: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-green-100">
            <DocumentTextIcon className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Kwitansi
              {isEditMode && <span className="ml-2 text-xs font-normal text-blue-600">(Editing)</span>}
            </h3>
            <p className="text-xs text-gray-600">{detail.no_kwitansi || '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isEditMode ? (
            <>
              {updateKwitansi && (
                <button
                  onClick={handleEditClick}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-white border border-blue-600 rounded hover:bg-blue-50"
                  title="Edit"
                >
                  <PencilIcon className="w-3 h-3 mr-1" />
                  Edit
                </button>
              )}
              {onExport && (
                <button
                  onClick={() => onExport(detail)}
                  disabled={loading || exportLoading || !detail?.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                  title="Print"
                >
                  {exportLoading ? (
                    <span className='inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-1'></span>
                  ) : (
                    <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                  )}
                  Print
                </button>
              )}
              {onExportPaket && (
                <button
                  onClick={() => onExportPaket(detail)}
                  disabled={loading || exportPaketLoading || !detail?.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
                  title="Print Paket"
                >
                  {exportPaketLoading ? (
                    <span className='inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-1'></span>
                  ) : (
                    <DocumentTextIcon className="w-3 h-3 mr-1" />
                  )}
                  Paket
                </button>
              )}
              {onClose && (
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" title="Close">
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="w-3 h-3 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-3 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-xs text-gray-600">Memuat...</span>
          </div>
        ) : isEditMode ? (
          <div className="bg-gray-50 rounded p-3">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Penagihan</label>
                  <Autocomplete
                    label=""
                    options={invoicePenagihanOptions}
                    value={formData.invoicePenagihanId}
                    onChange={handleInputChange('invoicePenagihanId')}
                    placeholder="Invoice"
                    displayKey="label"
                    valueKey="id"
                    name="invoicePenagihanId"
                    disabled
                    showId
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">No. Kwitansi *</label>
                  <input
                    type="text"
                    value={formData.no_kwitansi}
                    onChange={handleInputChange('no_kwitansi')}
                    placeholder="KW-2024-001"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={handleInputChange('tanggal')}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Penerima *</label>
                  <input
                    type="text"
                    value={formData.kepada}
                    onChange={handleInputChange('kepada')}
                    placeholder="Nama penerima"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grand Total *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.grand_total}
                    onChange={handleInputChange('grand_total')}
                    placeholder="0"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">TOP *</label>
                  <Autocomplete
                    label=""
                    options={termOfPaymentOptions}
                    value={formData.termOfPaymentId}
                    onChange={handleInputChange('termOfPaymentId')}
                    placeholder="Term of Payment"
                    displayKey="label"
                    valueKey="id"
                    name="termOfPaymentId"
                    loading={termOfPaymentLoading}
                    onSearch={searchTermOfPayments}
                    showId
                  />
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-2">
            <AccordionItem
              title="Info Kwitansi"
              isExpanded={expandedSections.basicInfo}
              onToggle={() => toggleSection('basicInfo')}
              bgColor="bg-green-50"
              compact
            >
              <InfoTable
                compact
                data={[
                  { label: 'No. Kwitansi', value: detail.no_kwitansi || '-', copyable: true },
                  { label: 'Tanggal', value: formatDate(detail.tanggal) },
                  { label: 'Penerima', value: detail.kepada || '-' },
                  { label: 'Grand Total', value: formatCurrency(detail.grand_total) },
                  {
                    label: 'Status',
                    component: statusCode ? (
                      <StatusBadge status={statusCode} variant={resolveStatusVariant(statusCode)} size="xs" dot />
                    ) : <span>-</span>,
                  },
                ]}
              />
            </AccordionItem>

            <AccordionItem
              title="Invoice Penagihan"
              isExpanded={expandedSections.invoice}
              onToggle={() => toggleSection('invoice')}
              bgColor="bg-blue-50"
              compact
            >
              <InfoTable
                compact
                data={[
                  { label: 'No. Invoice', value: detail?.invoicePenagihan?.no_invoice_penagihan || '-', copyable: true },
                  { label: 'Tanggal', value: formatDate(detail?.invoicePenagihan?.tanggal) },
                  { label: 'Total', value: formatCurrency(detail?.invoicePenagihan?.grand_total) },
                  { label: 'Customer', value: detail?.invoicePenagihan?.purchaseOrder?.customer?.namaCustomer || '-' },
                ]}
              />
            </AccordionItem>

            <AccordionItem
              title="Term of Payment"
              isExpanded={expandedSections.term}
              onToggle={() => toggleSection('term')}
              bgColor="bg-yellow-50"
              compact
            >
              <InfoTable
                compact
                data={[
                  { label: 'Kode TOP', value: detail?.termOfPayment?.kode_top || '-' },
                  { label: 'Batas Hari', value: detail?.termOfPayment?.batas_hari != null ? `${detail.termOfPayment.batas_hari} hari` : '-' },
                ]}
              />
            </AccordionItem>

            <AccordionItem
              title="Riwayat"
              isExpanded={expandedSections.activity}
              onToggle={() => toggleSection('activity')}
              bgColor="bg-gray-50"
              compact
            >
              <div className="py-1">
                <ActivityTimeline
                  auditTrails={detail.auditTrails || []}
                  emptyMessage="Belum ada riwayat."
                  showCount={false}
                />
              </div>
            </AccordionItem>
          </div>
        )}
      </div>
    </div>
  );
};

export default KwitansiDetailCard;
