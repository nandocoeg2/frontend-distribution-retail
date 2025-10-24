import React, { useCallback, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '@/components/common/Autocomplete';
import useCompanyAutocomplete from '@/hooks/useCompanyAutocomplete';
import useCustomersPage from '@/hooks/useCustomersPage';
import fakturPajakService from '@/services/fakturPajakService';
import toastService from '@/services/toastService';

const EXPORT_INITIAL_VALUES = {
  format: 'json',
  companyId: '',
  customerId: '',
  statusId: '',
  tanggal_start: '',
  tanggal_end: '',
};

const resolveFilenameFromHeader = (contentDisposition, fallbackName) => {
  if (!contentDisposition || typeof contentDisposition !== 'string') {
    return fallbackName;
  }

  const filenameMatch = contentDisposition.match(
    /filename\*?=(?:UTF-8'')?([^;]+)/i
  );

  if (filenameMatch && filenameMatch[1]) {
    const raw = filenameMatch[1].trim().replace(/^["']|["']$/g, '');
    try {
      return decodeURIComponent(raw);
    } catch (error) {
      return raw;
    }
  }

  return fallbackName;
};

const extractErrorMessage = async (error) => {
  const defaultMessage = 'Gagal mengekspor e-Faktur DJP';
  if (!error) {
    return defaultMessage;
  }

  if (error?.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      if (!text) {
        return defaultMessage;
      }

      try {
        const parsed = JSON.parse(text);
        return (
          parsed?.error?.message ||
          parsed?.message ||
          parsed?.error ||
          defaultMessage
        );
      } catch (jsonError) {
        return text;
      }
    } catch (blobError) {
      return defaultMessage;
    }
  }

  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    defaultMessage
  );
};

const FakturPajakExportModal = ({ isOpen, onClose }) => {
  const [formValues, setFormValues] = useState(EXPORT_INITIAL_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    options: companyOptions,
    loading: companyLoading,
    searchCompanies: searchCompanyOptions,
    fetchOptions: fetchCompanyOptions,
  } = useCompanyAutocomplete({
    selectedValue: formValues.companyId,
    initialFetch: false,
    pageSize: 20,
  });

  const {
    customers: customerOptions = [],
    searchCustomers,
    fetchCustomers,
    loading: customersLoading,
    searchLoading: customersSearching,
  } = useCustomersPage();

  const customerAutocompleteLoading = Boolean(
    customersLoading || customersSearching
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues(EXPORT_INITIAL_VALUES);
    setErrorMessage('');

    fetchCompanyOptions('').catch((err) => {
      console.error('Failed to preload companies:', err);
    });

    fetchCustomers(1, 20).catch((err) => {
      console.error('Failed to preload customers:', err);
    });
  }, [fetchCompanyOptions, fetchCustomers, isOpen]);

  const handleClose = useCallback((force = false) => {
    if (submitting && !force) {
      return;
    }

    setFormValues(EXPORT_INITIAL_VALUES);
    setErrorMessage('');
    onClose?.();
  }, [onClose, submitting]);

  const handleFieldChange = useCallback((field) => {
    return (event) => {
      const value = event?.target ? event.target.value : event;
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }));
      setErrorMessage('');
    };
  }, []);

  const validateForm = useCallback(() => {
    if (formValues.tanggal_start && formValues.tanggal_end) {
      const start = new Date(formValues.tanggal_start);
      const end = new Date(formValues.tanggal_end);
      if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime())) {
        if (end < start) {
          setErrorMessage(
            'Tanggal akhir tidak boleh lebih awal dari tanggal mulai.'
          );
          return false;
        }
      }
    }
    return true;
  }, [formValues.tanggal_end, formValues.tanggal_start]);

  const buildParams = useCallback(() => {
    const params = {
      format: formValues.format || 'json',
    };

    const fields = [
      'companyId',
      'customerId',
      'statusId',
      'tanggal_start',
      'tanggal_end',
    ];

    fields.forEach((field) => {
      const value = formValues[field];
      if (value === null || value === undefined) {
        return;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== '') {
          params[field] = trimmed;
        }
        return;
      }

      params[field] = value;
    });

    return params;
  }, [formValues]);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (submitting) {
        return;
      }

      if (!validateForm()) {
        return;
      }

      const params = buildParams();
      setSubmitting(true);
      setErrorMessage('');

      try {
        const response = await fakturPajakService.exportFakturPajak(params);
        const format =
          typeof params.format === 'string'
            ? params.format.toLowerCase()
            : 'json';
        const contentType =
          response?.headers?.['content-type'] ||
          response?.headers?.get?.('content-type') ||
          (format === 'xml' ? 'application/xml' : 'application/json');

        const defaultFilename = `efaktur-djp-${Date.now()}.${
          format === 'xml' ? 'xml' : 'json'
        }`;

        const filename = resolveFilenameFromHeader(
          response?.headers?.['content-disposition'] ||
            response?.headers?.get?.('content-disposition'),
          defaultFilename
        );

        const blob =
          response?.data instanceof Blob
            ? response.data
            : new Blob([response?.data], { type: contentType });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toastService.success('Export e-Faktur DJP berhasil');
        handleClose(true);
      } catch (error) {
        console.error('Failed to export e-Faktur DJP:', error);
        const message = await extractErrorMessage(error);
        setErrorMessage(message);
        toastService.error(message);
      } finally {
        setSubmitting(false);
      }
    },
    [buildParams, handleClose, submitting, validateForm]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4'>
      <div className='w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden'>
        <div className='flex items-start justify-between px-6 py-4 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Export e-Faktur DJP
            </h2>
            <p className='text-sm text-gray-500'>
              Tentukan parameter export sebelum mengunduh berkas JSON atau XML.
            </p>
          </div>
          <button
            type='button'
            onClick={handleClose}
            className='p-2 text-gray-500 transition-colors duration-150 rounded-lg hover:bg-gray-100'
            aria-label='Tutup export e-Faktur DJP'
          >
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='px-6 py-5 space-y-5'>
            {errorMessage && (
              <div className='p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg'>
                {errorMessage}
              </div>
            )}

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Format File
                </label>
                <select
                  value={formValues.format}
                  onChange={handleFieldChange('format')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='json'>JSON</option>
                  <option value='xml'>XML</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Status Faktur Pajak (Opsional)
                </label>
                <input
                  type='text'
                  value={formValues.statusId}
                  onChange={handleFieldChange('statusId')}
                  placeholder='Masukkan ID status terkait'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <p className='mt-1 text-xs text-gray-500'>
                  Biarkan kosong untuk semua status.
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Perusahaan
                </label>
                <Autocomplete
                  options={companyOptions}
                  value={formValues.companyId}
                  onChange={handleFieldChange('companyId')}
                  placeholder='Cari atau pilih perusahaan'
                  displayKey='label'
                  valueKey='id'
                  name='companyId'
                  loading={companyLoading}
                  onSearch={searchCompanyOptions}
                  showId
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Customer
                </label>
                <Autocomplete
                  options={Array.isArray(customerOptions) ? customerOptions : []}
                  value={formValues.customerId}
                  onChange={handleFieldChange('customerId')}
                  placeholder='Cari nama atau ID customer'
                  displayKey='namaCustomer'
                  valueKey='id'
                  name='customerId'
                  loading={customerAutocompleteLoading}
                  onSearch={(query) =>
                    searchCustomers(query, 1, 20).catch((err) => {
                      console.error('Failed to search customers:', err);
                    })
                  }
                  showId
                />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tanggal Mulai
                </label>
                <input
                  type='date'
                  value={formValues.tanggal_start}
                  onChange={handleFieldChange('tanggal_start')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tanggal Akhir
                </label>
                <input
                  type='date'
                  value={formValues.tanggal_end}
                  onChange={handleFieldChange('tanggal_end')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>
          </div>

          <div className='flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200'>
            <button
              type='button'
              onClick={handleClose}
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
            >
              Batal
            </button>
            <button
              type='submit'
              disabled={submitting}
              className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed'
            >
              {submitting ? 'Memproses...' : 'Export'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FakturPajakExportModal;
