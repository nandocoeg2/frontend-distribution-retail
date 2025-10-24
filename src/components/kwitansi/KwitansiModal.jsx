import React, { useEffect, useState } from 'react';
import FormModal from '../common/FormModal';
import Autocomplete from '../common/Autocomplete';
import toastService from '@/services/toastService';
import useTermOfPaymentAutocomplete from '@/hooks/useTermOfPaymentAutocomplete';

const DEFAULT_FORM_VALUES = {
  invoicePenagihanId: '',
  no_kwitansi: '',
  tanggal: '',
  kepada: '',
  grand_total: '',
  termOfPaymentId: '',
  statusId: '',
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

const mapInitialValues = (initialValues = {}) => ({
  invoicePenagihanId:
    initialValues.invoicePenagihanId ||
    initialValues.invoicePenagihan?.id ||
    '',
  no_kwitansi: initialValues.no_kwitansi || '',
  tanggal: toDateInputValue(initialValues.tanggal),
  kepada:
    initialValues.kepada ||
    initialValues.invoicePenagihan?.customer?.nama_customer ||
    '',
  grand_total:
    initialValues.grand_total != null
      ? String(initialValues.grand_total)
      : '',
  termOfPaymentId:
    initialValues.termOfPaymentId || initialValues.termOfPayment?.id || '',
  statusId: initialValues.statusId || initialValues.status?.id || '',
});

const KwitansiModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState(DEFAULT_FORM_VALUES);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    options: termOfPaymentOptions,
    loading: termOfPaymentLoading,
    fetchOptions: searchTermOfPayments
  } = useTermOfPaymentAutocomplete({
    selectedId: formData.termOfPaymentId
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(mapInitialValues(initialValues));
      setErrors({});
    } else {
      setFormData(DEFAULT_FORM_VALUES);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialValues]);

  const handleChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.invoicePenagihanId.trim()) {
      nextErrors.invoicePenagihanId = 'Invoice penagihan ID wajib diisi.';
    }

    if (!formData.no_kwitansi.trim()) {
      nextErrors.no_kwitansi = 'Nomor kwitansi wajib diisi.';
    }

    if (!formData.kepada.trim()) {
      nextErrors.kepada = 'Nama penerima wajib diisi.';
    }

    if (!formData.termOfPaymentId.trim()) {
      nextErrors.termOfPaymentId = 'Term of payment ID wajib diisi.';
    }

    if (!formData.statusId.trim()) {
      nextErrors.statusId = 'Status ID wajib diisi.';
    }

    const grandTotalNumber = Number(formData.grand_total);
    if (
      formData.grand_total === '' ||
      Number.isNaN(grandTotalNumber) ||
      grandTotalNumber <= 0
    ) {
      nextErrors.grand_total =
        'Grand total harus berupa angka dan lebih besar dari 0.';
    }

    if (formData.tanggal) {
      const date = new Date(formData.tanggal);
      if (Number.isNaN(date.getTime())) {
        nextErrors.tanggal = 'Tanggal kwitansi tidak valid.';
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toastService.error('Mohon lengkapi field yang wajib diisi.');
      return;
    }

    const payload = {
      invoicePenagihanId: formData.invoicePenagihanId.trim(),
      no_kwitansi: formData.no_kwitansi.trim(),
      kepada: formData.kepada.trim(),
      grand_total: Number(formData.grand_total),
      termOfPaymentId: formData.termOfPaymentId.trim(),
      statusId: formData.statusId.trim(),
    };

    if (formData.tanggal) {
      const date = new Date(formData.tanggal);
      payload.tanggal = date.toISOString();
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(payload);
      if (!isEdit) {
        setFormData(DEFAULT_FORM_VALUES);
      }
    } catch (err) {
      console.error('Failed to submit kwitansi form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isEdit ? 'Ubah Kwitansi' : 'Tambah Kwitansi';
  const subtitle = isEdit
    ? 'Perbarui informasi kwitansi dan pastikan data pembayaran sudah sesuai.'
    : 'Lengkapi data berikut untuk membuat kwitansi baru.';

  return (
    <FormModal
      show={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      isSubmitting={isSubmitting}
      isEdit={isEdit}
      handleSubmit={handleSubmit}
      entityName='Kwitansi'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Invoice Penagihan ID <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={formData.invoicePenagihanId}
            onChange={handleChange('invoicePenagihanId')}
            placeholder='Masukkan ID invoice penagihan'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.invoicePenagihanId && (
            <p className='mt-1 text-xs text-red-600'>
              {errors.invoicePenagihanId}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nomor Kwitansi <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={formData.no_kwitansi}
            onChange={handleChange('no_kwitansi')}
            placeholder='Contoh: KW-2024-001'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.no_kwitansi && (
            <p className='mt-1 text-xs text-red-600'>{errors.no_kwitansi}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Tanggal Kwitansi
          </label>
          <input
            type='date'
            value={formData.tanggal}
            onChange={handleChange('tanggal')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.tanggal && (
            <p className='mt-1 text-xs text-red-600'>{errors.tanggal}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nama Penerima <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={formData.kepada}
            onChange={handleChange('kepada')}
            placeholder='Nama penerima kwitansi'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.kepada && (
            <p className='mt-1 text-xs text-red-600'>{errors.kepada}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Grand Total (IDR) <span className='text-red-500'>*</span>
          </label>
          <input
            type='number'
            min='0'
            step='0.01'
            value={formData.grand_total}
            onChange={handleChange('grand_total')}
            placeholder='Masukkan nominal grand total'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.grand_total && (
            <p className='mt-1 text-xs text-red-600'>{errors.grand_total}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Term of Payment ID <span className='text-red-500'>*</span>
          </label>
          <Autocomplete
            label=''
            options={termOfPaymentOptions}
            value={formData.termOfPaymentId}
            onChange={handleChange('termOfPaymentId')}
            placeholder='Cari Term of Payment'
            displayKey='label'
            valueKey='id'
            name='termOfPaymentId'
            required
            loading={termOfPaymentLoading}
            onSearch={searchTermOfPayments}
            showId
          />
          {errors.termOfPaymentId && (
            <p className='mt-1 text-xs text-red-600'>
              {errors.termOfPaymentId}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status ID <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={formData.statusId}
            onChange={handleChange('statusId')}
            placeholder='Masukkan ID status kwitansi'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.statusId && (
            <p className='mt-1 text-xs text-red-600'>{errors.statusId}</p>
          )}
        </div>
      </div>
    </FormModal>
  );
};

export default KwitansiModal;
