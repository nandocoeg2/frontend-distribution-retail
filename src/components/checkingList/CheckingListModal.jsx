import React, { useEffect, useMemo, useState } from 'react';
import FormModal from '../common/FormModal';

const defaultValues = {
  statusId: '',
  tanggal: '',
  checker: '',
  driver: '',
  mobil: '',
  kota: '',
};

const toDateTimeLocalValue = (value) => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const toIsoString = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const normalizeInitialValues = (initialValues) => {
  if (!initialValues || typeof initialValues !== 'object') {
    return defaultValues;
  }

  return {
    statusId: initialValues.statusId || initialValues.status?.id || '',
    tanggal: toDateTimeLocalValue(initialValues.tanggal),
    checker: initialValues.checker || '',
    driver: initialValues.driver || '',
    mobil: initialValues.mobil || '',
    kota: initialValues.kota || '',
  };
};

const CheckingListModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(normalizeInitialValues(initialValues));
    } else {
      setFormData(defaultValues);
      setIsSubmitting(false);
    }
  }, [initialValues, isOpen]);

  const modalTitle = useMemo(
    () =>
      isEdit
        ? 'Edit Checklist Surat Jalan'
        : 'Tambah Checklist Surat Jalan',
    [isEdit]
  );

  const modalSubtitle = useMemo(
    () =>
      isEdit
        ? 'Perbarui informasi checklist surat jalan yang dipilih.'
        : 'Lengkapi form berikut untuk membuat checklist surat jalan baru.',
    [isEdit]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        statusId: formData.statusId?.trim(),
        checker: formData.checker?.trim(),
        driver: formData.driver?.trim(),
        mobil: formData.mobil?.trim(),
        kota: formData.kota?.trim(),
      };

      const isoTanggal = toIsoString(formData.tanggal);
      if (isoTanggal) {
        payload.tanggal = isoTanggal;
      }

      await onSubmit(payload);
      onClose?.();
    } catch (error) {
      console.error('Failed to submit checklist surat jalan form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      show={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      isSubmitting={isSubmitting}
      isEdit={isEdit}
      handleSubmit={handleSubmit}
      entityName='Checklist Surat Jalan'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='md:col-span-2'>
          <label
            htmlFor='statusId'
            className='mb-1 block text-sm font-medium text-gray-700'
          >
            Status ID <span className='text-red-500'>*</span>
          </label>
          <input
            id='statusId'
            name='statusId'
            type='text'
            value={formData.statusId}
            onChange={handleChange}
            required
            placeholder='Masukkan ID status checklist'
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label
            htmlFor='tanggal'
            className='mb-1 block text-sm font-medium text-gray-700'
          >
            Tanggal Checklist <span className='text-red-500'>*</span>
          </label>
          <input
            id='tanggal'
            name='tanggal'
            type='datetime-local'
            value={formData.tanggal}
            onChange={handleChange}
            required
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label
            htmlFor='checker'
            className='mb-1 block text-sm font-medium text-gray-700'
          >
            Nama Checker <span className='text-red-500'>*</span>
          </label>
          <input
            id='checker'
            name='checker'
            type='text'
            value={formData.checker}
            onChange={handleChange}
            required
            placeholder='Nama checker'
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label
            htmlFor='driver'
            className='mb-1 block text-sm font-medium text-gray-700'
          >
            Nama Driver <span className='text-red-500'>*</span>
          </label>
          <input
            id='driver'
            name='driver'
            type='text'
            value={formData.driver}
            onChange={handleChange}
            required
            placeholder='Nama driver'
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label
            htmlFor='mobil'
            className='mb-1 block text-sm font-medium text-gray-700'
          >
            Nomor Kendaraan <span className='text-red-500'>*</span>
          </label>
          <input
            id='mobil'
            name='mobil'
            type='text'
            value={formData.mobil}
            onChange={handleChange}
            required
            placeholder='Contoh: B 1234 XYZ'
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label
            htmlFor='kota'
            className='mb-1 block text-sm font-medium text-gray-700'
          >
            Kota Tujuan <span className='text-red-500'>*</span>
          </label>
          <input
            id='kota'
            name='kota'
            type='text'
            value={formData.kota}
            onChange={handleChange}
            required
            placeholder='Kota tujuan pengiriman'
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>
      </div>
    </FormModal>
  );
};

export default CheckingListModal;
