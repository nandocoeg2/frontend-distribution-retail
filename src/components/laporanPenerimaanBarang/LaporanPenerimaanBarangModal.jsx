import React, { useEffect, useMemo, useState } from 'react';
import FormModal from '../common/FormModal';

const defaultFormValues = {
  purchaseOrderId: '',
  tanggal_po: '',
  customerId: '',
  alamat_customer: '',
  termin_bayar: '',
  statusId: '',
  filesText: '',
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

const buildPayload = (values) => {
  const payload = {
    purchaseOrderId: values.purchaseOrderId?.trim(),
    customerId: values.customerId?.trim(),
  };

  if (values.tanggal_po) {
    const date = new Date(values.tanggal_po);
    if (!Number.isNaN(date.getTime())) {
      payload.tanggal_po = date.toISOString();
    }
  }

  if (values.alamat_customer?.trim()) {
    payload.alamat_customer = values.alamat_customer.trim();
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
  initialValues = {},
  isEdit = false,
}) => {
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormValues({
        purchaseOrderId: initialValues?.purchaseOrderId || '',
        tanggal_po: toDateInput(initialValues?.tanggal_po || initialValues?.purchaseOrder?.tanggal_po),
        customerId: initialValues?.customerId || '',
        alamat_customer: initialValues?.alamat_customer || '',
        termin_bayar: initialValues?.termin_bayar || initialValues?.termOfPayment?.id || '',
        statusId: initialValues?.statusId || initialValues?.status?.id || '',
        filesText: extractFileIds(initialValues?.files),
      });
      setIsSubmitting(false);
    } else {
      setFormValues(defaultFormValues);
      setIsSubmitting(false);
    }
  }, [initialValues, isOpen]);

  const modalTitle = useMemo(() => {
    return isEdit ? 'Edit Laporan Penerimaan Barang' : 'Tambah Laporan Penerimaan Barang';
  }, [isEdit]);

  const modalSubtitle = useMemo(() => {
    return isEdit ? 'Perbarui detail laporan penerimaan barang.' : 'Lengkapi data untuk membuat laporan penerimaan barang baru.';
  }, [isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
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

  return (
    <FormModal
      show={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      isSubmitting={isSubmitting}
      isEdit={isEdit}
      handleSubmit={handleSubmit}
      entityName='Laporan'
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Purchase Order ID *</label>
          <input
            type='text'
            name='purchaseOrderId'
            value={formValues.purchaseOrderId}
            onChange={handleChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='clx1otn7p000108l82e7ke2j9'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Tanggal PO</label>
          <input
            type='date'
            name='tanggal_po'
            value={formValues.tanggal_po}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Customer ID *</label>
          <input
            type='text'
            name='customerId'
            value={formValues.customerId}
            onChange={handleChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='clx1otn81000308l89p8y5a2k'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Termin Bayar</label>
          <input
            type='text'
            name='termin_bayar'
            value={formValues.termin_bayar}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='clx1otn7p000108l82e7ke2j8'
          />
        </div>

        <div className='md:col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Alamat Customer</label>
          <textarea
            name='alamat_customer'
            value={formValues.alamat_customer}
            onChange={handleChange}
            rows={3}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Jl. Contoh No. 123, Jakarta'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Status ID</label>
          <input
            type='text'
            name='statusId'
            value={formValues.statusId}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='clx1otn7p000108l82e7ke2j7'
          />
        </div>

        <div className='md:col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>File IDs</label>
          <textarea
            name='filesText'
            value={formValues.filesText}
            onChange={handleChange}
            rows={2}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Pisahkan ID file dengan koma. Contoh: file-id-1, file-id-2'
          />
          <p className='mt-1 text-xs text-gray-500'>Sisakan kosong jika tidak ada file yang ingin dilampirkan.</p>
        </div>
      </div>
    </FormModal>
  );
};

export default LaporanPenerimaanBarangModal;
