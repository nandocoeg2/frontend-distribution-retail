import React, { useEffect, useState } from 'react';
import FormModal from '../common/FormModal';
import toastService from '@/services/toastService';

const DEFAULT_FORM_VALUES = {
  tanggal: '',
  termOfPaymentId: '',
  groupCustomerId: '',
  companyId: '',
  code_supplier: '',
  grand_total: '',
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
  tanggal: toDateInputValue(initialValues.tanggal),
  termOfPaymentId:
    initialValues.termOfPaymentId || initialValues.termOfPayment?.id || '',
  groupCustomerId:
    initialValues.groupCustomerId ||
    initialValues.groupCustomer?.id ||
    initialValues.customer?.groupCustomer?.id ||
    '',
  companyId: initialValues.companyId || initialValues.company?.id || '',
  code_supplier: initialValues.code_supplier || '',
  grand_total:
    initialValues.grand_total != null
      ? String(initialValues.grand_total)
      : '',
  statusId: initialValues.statusId || initialValues.status?.id || '',
});

const TandaTerimaFakturModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState(DEFAULT_FORM_VALUES);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!formData.termOfPaymentId.trim()) {
      nextErrors.termOfPaymentId = 'Term of payment ID wajib diisi.';
    }

    if (!formData.groupCustomerId.trim()) {
      nextErrors.groupCustomerId = 'Group customer ID wajib diisi.';
    }

    if (!formData.companyId.trim()) {
      nextErrors.companyId = 'Company ID wajib diisi.';
    }

    if (!formData.code_supplier.trim()) {
      nextErrors.code_supplier = 'Kode supplier wajib diisi.';
    }

    if (!formData.statusId.trim()) {
      nextErrors.statusId = 'Status ID wajib diisi.';
    }

    const grandTotalNumber = Number(formData.grand_total);
    if (
      formData.grand_total === '' ||
      Number.isNaN(grandTotalNumber) ||
      grandTotalNumber < 0
    ) {
      nextErrors.grand_total =
        'Grand total harus berupa angka dan tidak boleh negatif.';
    }

    if (formData.tanggal) {
      const date = new Date(formData.tanggal);
      if (Number.isNaN(date.getTime())) {
        nextErrors.tanggal = 'Tanggal tidak valid.';
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
      termOfPaymentId: formData.termOfPaymentId.trim(),
      groupCustomerId: formData.groupCustomerId.trim(),
      companyId: formData.companyId.trim(),
      code_supplier: formData.code_supplier.trim(),
      grand_total: Number(formData.grand_total),
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
      console.error('Failed to submit tanda terima faktur form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (field, label, props = {}) => {
    const hasError = Boolean(errors[field]);
    return (
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          {label}
        </label>
        <input
          value={formData[field]}
          onChange={handleChange(field)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            hasError ? 'border-red-500' : 'border-gray-300'
          }`}
          {...props}
        />
        {hasError && (
          <p className='mt-1 text-xs text-red-600'>{errors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <FormModal
      show={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Edit' : 'Tambah'} Tanda Terima Faktur`}
      subtitle='Isi informasi tanda terima faktur sesuai dokumen fisik.'
      isSubmitting={isSubmitting}
      isEdit={isEdit}
      handleSubmit={handleSubmit}
      entityName='Tanda Terima Faktur'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {renderInput('code_supplier', 'Kode Supplier', {
          type: 'text',
          placeholder: 'Contoh: SUP-001',
        })}
        {renderInput('grand_total', 'Grand Total', {
          type: 'number',
          min: 0,
          step: '1',
          placeholder: 'Contoh: 3200000',
        })}
        {renderInput('termOfPaymentId', 'Term of Payment ID', {
          type: 'text',
          placeholder: 'Masukkan ID term of payment',
        })}
        {renderInput('statusId', 'Status ID', {
          type: 'text',
          placeholder: 'Masukkan ID status TTF',
        })}
        {renderInput('groupCustomerId', 'Group Customer ID', {
          type: 'text',
          placeholder: 'Masukkan ID group customer',
        })}
        {renderInput('companyId', 'Company ID', {
          type: 'text',
          placeholder: 'Masukkan ID company',
        })}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Tanggal (opsional)
          </label>
          <input
            type='date'
            value={formData.tanggal}
            onChange={handleChange('tanggal')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.tanggal ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.tanggal && (
            <p className='mt-1 text-xs text-red-600'>{errors.tanggal}</p>
          )}
        </div>
      </div>
    </FormModal>
  );
};

export default TandaTerimaFakturModal;
