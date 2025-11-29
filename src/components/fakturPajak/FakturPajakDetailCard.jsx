import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';
import { InfoTable, StatusBadge, AccordionItem } from '../ui';
import Autocomplete from '../common/Autocomplete';
import ActivityTimeline from '../common/ActivityTimeline';
import toastService from '@/services/toastService';
import useTermOfPaymentAutocomplete from '@/hooks/useTermOfPaymentAutocomplete';
import useCustomersPage from '@/hooks/useCustomersPage';
import fakturPajakService from '@/services/fakturPajakService';

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const toInputString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  return String(value);
};

const FakturPajakDetailCard = ({ fakturPajak, onClose, loading = false, updateFakturPajak, onUpdate }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    financial: false,
    customer: false,
    related: false,
    activity: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDppTouched, setIsDppTouched] = useState(false);
  const [isPpnTouched, setIsPpnTouched] = useState(false);
  const isDppTouchedRef = useRef(false);
  const isPpnTouchedRef = useRef(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    no_pajak: '',
    invoicePenagihanId: '',
    tanggal_invoice: '',
    laporanPenerimaanBarangId: '',
    customerId: '',
    total_harga_jual: '',
    potongan_harga: '',
    dasar_pengenaan_pajak: '',
    ppn_rp: '',
    ppn_percentage: '11',
    termOfPaymentId: '',
    statusId: '',
  });

  const {
    options: termOfPaymentOptions,
    loading: termOfPaymentLoading,
    fetchOptions: searchTermOfPayments
  } = useTermOfPaymentAutocomplete({
    selectedId: formData.termOfPaymentId
  });

  const {
    customers: customerResults = [],
    loading: customersLoading,
    searchCustomers,
  } = useCustomersPage();

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

  // Options for disabled autocomplete fields
  // invoicePenagihan from API is an array, get the first item or use direct ID
  const invoicePenagihanData = Array.isArray(detail?.invoicePenagihan) 
    ? detail.invoicePenagihan[0] 
    : detail?.invoicePenagihan;
  const invoicePenagihanOptions = invoicePenagihanData ? [
    {
      id: invoicePenagihanData.id,
      label: invoicePenagihanData.no_invoice_penagihan || invoicePenagihanData.no_invoice || 'N/A',
      value: invoicePenagihanData.id
    }
  ] : [];

  const laporanPenerimaanBarangOptions = detail?.laporanPenerimaanBarang ? [
    {
      id: detail.laporanPenerimaanBarang.id,
      label: detail.laporanPenerimaanBarang.no_lpb || 'N/A',
      value: detail.laporanPenerimaanBarang.id
    }
  ] : [];

  const statusOptions = detail?.status ? [
    {
      id: detail.status.id,
      label: detail.status.status_name || detail.status.status_code || 'N/A',
      value: detail.status.id
    }
  ] : [];

  const customerOptions = customerResults.length > 0 ? customerResults : (detail?.customer ? [{
    id: detail.customer.id,
    namaCustomer: detail.customer.nama_customer || detail.customer.namaCustomer,
  }] : []);

  // Sync formData with fakturPajak
  useEffect(() => {
    if (fakturPajak) {
      // Handle invoicePenagihan which can be an array from API
      const invoicePenagihanItem = Array.isArray(fakturPajak.invoicePenagihan) 
        ? fakturPajak.invoicePenagihan[0] 
        : fakturPajak.invoicePenagihan;
      
      setFormData({
        no_pajak: fakturPajak.no_pajak || '',
        invoicePenagihanId: fakturPajak.invoicePenagihanId || invoicePenagihanItem?.id || '',
        tanggal_invoice: toDateInputValue(fakturPajak.tanggal_invoice),
        laporanPenerimaanBarangId: fakturPajak.laporanPenerimaanBarangId || fakturPajak.laporanPenerimaanBarang?.id || '',
        customerId: fakturPajak.customerId || fakturPajak.customer?.id || '',
        total_harga_jual: toInputString(fakturPajak.total_harga_jual),
        potongan_harga: toInputString(fakturPajak.potongan_harga),
        dasar_pengenaan_pajak: toInputString(fakturPajak.dasar_pengenaan_pajak),
        ppn_rp: toInputString(fakturPajak.ppnRupiah || fakturPajak.ppn_rp),
        ppn_percentage: toInputString(fakturPajak.ppn_percentage != null ? fakturPajak.ppn_percentage : 11),
        termOfPaymentId: fakturPajak.termOfPaymentId || fakturPajak.termOfPayment?.id || '',
        statusId: fakturPajak.statusId || fakturPajak.status?.id || '',
      });
    }
  }, [fakturPajak]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setIsDppTouched(false);
    setIsPpnTouched(false);
    isDppTouchedRef.current = false;
    isPpnTouchedRef.current = false;
    // Reset to original values
    if (fakturPajak) {
      // Handle invoicePenagihan which can be an array from API
      const invoicePenagihanItem = Array.isArray(fakturPajak.invoicePenagihan) 
        ? fakturPajak.invoicePenagihan[0] 
        : fakturPajak.invoicePenagihan;
      
      setFormData({
        no_pajak: fakturPajak.no_pajak || '',
        invoicePenagihanId: fakturPajak.invoicePenagihanId || invoicePenagihanItem?.id || '',
        tanggal_invoice: toDateInputValue(fakturPajak.tanggal_invoice),
        laporanPenerimaanBarangId: fakturPajak.laporanPenerimaanBarangId || fakturPajak.laporanPenerimaanBarang?.id || '',
        customerId: fakturPajak.customerId || fakturPajak.customer?.id || '',
        total_harga_jual: toInputString(fakturPajak.total_harga_jual),
        potongan_harga: toInputString(fakturPajak.potongan_harga),
        dasar_pengenaan_pajak: toInputString(fakturPajak.dasar_pengenaan_pajak),
        ppn_rp: toInputString(fakturPajak.ppnRupiah || fakturPajak.ppn_rp),
        ppn_percentage: toInputString(fakturPajak.ppn_percentage != null ? fakturPajak.ppn_percentage : 11),
        termOfPaymentId: fakturPajak.termOfPaymentId || fakturPajak.termOfPayment?.id || '',
        statusId: fakturPajak.statusId || fakturPajak.status?.id || '',
      });
    }
  };

  const toNumber = useCallback((value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const numeric = Number(value);
    return Number.isNaN(numeric) ? 0 : numeric;
  }, []);

  const isBlank = (value) => value === '' || value === null || value === undefined;

  const recalculateDerivedValues = useCallback((draft) => {
    const next = { ...draft };

    if (!isDppTouchedRef.current) {
      if (isBlank(next.total_harga_jual) && isBlank(next.potongan_harga)) {
        next.dasar_pengenaan_pajak = '';
      } else {
        const total = toNumber(next.total_harga_jual);
        const discount = toNumber(next.potongan_harga);
        const dpp = Math.max(total - discount, 0);
        if (Number.isFinite(dpp)) {
          next.dasar_pengenaan_pajak = String(Math.round(dpp));
        }
      }
    }

    if (!isPpnTouchedRef.current) {
      if (isBlank(next.dasar_pengenaan_pajak) || isBlank(next.ppn_percentage)) {
        next.ppn_rp = '';
      } else {
        const dppValue = toNumber(next.dasar_pengenaan_pajak);
        const percentValue = toNumber(next.ppn_percentage);
        const ppn = dppValue * (percentValue / 100);
        if (Number.isFinite(ppn)) {
          next.ppn_rp = String(Math.round(ppn));
        }
      }
    }

    return next;
  }, [toNumber]);

  const updateFormData = useCallback((updater) => {
    setFormData((prev) => {
      const draft = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const recalculated = recalculateDerivedValues(draft);
      return recalculated;
    });
  }, [recalculateDerivedValues]);

  const handleInputChange = useCallback((field) => (event) => {
    const value = event?.target ? event.target.value : event;
    
    if (field === 'dasar_pengenaan_pajak') {
      isDppTouchedRef.current = true;
      setIsDppTouched(true);
      updateFormData((prev) => ({ ...prev, [field]: value }));
    } else if (field === 'ppn_rp') {
      isPpnTouchedRef.current = true;
      setIsPpnTouched(true);
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else if (field === 'ppn_percentage') {
      updateFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      updateFormData((prev) => ({ ...prev, [field]: value }));
    }
  }, [updateFormData]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toastService.error('Hanya file PDF yang diperbolehkan untuk bukti e-Faktur DJP');
      event.target.value = ''; // Reset input
      return;
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toastService.error('Ukuran file maksimal 10MB');
      event.target.value = ''; // Reset input
      return;
    }

    try {
      setUploading(true);
      const result = await fakturPajakService.uploadEvidencePdf(fakturPajak.id, file);

      if (result?.success) {
        const filename = result?.data?.filename || file.name;
        toastService.success(`Berhasil upload e-Faktur evidence: ${filename}`);
        
        // Refresh data if onUpdate callback exists
        if (onUpdate) {
          onUpdate();
        }
      } else {
        throw new Error(result?.error?.message || 'Upload gagal');
      }
    } catch (error) {
      console.error('Error uploading e-Faktur evidence:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Gagal upload bukti e-Faktur DJP';
      toastService.error(errorMessage);
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset input for next upload
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.no_pajak.trim()) {
      toastService.error('Nomor faktur pajak wajib diisi');
      return;
    }

    const nomorFakturRegex = /^\d{3}\.\d{3}-\d{2}\.\d{8}$/;
    if (!nomorFakturRegex.test(formData.no_pajak.trim())) {
      toastService.error('Format nomor faktur pajak harus XXX.XXX-XX.XXXXXXXX');
      return;
    }

    if (!formData.invoicePenagihanId.trim()) {
      toastService.error('Invoice penagihan ID wajib diisi');
      return;
    }

    if (!formData.tanggal_invoice) {
      toastService.error('Tanggal invoice wajib diisi');
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

    const totalHarga = Number(formData.total_harga_jual);
    if (formData.total_harga_jual === '' || Number.isNaN(totalHarga) || totalHarga < 0) {
      toastService.error('Total harga jual harus berupa angka dan tidak boleh negatif');
      return;
    }

    const dpp = Number(formData.dasar_pengenaan_pajak);
    if (formData.dasar_pengenaan_pajak === '' || Number.isNaN(dpp) || dpp < 0) {
      toastService.error('Dasar pengenaan pajak harus berupa angka dan tidak boleh negatif');
      return;
    }

    const ppnRp = Number(formData.ppn_rp);
    if (formData.ppn_rp === '' || Number.isNaN(ppnRp) || ppnRp < 0) {
      toastService.error('PPN (Rp) harus berupa angka dan tidak boleh negatif');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        no_pajak: formData.no_pajak.trim(),
        invoicePenagihanId: formData.invoicePenagihanId.trim(),
        tanggal_invoice: new Date(formData.tanggal_invoice).toISOString(),
        laporanPenerimaanBarangId: formData.laporanPenerimaanBarangId.trim(),
        customerId: formData.customerId.trim(),
        total_harga_jual: Number(formData.total_harga_jual),
        potongan_harga: formData.potongan_harga === '' ? 0 : Number(formData.potongan_harga),
        dasar_pengenaan_pajak: Number(formData.dasar_pengenaan_pajak),
        ppn_rp: Number(formData.ppn_rp),
        ppn_percentage: Number(formData.ppn_percentage),
        termOfPaymentId: formData.termOfPaymentId.trim(),
        statusId: formData.statusId.trim(),
      };

      const result = await updateFakturPajak(fakturPajak.id, payload);

      if (result) {
        toastService.success('Faktur pajak berhasil diperbarui');
        setIsEditMode(false);
        setIsDppTouched(false);
        setIsPpnTouched(false);
        isDppTouchedRef.current = false;
        isPpnTouchedRef.current = false;
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating faktur pajak:', error);
      toastService.error(error.message || 'Gagal memperbarui faktur pajak');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-orange-100">
            <DocumentTextIcon className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Faktur Pajak
              {isEditMode && <span className="ml-2 text-xs font-normal text-blue-600">(Editing)</span>}
            </h3>
            <p className="text-xs text-gray-600">{detail?.no_pajak || '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isEditMode ? (
            <>
              <button
                onClick={handleUploadClick}
                disabled={uploading || loading}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-white border border-green-600 rounded hover:bg-green-50 disabled:opacity-50"
                title="Upload e-Faktur"
              >
                <ArrowUpTrayIcon className="w-3 h-3 mr-1" />
                {uploading ? '...' : 'Upload'}
              </button>
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileSelect} className="hidden" />
              {updateFakturPajak && (
                <button
                  onClick={handleEditClick}
                  disabled={uploading}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-white border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
                  title="Edit"
                >
                  <PencilIcon className="w-3 h-3 mr-1" />
                  Edit
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
              <button onClick={handleCancelEdit} disabled={saving} className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">
                <CheckIcon className="w-3 h-3 mr-1" />
                {saving ? '...' : 'Save'}
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">No. Faktur *</label>
                  <input type="text" value={formData.no_pajak} onChange={handleInputChange('no_pajak')} placeholder="010.000-24.12345678" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Invoice</label>
                  <Autocomplete label="" options={invoicePenagihanOptions} value={formData.invoicePenagihanId} onChange={handleInputChange('invoicePenagihanId')} placeholder="Invoice" displayKey="label" valueKey="id" name="invoicePenagihanId" disabled showId />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal *</label>
                  <input type="date" value={formData.tanggal_invoice} onChange={handleInputChange('tanggal_invoice')} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">LPB</label>
                  <Autocomplete label="" options={laporanPenerimaanBarangOptions} value={formData.laporanPenerimaanBarangId} onChange={handleInputChange('laporanPenerimaanBarangId')} placeholder="LPB" displayKey="label" valueKey="id" name="laporanPenerimaanBarangId" disabled showId />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
                  <Autocomplete label="" options={customerOptions} value={formData.customerId} onChange={handleInputChange('customerId')} placeholder="Customer" displayKey="namaCustomer" valueKey="id" name="customerId" loading={customersLoading} onSearch={async (q) => { try { await searchCustomers(q, 1, 20); } catch (e) { console.error(e); } }} showId />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Harga *</label>
                  <input type="number" min="0" value={formData.total_harga_jual} onChange={handleInputChange('total_harga_jual')} placeholder="0" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Potongan</label>
                  <input type="number" min="0" value={formData.potongan_harga} onChange={handleInputChange('potongan_harga')} placeholder="0" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">DPP *</label>
                  <input type="number" min="0" value={formData.dasar_pengenaan_pajak} onChange={handleInputChange('dasar_pengenaan_pajak')} placeholder="0" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">PPN % *</label>
                  <input type="number" min="0" max="100" value={formData.ppn_percentage} onChange={handleInputChange('ppn_percentage')} placeholder="11" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">PPN Rp *</label>
                  <input type="number" min="0" value={formData.ppn_rp} onChange={handleInputChange('ppn_rp')} placeholder="0" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">TOP *</label>
                  <Autocomplete label="" options={termOfPaymentOptions} value={formData.termOfPaymentId} onChange={handleInputChange('termOfPaymentId')} placeholder="TOP" displayKey="label" valueKey="id" name="termOfPaymentId" loading={termOfPaymentLoading} onSearch={searchTermOfPayments} showId />
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-2">
            <AccordionItem title="Info Utama" isExpanded={expandedSections.main} onToggle={() => toggleSection('main')} bgColor="bg-orange-50" compact>
              <InfoTable compact data={[
                { label: 'No. Faktur', value: detail?.no_pajak, copyable: true },
                { label: 'Tanggal', value: detail?.tanggal_invoice ? formatDate(detail.tanggal_invoice) : '-' },
                { label: 'Status', component: <StatusBadge status={detail?.status?.status_name || detail?.status?.status_code || 'Unknown'} variant={statusVariant} size="xs" dot /> },
              ]} />
            </AccordionItem>

            <AccordionItem title="Keuangan" isExpanded={expandedSections.financial} onToggle={() => toggleSection('financial')} bgColor="bg-green-50" compact>
              <InfoTable compact data={[
                { label: 'Total Harga', value: formatCurrency(detail?.total_harga_jual) },
                { label: 'Potongan', value: formatCurrency(detail?.potongan_harga) },
                { label: 'DPP', value: formatCurrency(detail?.dasar_pengenaan_pajak) },
                { label: 'PPN', value: `${formatCurrency(detail?.ppn_rp)} (${detail?.ppn_percentage || 0}%)` },
                { label: 'TOP', value: detail?.termOfPayment?.kode_top || '-' },
              ]} />
            </AccordionItem>

            <AccordionItem title="Customer" isExpanded={expandedSections.customer} onToggle={() => toggleSection('customer')} bgColor="bg-blue-50" compact>
              <InfoTable compact data={[
                { label: 'Nama', value: detail?.customer?.nama_customer || detail?.customer?.namaCustomer || '-' },
                { label: 'Kode', value: detail?.customer?.kode_customer || detail?.customer?.kodeCustomer || '-' },
                { label: 'NPWP', value: detail?.customer?.npwp || detail?.customer?.NPWP || '-' },
              ]} />
            </AccordionItem>

            <AccordionItem title="Data Terkait" isExpanded={expandedSections.related} onToggle={() => toggleSection('related')} bgColor="bg-purple-50" compact>
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Invoice Penagihan:</div>
                {detail?.invoicePenagihan && Array.isArray(detail.invoicePenagihan) && detail.invoicePenagihan.length > 0 ? (
                  <div className="text-xs text-gray-600">
                    {detail.invoicePenagihan.map((inv, i) => (
                      <div key={inv.id || i}>{inv.no_invoice_penagihan || '-'} - {formatCurrency(inv.total_price)}</div>
                    ))}
                  </div>
                ) : <div className="text-xs text-gray-500">-</div>}
                <div className="text-xs font-medium text-gray-700 mt-2">LPB:</div>
                <div className="text-xs text-gray-600">{detail?.laporanPenerimaanBarang?.no_lpb || '-'}</div>
              </div>
            </AccordionItem>

            <AccordionItem title="Riwayat" isExpanded={expandedSections.activity} onToggle={() => toggleSection('activity')} bgColor="bg-gray-50" compact>
              {detail?.auditTrails && Array.isArray(detail.auditTrails) && detail.auditTrails.length > 0 ? (
                <ActivityTimeline auditTrails={detail.auditTrails.map((t) => ({ ...t, details: t.changes || {}, timestamp: t.timestamp, user: t.userId }))} showCount={false} emptyMessage="Tidak ada riwayat." />
              ) : (
                <div className="text-xs text-gray-500 py-2">Tidak ada riwayat.</div>
              )}
            </AccordionItem>
          </div>
        )}
      </div>
    </div>
  );
};

export default FakturPajakDetailCard;
