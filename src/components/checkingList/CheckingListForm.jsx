import React, { useEffect, useState } from 'react';
import {
  DocumentPlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import statusService from '../../services/statusService';
import AddSuratJalanToChecklistModal from './AddSuratJalanToChecklistModal';
import { formatDate } from '../../utils/formatUtils';

const defaultValues = {
  statusId: '',
  tanggal: '',
  checker: '',
  ekspedisi: '',
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
    ekspedisi: initialValues.ekspedisi || '',
    mobil: initialValues.mobil || '',
    kota: initialValues.kota || '',
  };
};

const CheckingListForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  formId,
}) => {
  const [formData, setFormData] = useState(defaultValues);
  const [assignedSuratJalans, setAssignedSuratJalans] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (initialValues) {
      setFormData(normalizeInitialValues(initialValues));
      const rawSj = Array.isArray(initialValues.suratJalan)
        ? initialValues.suratJalan
        : initialValues.suratJalan
        ? [initialValues.suratJalan]
        : [];
      setAssignedSuratJalans(rawSj);
    } else {
      setFormData(defaultValues);
      setAssignedSuratJalans([]);
    }
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRemoveSuratJalan = (id) => {
    if (assignedSuratJalans.length <= 1) {
      setValidationError('Checklist harus memiliki minimal 1 Surat Jalan.');
      return;
    }
    setValidationError('');
    setAssignedSuratJalans((prev) => prev.filter((sj) => sj.id !== id));
  };

  const handleAddSuratJalans = (newSjs) => {
    setValidationError('');
    setAssignedSuratJalans((prev) => {
      const existingIds = prev.map((s) => s.id);
      const uniqueNew = newSjs.filter((s) => !existingIds.includes(s.id));
      return [...prev, ...uniqueNew];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSubmit) {
      return;
    }

    if (assignedSuratJalans.length === 0) {
      setValidationError('Checklist harus memiliki minimal 1 Surat Jalan.');
      return;
    }

    setValidationError('');

    const payload = {
      statusId: formData.statusId?.trim(),
      checker: formData.checker?.trim(),
      ekspedisi: formData.ekspedisi?.trim(),
      mobil: formData.mobil?.trim(),
      kota: formData.kota?.trim(),
      suratJalanIds: assignedSuratJalans.map((sj) => sj.id),
    };

    const isoTanggal = toIsoString(formData.tanggal);
    if (isoTanggal) {
      payload.tanggal = isoTanggal;
    }

    onSubmit(payload);
  };

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} className='space-y-6'>
        {validationError && (
          <div className='flex items-center space-x-2 rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700'>
            <ExclamationTriangleIcon className='h-5 w-5 flex-shrink-0 text-red-500' />
            <span>{validationError}</span>
          </div>
        )}

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div className='md:col-span-2'>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Status ID <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={
                initialValues?.status?.status_code ||
                initialValues?.status?.status_name ||
                formData.statusId ||
                '-'
              }
              disabled
              className='w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed text-sm'
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
              disabled={isSubmitting}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
              disabled={isSubmitting}
              placeholder='Nama checker'
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
            />
          </div>

          <div>
            <label
              htmlFor='ekspedisi'
              className='mb-1 block text-sm font-medium text-gray-700'
            >
              Nama Ekspedisi <span className='text-red-500'>*</span>
            </label>
            <input
              id='ekspedisi'
              name='ekspedisi'
              type='text'
              value={formData.ekspedisi}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder='Nama ekspedisi'
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
              disabled={isSubmitting}
              placeholder='Contoh: B 1234 XYZ'
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
              disabled={isSubmitting}
              placeholder='Kota tujuan pengiriman'
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
            />
          </div>
        </div>

        {/* Section: Daftar Surat Jalan */}
        <div className='mt-8 border-t border-gray-200 pt-6'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h4 className='text-base font-semibold text-gray-900'>
                Daftar Surat Jalan dalam Checklist ({assignedSuratJalans.length})
              </h4>
              <p className='text-xs text-gray-500'>
                Kelola Surat Jalan yang terhubung dengan Checklist ini
              </p>
            </div>
            <button
              type='button'
              onClick={() => setShowAddModal(true)}
              disabled={isSubmitting}
              className='inline-flex items-center space-x-2 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-700 focus:outline-none transition-colors disabled:opacity-50'
            >
              <DocumentPlusIcon className='h-4 w-4' />
              <span>+ Tambah Surat Jalan</span>
            </button>
          </div>

          {assignedSuratJalans.length === 0 ? (
            <div className='rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500'>
              Belum ada Surat Jalan yang dipilih. Klik tombol di atas untuk menambahkan.
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-gray-200'>
              <table className='min-w-full divide-y divide-gray-200 text-left text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th scope='col' className='px-4 py-3 font-semibold text-gray-700'>
                      No Surat Jalan
                    </th>
                    <th scope='col' className='px-4 py-3 font-semibold text-gray-700'>
                      No PO
                    </th>
                    <th scope='col' className='px-4 py-3 font-semibold text-gray-700'>
                      Customer / Tujuan
                    </th>
                    <th scope='col' className='px-4 py-3 font-semibold text-gray-700'>
                      Tanggal
                    </th>
                    <th scope='col' className='w-20 px-4 py-3 text-center font-semibold text-gray-700'>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  {assignedSuratJalans.map((sj) => (
                    <tr key={sj.id} className='hover:bg-gray-50 transition-colors'>
                      <td className='px-4 py-3 font-medium text-gray-900'>
                        {sj.no_surat_jalan}
                      </td>
                      <td className='px-4 py-3 text-gray-600'>
                        {sj.purchaseOrder?.po_number || '-'}
                      </td>
                      <td className='px-4 py-3 text-gray-600'>
                        {sj.purchaseOrder?.customer?.namaCustomer ||
                          sj.deliver_to ||
                          '-'}
                      </td>
                      <td className='px-4 py-3 text-gray-500'>
                        {formatDate(sj.tanggal_surat_jalan || sj.createdAt)}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <button
                          type='button'
                          onClick={() => handleRemoveSuratJalan(sj.id)}
                          disabled={isSubmitting}
                          title={
                            assignedSuratJalans.length <= 1
                              ? 'Minimal 1 Surat Jalan harus ada dalam checklist'
                              : 'Keluarkan dari checklist'
                          }
                          className={`rounded-lg p-1.5 transition-colors ${
                            assignedSuratJalans.length <= 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                          }`}
                        >
                          <TrashIcon className='h-4 w-4' />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6'>
          {onCancel && (
            <button
              type='button'
              onClick={onCancel}
              className='px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500'
              disabled={isSubmitting}
            >
              Batal
            </button>
          )}
          <button
            type='submit'
            className='px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : initialValues ? 'Update' : 'Simpan'}
          </button>
        </div>
      </form>

      {/* Modal to pick and add draft Surat Jalan */}
      <AddSuratJalanToChecklistModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSuratJalans}
        existingSuratJalanIds={assignedSuratJalans.map((sj) => sj.id)}
        companyId={initialValues?.companyId}
      />
    </>
  );
};

export default CheckingListForm;
