import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import FormModal from '../common/FormModal';
import Autocomplete from '../common/Autocomplete';
import purchaseOrderService from '@/services/purchaseOrderService';
import customerService from '@/services/customerService';
import statusService from '@/services/statusService';
import toastService from '@/services/toastService';
import useTermOfPaymentAutocomplete from '@/hooks/useTermOfPaymentAutocomplete';
import { TabContainer, Tab, TabContent, TabPanel } from '../ui/Tabs.jsx';
import { formatDateTime } from '@/utils/formatUtils';
import HeroIcon from '../atoms/HeroIcon.jsx';
import { useNavigate } from 'react-router-dom';

const defaultFormValues = {
  purchaseOrderId: '',
  tanggal_po: '',
  customerId: '',
  termin_bayar: '',
  statusId: '',
  filesText: '',
  files: [],
};

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) {
    return '-';
  }

  const num = Number(bytes);
  if (!Number.isFinite(num) || num === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const toDateInput = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().split('T')[0];
};

const extractFileIds = (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    return '';
  }

  return files
    .map((file) => {
      if (typeof file === 'string') {
        return file;
      }
      if (file && typeof file === 'object') {
        return file.id || file.filename || '';
      }
      return '';
    })
    .filter(Boolean)
    .join(', ');
};

const extractArray = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (typeof payload === 'object') {
    const keys = ['data', 'results', 'items', 'records'];
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const value = payload[key];
        if (value && value !== payload) {
          const result = extractArray(value);
          if (result.length) {
            return result;
          }
        }
      }
    }
  }

  return [];
};

const mergeUniqueOptions = (incoming = [], existing = []) => {
  const map = new Map();
  [...incoming, ...existing].forEach((option) => {
    if (option && option.id) {
      map.set(option.id, option);
    }
  });
  return Array.from(map.values());
};

const mapPurchaseOrderOption = (po) => {
  if (!po) {
    return null;
  }

  const id = po.id || po.purchaseOrderId;
  if (!id) {
    return null;
  }

  const idString = String(id);
  const number = po.po_number || po.poNumber;
  const customerName =
    po.customer?.namaCustomer || po.customer?.name || po.customerName;
  const labelParts = [number, customerName].filter(Boolean);

  return {
    id: idString,
    label: labelParts.length ? labelParts.join(' - ') : idString,
  };
};

const mapCustomerOption = (customer) => {
  if (!customer) {
    return null;
  }

  const id = customer.id || customer.customerId;
  if (!id) {
    return null;
  }

  const idString = String(id);
  const labelParts = [
    customer.namaCustomer || customer.name,
    customer.kodeCustomer,
  ].filter(Boolean);

  return {
    id: idString,
    label: labelParts.length ? labelParts.join(' - ') : idString,
  };
};

const mapTermOption = (term) => {
  if (!term) {
    return null;
  }

  const id = term.id || term.termOfPaymentId;
  if (!id) {
    return null;
  }

  const idString = String(id);
  const labelParts = [term.kode_top, term.nama_top].filter(Boolean);

  return {
    id: idString,
    label: labelParts.length ? labelParts.join(' - ') : idString,
  };
};

const mapStatusOption = (status) => {
  if (!status) {
    return null;
  }

  const id = status.id;
  if (!id) {
    return null;
  }

  const idString = String(id);
  const labelParts = [status.status_name, status.status_code].filter(Boolean);

  return {
    id: idString,
    label: labelParts.length ? labelParts.join(' - ') : idString,
  };
};

const toIdString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value).trim();
  return stringValue;
};

const buildPayload = (values) => {
  const payload = {};

  const purchaseOrderId = values.purchaseOrderId?.trim();
  const customerId = values.customerId?.trim();

  if (purchaseOrderId) {
    payload.purchaseOrderId = purchaseOrderId;
  }

  if (values.tanggal_po) {
    const date = new Date(values.tanggal_po);
    if (!Number.isNaN(date.getTime())) {
      payload.tanggal_po = date.toISOString();
    }
  }

  if (customerId) {
    payload.customerId = customerId;
  }

  if (values.termin_bayar?.trim()) {
    payload.termin_bayar = values.termin_bayar.trim();
  }

  if (values.statusId?.trim()) {
    payload.statusId = values.statusId.trim();
  }

  if (values.filesText?.trim()) {
    const files = values.filesText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (files.length > 0) {
      payload.files = files;
    }
  }

  return payload;
};

const LaporanPenerimaanBarangModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues = null,
  isEdit = false,
  onBulkUpload = null,
  onBulkUploadTextExtraction = null,
  onFinished = null,
}) => {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState(defaultFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('bulk');
  const [uploadMode, setUploadMode] = useState('files');
  const [processingMethod, setProcessingMethod] = useState('text-extraction');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Refs for file inputs
  const bulkFileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [purchaseOrderOptions, setPurchaseOrderOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  const [purchaseOrderLoading, setPurchaseOrderLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const {
    options: termOptions,
    loading: termLoading,
    fetchOptions: fetchTermOptions,
    ensureOptionById: ensureTermOptionById,
    addOptions: addTermOptions
  } = useTermOfPaymentAutocomplete({
    selectedId: formValues.termin_bayar,
    initialFetch: false
  });

  const fetchPurchaseOrderOptions = useCallback(async (query = '') => {
    setPurchaseOrderLoading(true);
    try {
      const response = query
        ? await purchaseOrderService.searchPurchaseOrders(
          { po_number: query },
          1,
          10
        )
        : await purchaseOrderService.getAllPurchaseOrders(1, 10);

      const items = extractArray(response)
        .map(mapPurchaseOrderOption)
        .filter(Boolean);

      setPurchaseOrderOptions((prev) => mergeUniqueOptions(items, prev));
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      toastService.error('Gagal memuat data purchase order');
    } finally {
      setPurchaseOrderLoading(false);
    }
  }, []);

  const fetchCustomerOptions = useCallback(async (query = '') => {
    setCustomerLoading(true);
    try {
      const response = query
        ? await customerService.search(query, 1, 10)
        : await customerService.getAllCustomers(1, 10);

      const items = extractArray(response)
        .map(mapCustomerOption)
        .filter(Boolean);

      setCustomerOptions((prev) => mergeUniqueOptions(items, prev));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toastService.error('Gagal memuat data customer');
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const fetchStatusOptions = useCallback(async () => {
    setStatusLoading(true);
    try {
      const response = await statusService.getLaporanPenerimaanBarangStatuses();
      const items = extractArray(response).map(mapStatusOption).filter(Boolean);

      setStatusOptions((prev) => mergeUniqueOptions(items, prev));
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
      toastService.error('Gagal memuat data status');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    fetchPurchaseOrderOptions();
    fetchCustomerOptions();
    fetchTermOptions();
    fetchStatusOptions();
  }, [
    isOpen,
    fetchPurchaseOrderOptions,
    fetchCustomerOptions,
    fetchTermOptions,
    fetchStatusOptions,
  ]);

  const resetForm = useCallback(() => {
    setFormValues(defaultFormValues);
    setError(null);
    setSelectedFile(null);
    setLoading(false);
    setUploadMode('files');

    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Default to bulk tab for add mode, manual for edit mode
      setActiveTab(isEdit ? 'manual' : 'bulk');
      resetForm();
    } else {
      setActiveTab('bulk');
      setError(null);
      setSelectedFile(null);
      setLoading(false);
    }
  }, [isOpen, isEdit, resetForm]);

  // Additional effect to ensure state is cleared when tab changes
  useEffect(() => {
    if (isOpen) {
      // Force clear selected file when tab changes
      setSelectedFile(null);
      setUploadMode('files');
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const purchaseOrderOption = mapPurchaseOrderOption({
      id: initialValues?.purchaseOrderId || initialValues?.purchaseOrder?.id,
      po_number: initialValues?.purchaseOrder?.po_number,
      customer:
        initialValues?.purchaseOrder?.customer || initialValues?.customer,
    });

    const customerOption = mapCustomerOption(
      initialValues?.customer ||
      (initialValues?.customerId ? { id: initialValues.customerId } : null)
    );
    const termOption = mapTermOption(
      initialValues?.termOfPayment ||
      (initialValues?.termin_bayar
        ? { id: initialValues.termin_bayar }
        : null)
    );
    const statusOption = mapStatusOption(
      initialValues?.status ||
      (initialValues?.statusId ? { id: initialValues.statusId } : null)
    );

    if (purchaseOrderOption) {
      setPurchaseOrderOptions((prev) =>
        mergeUniqueOptions([purchaseOrderOption], prev)
      );
    }
    if (customerOption) {
      setCustomerOptions((prev) => mergeUniqueOptions([customerOption], prev));
    }
    if (termOption) {
      addTermOptions([termOption]);
    } else if (initialValues?.termin_bayar) {
      ensureTermOptionById(initialValues.termin_bayar);
    }
    if (statusOption) {
      setStatusOptions((prev) => mergeUniqueOptions([statusOption], prev));
    }
  }, [addTermOptions, ensureTermOptionById, initialValues, isOpen]);

  useEffect(() => {
    if (isOpen && !isEdit) {
      setFormValues(defaultFormValues);
      setIsSubmitting(false);
    } else if (isOpen && isEdit && initialValues) {
      setFormValues({
        purchaseOrderId: toIdString(
          initialValues?.purchaseOrderId || initialValues?.purchaseOrder?.id
        ),
        tanggal_po: toDateInput(
          initialValues?.tanggal_po || initialValues?.purchaseOrder?.tanggal_po
        ),
        customerId: toIdString(
          initialValues?.customerId || initialValues?.customer?.id
        ),
        termin_bayar: toIdString(
          initialValues?.termin_bayar || initialValues?.termOfPayment?.id
        ),
        statusId: toIdString(
          initialValues?.statusId || initialValues?.status?.id
        ),
        filesText: extractFileIds(initialValues?.files),
        files: Array.isArray(initialValues?.files) ? initialValues.files : [],
      });
      setIsSubmitting(false);
    }
  }, [initialValues, isOpen, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setError(null);
    const files = e.target.files;

    if (!files || files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = ['.pdf'];

    // Filter files based on allowed extensions
    const filteredFiles = Array.from(files).filter((file) =>
      allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    );

    // If in folder mode, automatically filter and allow upload
    if (uploadMode === 'folder') {
      if (filteredFiles.length === 0) {
        setError('Tidak ada file PDF (.pdf) ditemukan dalam folder yang dipilih.');
        setSelectedFile(null);
        if (folderInputRef.current) {
          folderInputRef.current.value = '';
        }
        return;
      }
      // Create a new FileList-like object with filtered files
      const dataTransfer = new DataTransfer();
      filteredFiles.forEach(file => dataTransfer.items.add(file));
      setSelectedFile(dataTransfer.files);
    } else {
      // In files mode, all files must be valid
      const allAllowed = Array.from(files).every((file) =>
        allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
      );
      if (!allAllowed) {
        setError('Pilih file PDF (.pdf) saja.');
        setSelectedFile(null);
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = '';
        }
        return;
      }
      setSelectedFile(files);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile || selectedFile.length === 0) {
      setError('Pilih minimal satu file PDF (.pdf) untuk diunggah.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use selected processing method
      const uploadFn = processingMethod === 'ai'
        ? onBulkUpload
        : onBulkUploadTextExtraction;

      if (typeof uploadFn !== 'function') {
        setError(
          processingMethod === 'ai'
            ? 'Fitur upload bulk dengan AI belum tersedia.'
            : 'Fitur upload bulk dengan Text Extraction belum tersedia.'
        );
        setLoading(false);
        return;
      }

      const result = await uploadFn({ files: Array.from(selectedFile) });

      if (result && result.success !== false) {
        const methodLabel = processingMethod === 'ai' ? 'AI' : 'Text Extraction';
        const data = result?.data || result;
        const successFiles = data?.successFiles;
        const errorFiles = data?.errorFiles;

        // Show appropriate toast based on results
        if (typeof successFiles === 'number' && typeof errorFiles === 'number') {
          if (errorFiles === 0) {
            toastService.success(`${successFiles} file berhasil diproses (${methodLabel})`);
          } else if (successFiles === 0) {
            toastService.error(`${errorFiles} file gagal diproses (${methodLabel})`);
          } else {
            toastService.warning(`${successFiles} file berhasil, ${errorFiles} file gagal (${methodLabel})`);
          }
        } else {
          toastService.success(data?.message || `File uploaded successfully using ${methodLabel}!`);
        }

        setSelectedFile(null);
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = '';
        }
        if (folderInputRef.current) {
          folderInputRef.current.value = '';
        }
        if (onFinished) onFinished();
        onClose();
      } else {
        throw new Error(result?.error || 'Gagal mengunggah file');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Gagal mengunggah file bulk';
      setError(errorMessage);
      toastService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = buildPayload(formValues);
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Failed to submit laporan penerimaan barang form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileList = (files) => {
    if (!Array.isArray(files) || files.length === 0) {
      return (
        <div className='text-center py-8 text-gray-500'>
          <p className='text-sm'>Tidak ada lampiran</p>
        </div>
      );
    }

    return (
      <ul className='space-y-3'>
        {files.map((file) => {
          const key = file?.id || file?.filename || file;
          return (
            <li
              key={key}
              className='flex items-start justify-between p-3 rounded-lg border border-gray-200 bg-white shadow-sm'
            >
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-900'>
                  {file?.originalName || file?.filename || key}
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  {file?.mimeType || file?.mimetype || 'Tipe tidak dikenal'} •{' '}
                  {formatFileSize(file?.size)}
                </p>
                {file?.createdAt && (
                  <p className='text-[11px] text-gray-400 mt-0.5'>
                    Diunggah: {formatDateTime(file.createdAt)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderManualForm = () => (
    <form onSubmit={handleManualSubmit}>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div>
          <Autocomplete
            label='Purchase Order'
            name='purchaseOrderId'
            options={purchaseOrderOptions}
            value={formValues.purchaseOrderId}
            onChange={handleChange}
            placeholder='Cari nomor PO atau customer'
            displayKey='label'
            valueKey='id'
            required
            loading={purchaseOrderLoading}
            onSearch={fetchPurchaseOrderOptions}
            showId
          />
        </div>

        <div>
          <label className='block mb-1 text-sm font-medium text-gray-700'>
            Tanggal PO
          </label>
          <input
            type='date'
            name='tanggal_po'
            value={formValues.tanggal_po}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <Autocomplete
            label='Customer'
            name='customerId'
            options={customerOptions}
            value={formValues.customerId}
            onChange={handleChange}
            placeholder='Cari customer'
            displayKey='label'
            valueKey='id'
            required
            loading={customerLoading}
            onSearch={fetchCustomerOptions}
            showId
          />
        </div>

        <div>
          <label className='block mb-1 text-sm font-medium text-gray-700'>
            TOP
          </label>
          <Autocomplete
            label=''
            name='termin_bayar'
            options={termOptions}
            value={formValues.termin_bayar}
            onChange={handleChange}
            placeholder='Cari Term of Payment'
            displayKey='label'
            valueKey='id'
            loading={termLoading}
            onSearch={fetchTermOptions}
            showId
          />
        </div>

        <div>
          <label className='block mb-1 text-sm font-medium text-gray-700'>
            Status
          </label>
          <select
            name='statusId'
            value={formValues.statusId}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            disabled={statusLoading}
          >
            <option value=''>Pilih status laporan</option>
            {statusOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className='md:col-span-2'>
          <label className='block mb-2 text-sm font-medium text-gray-700'>
            Lampiran File
          </label>
          <div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
            {renderFileList(formValues.files)}
          </div>
        </div>
      </div>

      <div className='flex justify-end mt-6 space-x-3'>
        <button
          type='button'
          onClick={onClose}
          className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
          disabled={isSubmitting}
        >
          Batal
        </button>
        <button
          type='submit'
          className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah LPB'}
        </button>
      </div>
    </form>
  );

  const renderBulkUploadTab = () => (
    <div className='bulk-upload-tab'>
      {/* History Upload Bulk Button */}
      <div className='p-4 mb-4 border border-blue-200 rounded-md bg-blue-50'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <svg
              className='w-4 h-4 text-blue-500 mt-0.5 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <div>
              <h4 className='text-sm font-medium text-blue-800'>
                Riwayat Upload Bulk
              </h4>
              <p className='text-sm text-blue-700'>
                Lihat history upload bulk sebelumnya
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/laporan-penerimaan-barang/bulk-history')}
            className='inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors'
          >
            <HeroIcon name='clock' className='w-4 h-4 mr-1' />
            Lihat History
          </button>
        </div>
      </div>

      <div className='space-y-4'>
        <div>
          <label className='block mb-2 text-sm font-medium text-gray-700'>
            Upload Bulk Laporan Penerimaan Barang (PDF)
          </label>

          {/* Processing Method Selection */}
          <div className='mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md'>
            <label className='block mb-2 text-sm font-medium text-gray-700'>
              Processing Method
            </label>
            <div className='flex items-start space-x-6'>
              <label className='flex items-start space-x-2 cursor-pointer'>
                <input
                  type='radio'
                  name='processingMethod'
                  value='text-extraction'
                  checked={processingMethod === 'text-extraction'}
                  onChange={(e) => setProcessingMethod(e.target.value)}
                  className='w-4 h-4 text-blue-600 mt-0.5'
                />
                <div>
                  <span className='text-sm font-medium text-gray-700'>Normal Method</span>
                </div>
              </label>
              <label className='flex items-start space-x-2 cursor-pointer'>
                <input
                  type='radio'
                  name='processingMethod'
                  value='ai'
                  checked={processingMethod === 'ai'}
                  onChange={(e) => setProcessingMethod(e.target.value)}
                  className='w-4 h-4 text-blue-600 mt-0.5'
                />
                <div>
                  <span className='text-sm font-medium text-gray-700'>AI Method</span>
                </div>
              </label>
            </div>
          </div>

          {/* Upload Mode Selection */}
          <div className='flex items-center space-x-6 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md'>
            <label className='flex items-center space-x-2 cursor-pointer'>
              <input
                type='radio'
                name='uploadMode'
                value='files'
                checked={uploadMode === 'files'}
                onChange={(e) => {
                  setUploadMode(e.target.value);
                  setSelectedFile(null);
                  if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
                  if (folderInputRef.current) folderInputRef.current.value = '';
                }}
                className='w-4 h-4 text-blue-600'
              />
              <span className='text-sm text-gray-700'>Upload Files</span>
            </label>
            <label className='flex items-center space-x-2 cursor-pointer'>
              <input
                type='radio'
                name='uploadMode'
                value='folder'
                checked={uploadMode === 'folder'}
                onChange={(e) => {
                  setUploadMode(e.target.value);
                  setSelectedFile(null);
                  if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
                  if (folderInputRef.current) folderInputRef.current.value = '';
                }}
                className='w-4 h-4 text-blue-600'
              />
              <span className='text-sm text-gray-700'>Upload Folder</span>
            </label>
          </div>

          {/* File Input */}
          {uploadMode === 'files' && (
            <div className='flex items-center space-x-2'>
              <input
                ref={bulkFileInputRef}
                type='file'
                multiple
                onChange={handleFileChange}
                accept='.pdf'
                className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
              />
            </div>
          )}

          {/* Folder Input */}
          {uploadMode === 'folder' && (
            <div className='flex items-center space-x-2'>
              <input
                ref={folderInputRef}
                type='file'
                webkitdirectory=''
                directory=''
                multiple
                onChange={handleFileChange}
                className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100'
              />
            </div>
          )}
        </div>

        {error && (
          <div className='p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-md'>
            {error}
          </div>
        )}

        {/* Selected Files Info */}
        {selectedFile && selectedFile.length > 0 && (
          <div className='p-3 border border-gray-200 rounded-md bg-gray-50'>
            <p className='text-sm font-medium text-gray-700 mb-2'>
              {selectedFile.length} file dipilih
            </p>
            <div className='max-h-32 overflow-y-auto space-y-1'>
              {Array.from(selectedFile).map((file, index) => (
                <div key={index} className='flex items-center text-xs text-gray-600'>
                  <svg
                    className='flex-shrink-0 w-4 h-4 text-blue-500 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  <span className='truncate'>{file.name}</span>
                  <span className='ml-2 text-gray-400'>({formatFileSize(file.size)})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='p-3 border border-yellow-200 rounded-md bg-yellow-50'>
          <div className='flex'>
            <svg
              className='w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
            <div>
              <h4 className='text-sm font-medium text-yellow-800'>
                Informasi Upload
              </h4>
              <p className='mt-1 text-sm text-yellow-700'>
                Pilih satu atau beberapa file PDF (.pdf)
              </p>
            </div>
          </div>
        </div>

        <div className='flex justify-end mt-6 space-x-3'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
            disabled={loading}
          >
            Batal
          </button>
          <button
            type='button'
            onClick={handleBulkUpload}
            className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50'
            disabled={!selectedFile || loading}
          >
            {loading ? 'Mengunggah...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  const modalTitle = isEdit
    ? 'Edit Laporan Penerimaan Barang'
    : 'Tambah Laporan Penerimaan Barang';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75'>
      <div className='bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            {modalTitle}
          </h3>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
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

        {/* Tab Navigation - Only show tabs for add mode */}
        {!isEdit && (
          <TabContainer
            activeTab={activeTab}
            onTabChange={(tabId) => {
              setActiveTab(tabId);
              resetForm();
            }}
            variant='underline'
            className='mb-6'
          >
            <Tab
              id='bulk'
              label='Bulk Upload'
              icon={
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10'
                  />
                </svg>
              }
            />
            <Tab
              id='manual'
              label='Manual Input'
              icon={
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
              }
            />
          </TabContainer>
        )}

        {/* Tab Content */}
        {!isEdit ? (
          <TabContent activeTab={activeTab}>
            <TabPanel tabId='bulk'>
              {renderBulkUploadTab()}
            </TabPanel>
            <TabPanel tabId='manual'>
              {renderManualForm()}
            </TabPanel>
          </TabContent>
        ) : (
          renderManualForm()
        )}
      </div>
    </div>
  );
};

export default LaporanPenerimaanBarangModal;
