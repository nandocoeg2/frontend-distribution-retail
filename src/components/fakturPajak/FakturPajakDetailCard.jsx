import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  ClockIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  InboxStackIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';
import { TabContainer, Tab, TabContent, TabPanel, InfoTable, StatusBadge } from '../ui';
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
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
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
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Detail Faktur Pajak
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            {detail?.no_pajak || 'No faktur pajak available'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditMode ? (
            <>
              <button
                onClick={handleUploadClick}
                disabled={uploading || loading}
                className="inline-flex items-center px-3 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload e-Faktur DJP Evidence"
              >
                <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
                {uploading ? 'Uploading...' : 'Upload e-Faktur'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {updateFakturPajak && (
                <button
                  onClick={handleEditClick}
                  disabled={uploading}
                  className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
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
          <span className="ml-3 text-sm text-gray-600">Loading faktur pajak details...</span>
        </div>
      ) : isEditMode ? (
        /* EDIT MODE */
        <div className="bg-gray-50 rounded-lg p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Faktur Pajak <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.no_pajak}
                  onChange={handleInputChange('no_pajak')}
                  placeholder="010.000-24.12345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                  Tanggal Invoice <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggal_invoice}
                  onChange={handleInputChange('tanggal_invoice')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Laporan Penerimaan Barang <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  label=""
                  options={laporanPenerimaanBarangOptions}
                  value={formData.laporanPenerimaanBarangId}
                  onChange={handleInputChange('laporanPenerimaanBarangId')}
                  placeholder="Laporan Penerimaan Barang"
                  displayKey="label"
                  valueKey="id"
                  name="laporanPenerimaanBarangId"
                  required
                  disabled
                  showId
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  label=""
                  options={customerOptions}
                  value={formData.customerId}
                  onChange={handleInputChange('customerId')}
                  placeholder="Cari nama atau ID customer"
                  displayKey="namaCustomer"
                  valueKey="id"
                  name="customerId"
                  required
                  loading={customersLoading}
                  onSearch={async (query) => {
                    try {
                      await searchCustomers(query, 1, 20);
                    } catch (error) {
                      console.error('Failed to search customers:', error);
                    }
                  }}
                  showId
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Harga Jual (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.total_harga_jual}
                  onChange={handleInputChange('total_harga_jual')}
                  placeholder="Masukkan total harga jual"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Potongan Harga (IDR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.potongan_harga}
                  onChange={handleInputChange('potongan_harga')}
                  placeholder="Masukkan potongan (opsional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dasar Pengenaan Pajak (DPP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.dasar_pengenaan_pajak}
                  onChange={handleInputChange('dasar_pengenaan_pajak')}
                  placeholder="Total harga jual - potongan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persentase PPN (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.ppn_percentage}
                  onChange={handleInputChange('ppn_percentage')}
                  placeholder="Contoh: 11"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PPN (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.ppn_rp}
                  onChange={handleInputChange('ppn_rp')}
                  placeholder="DPP x % PPN"
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
