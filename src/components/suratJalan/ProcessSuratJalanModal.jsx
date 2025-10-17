import React, { useEffect, useMemo, useState } from 'react';
import { BaseModal, ModalHeader } from '../common/ModalComponents';

const STATUS_CODE_PLACEHOLDER = 'PENDING CHECKLIST SURAT JALAN';

const createDefaultFormValues = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - timezoneOffset * 60000);

  return {
    status_code: STATUS_CODE_PLACEHOLDER,
    tanggal: localDate.toISOString().slice(0, 16),
    checker: '',
    driver: '',
    mobil: '',
    kota: '',
  };
};

const fieldLabels = {
  status_code: 'Status Checklist',
  tanggal: 'Tanggal Checklist',
  checker: 'Checker',
  driver: 'Driver',
  mobil: 'Mobil',
  kota: 'Kota',
};

const ProcessSuratJalanModal = ({
  show,
  onClose,
  onSubmit,
  isSubmitting = false,
  selectedItems = [],
  selectedIds = [],
}) => {
  const [formValues, setFormValues] = useState(createDefaultFormValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      setFormValues(createDefaultFormValues());
      setErrors({});
    }
  }, [show]);

  const selectedSummary = useMemo(() => {
    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      return selectedIds;
    }

    return selectedItems.map((item) => {
      if (!item) {
        return null;
      }

      return {
        id: item.id,
        display:
          item.no_surat_jalan ||
          item.noSuratJalan ||
          item.deliver_to ||
          item.deliverTo ||
          item.id,
        subtitle: item.deliver_to || item.deliverTo || undefined,
      };
    });
  }, [selectedIds, selectedItems]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formValues.status_code?.trim()) {
      nextErrors.status_code = 'Status checklist wajib diisi.';
    }

    if (!formValues.tanggal) {
      nextErrors.tanggal = 'Tanggal checklist wajib diisi.';
    } else {
      const parsedDate = new Date(formValues.tanggal);
      if (Number.isNaN(parsedDate.getTime())) {
        nextErrors.tanggal = 'Format tanggal tidak valid.';
      }
    }

    if (!formValues.checker?.trim()) {
      nextErrors.checker = 'Nama checker wajib diisi.';
    }

    if (!formValues.driver?.trim()) {
      nextErrors.driver = 'Nama driver wajib diisi.';
    }

    if (!formValues.mobil?.trim()) {
      nextErrors.mobil = 'Informasi kendaraan wajib diisi.';
    }

    if (!formValues.kota?.trim()) {
      nextErrors.kota = 'Kota tujuan wajib diisi.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const checklistDate = new Date(formValues.tanggal);

    if (Number.isNaN(checklistDate.getTime())) {
      setErrors((prev) => ({
        ...prev,
        tanggal: 'Format tanggal tidak valid.',
      }));
      return;
    }

    const payload = {
      status_code: formValues.status_code.trim(),
      tanggal: checklistDate.toISOString(),
      checker: formValues.checker.trim(),
      driver: formValues.driver.trim(),
      mobil: formValues.mobil.trim(),
      kota: formValues.kota.trim(),
    };

    await onSubmit(payload);
  };

  if (!show) {
    return null;
  }

  return (
    <BaseModal show={show} onClose={onClose} maxWidth='max-w-3xl'>
      <form className='flex h-full flex-col' onSubmit={handleSubmit}>
        <ModalHeader
          title='Proses Surat Jalan'
          subtitle='Lengkapi data checklist untuk memproses surat jalan yang dipilih.'
          icon='🚚'
          onClose={onClose}
          gradientFrom='from-blue-50'
          gradientTo='to-sky-50'
          iconBgColor='bg-blue-100'
        />

        <div className='flex-1 space-y-6 overflow-y-auto p-6'>
          <div className='rounded-lg border border-blue-200 bg-blue-50/60 p-4'>
            <p className='text-sm font-medium text-blue-900'>
              {Array.isArray(selectedIds) ? selectedIds.length : 0} surat jalan akan diproses.
            </p>
            {Array.isArray(selectedSummary) && selectedSummary.length > 0 && (
              <ul className='mt-3 space-y-2 text-sm text-blue-900'>
                {selectedSummary.map((item) =>
                  item ? (
                    <li
                      key={item.id || item}
                      className='flex items-center justify-between rounded-md bg-white/70 px-3 py-2 shadow-sm'
                    >
                      <span className='font-semibold'>
                        {item.display || item.id || item}
                      </span>
                      {item.subtitle && (
                        <span className='text-xs text-blue-600'>{item.subtitle}</span>
                      )}
                    </li>
                  ) : null
                )}
              </ul>
            )}
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm font-medium text-gray-700' htmlFor='status_code'>
                {fieldLabels.status_code} <span className='text-red-500'>*</span>
              </label>
              <input
                id='status_code'
                name='status_code'
                value={formValues.status_code}
                onChange={handleInputChange}
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder={STATUS_CODE_PLACEHOLDER}
                required
              />
              {errors.status_code && (
                <p className='mt-1 text-xs text-red-600'>{errors.status_code}</p>
              )}
              <p className='mt-1 text-xs text-gray-500'>
                Gunakan status checklist yang sesuai dengan workflow. Nilai default mengikuti dokumentasi API.
              </p>
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700' htmlFor='tanggal'>
                {fieldLabels.tanggal} <span className='text-red-500'>*</span>
              </label>
              <input
                type='datetime-local'
                id='tanggal'
                name='tanggal'
                value={formValues.tanggal}
                onChange={handleInputChange}
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                required
              />
              {errors.tanggal && (
                <p className='mt-1 text-xs text-red-600'>{errors.tanggal}</p>
              )}
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700' htmlFor='checker'>
                {fieldLabels.checker} <span className='text-red-500'>*</span>
              </label>
              <input
                id='checker'
                name='checker'
                value={formValues.checker}
                onChange={handleInputChange}
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Masukkan nama checker'
                required
              />
              {errors.checker && (
                <p className='mt-1 text-xs text-red-600'>{errors.checker}</p>
              )}
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700' htmlFor='driver'>
                {fieldLabels.driver} <span className='text-red-500'>*</span>
              </label>
              <input
                id='driver'
                name='driver'
                value={formValues.driver}
                onChange={handleInputChange}
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Masukkan nama driver'
                required
              />
              {errors.driver && (
                <p className='mt-1 text-xs text-red-600'>{errors.driver}</p>
              )}
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700' htmlFor='mobil'>
                {fieldLabels.mobil} <span className='text-red-500'>*</span>
              </label>
              <input
                id='mobil'
                name='mobil'
                value={formValues.mobil}
                onChange={handleInputChange}
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Contoh: B 1234 XYZ'
                required
              />
              {errors.mobil && (
                <p className='mt-1 text-xs text-red-600'>{errors.mobil}</p>
              )}
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700' htmlFor='kota'>
                {fieldLabels.kota} <span className='text-red-500'>*</span>
              </label>
              <input
                id='kota'
                name='kota'
                value={formValues.kota}
                onChange={handleInputChange}
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Masukkan kota tujuan'
                required
              />
              {errors.kota && (
                <p className='mt-1 text-xs text-red-600'>{errors.kota}</p>
              )}
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50'
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type='submit'
            className='rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Memproses...' : 'Proses Checklist'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ProcessSuratJalanModal;
