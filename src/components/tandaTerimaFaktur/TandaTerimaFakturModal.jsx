import React, { useEffect, useState, useCallback } from 'react';
import FormModal from '../common/FormModal';
import Autocomplete from '../common/Autocomplete';
import toastService from '@/services/toastService';
import { termOfPaymentService } from '@/services/termOfPaymentService';
import statusService from '@/services/statusService';
import { groupCustomerService } from '@/services/groupCustomerService';
import companyService from '@/services/companyService';

const DEFAULT_FORM_VALUES = {
  tanggal: '',
  termOfPaymentId: '',
  groupCustomerId: '',
  companyId: '',
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

  // Autocomplete options states
  const [termOfPaymentOptions, setTermOfPaymentOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [groupCustomerOptions, setGroupCustomerOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);

  // Loading states
  const [loadingTOP, setLoadingTOP] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingGroupCustomer, setLoadingGroupCustomer] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Fetch options on modal open
  const fetchOptions = useCallback(async () => {
    // Fetch Term of Payment
    setLoadingTOP(true);
    try {
      const topResult = await termOfPaymentService.getAllTermOfPayments(1, 100);
      // Handle nested structure: result.data.data or result.data or result
      const topData = topResult?.data?.data || topResult?.data || topResult || [];
      setTermOfPaymentOptions(
        Array.isArray(topData) ? topData.map((item) => ({
          id: item.id,
          name: `${item.kode_top} (${item.batas_hari} hari)`,
          kode_top: item.kode_top,
          batas_hari: item.batas_hari,
        })) : []
      );
    } catch (error) {
      console.error('Failed to fetch term of payment options:', error);
    } finally {
      setLoadingTOP(false);
    }

    // Fetch Status for TTF
    setLoadingStatus(true);
    try {
      const statusResult = await statusService.getTandaTerimaFakturStatuses();
      // Status service returns { data: [...] } directly
      const statusData = statusResult?.data || statusResult || [];
      setStatusOptions(
        Array.isArray(statusData) ? statusData.map((item) => ({
          id: item.id,
          name: item.status_name || item.status_code,
          status_code: item.status_code,
        })) : []
      );
    } catch (error) {
      console.error('Failed to fetch status options:', error);
    } finally {
      setLoadingStatus(false);
    }

    // Fetch Group Customer
    setLoadingGroupCustomer(true);
    try {
      const gcResult = await groupCustomerService.getAllGroupCustomers(1, 100);
      // Handle nested structure: result.data.data or result.data or result
      const gcData = gcResult?.data?.data || gcResult?.data || gcResult || [];
      setGroupCustomerOptions(
        Array.isArray(gcData) ? gcData.map((item) => ({
          id: item.id,
          name: `${item.kode_group} - ${item.nama_group}`,
          kode_group: item.kode_group,
          nama_group: item.nama_group,
        })) : []
      );
    } catch (error) {
      console.error('Failed to fetch group customer options:', error);
    } finally {
      setLoadingGroupCustomer(false);
    }

    // Fetch Company
    setLoadingCompany(true);
    try {
      const companyResult = await companyService.getCompanies(1, 100);
      // Handle nested structure: result.data.data or result.data or result
      const companyData = companyResult?.data?.data || companyResult?.data || companyResult || [];
      setCompanyOptions(
        Array.isArray(companyData) ? companyData.map((item) => ({
          id: item.id,
          name: `${item.kode_company} - ${item.nama_perusahaan}`,
          kode_company: item.kode_company,
          nama_perusahaan: item.nama_perusahaan,
        })) : []
      );
    } catch (error) {
      console.error('Failed to fetch company options:', error);
    } finally {
      setLoadingCompany(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(mapInitialValues(initialValues));
      setErrors({});
      fetchOptions();
    } else {
      setFormData(DEFAULT_FORM_VALUES);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialValues, fetchOptions]);

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

    if (!formData.termOfPaymentId || !formData.termOfPaymentId.toString().trim()) {
      nextErrors.termOfPaymentId = 'Term of Payment wajib dipilih.';
    }

    if (!formData.groupCustomerId || !formData.groupCustomerId.toString().trim()) {
      nextErrors.groupCustomerId = 'Group Customer wajib dipilih.';
    }

    if (!formData.companyId || !formData.companyId.toString().trim()) {
      nextErrors.companyId = 'Company wajib dipilih.';
    }

    if (!formData.statusId || !formData.statusId.toString().trim()) {
      nextErrors.statusId = 'Status wajib dipilih.';
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
      termOfPaymentId: formData.termOfPaymentId.toString().trim(),
      groupCustomerId: formData.groupCustomerId.toString().trim(),
      companyId: formData.companyId.toString().trim(),
      grand_total: Number(formData.grand_total),
      statusId: formData.statusId.toString().trim(),
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
        {/* Grand Total - Number Input */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Grand Total <span className='text-red-500'>*</span>
          </label>
          <input
            type='number'
            min={0}
            step='1'
            placeholder='Contoh: 3200000'
            value={formData.grand_total}
            onChange={handleChange('grand_total')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.grand_total ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          {errors.grand_total && (
            <p className='mt-1 text-xs text-red-600'>{errors.grand_total}</p>
          )}
        </div>

        {/* Tanggal - Date Input */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Tanggal (opsional)
          </label>
          <input
            type='date'
            value={formData.tanggal}
            onChange={handleChange('tanggal')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          {errors.tanggal && (
            <p className='mt-1 text-xs text-red-600'>{errors.tanggal}</p>
          )}
        </div>

        {/* Term of Payment - Autocomplete */}
        <div>
          <Autocomplete
            label='Term of Payment'
            required
            options={termOfPaymentOptions}
            value={formData.termOfPaymentId}
            onChange={handleChange('termOfPaymentId')}
            placeholder='Pilih Term of Payment'
            displayKey='name'
            valueKey='id'
            loading={loadingTOP}
            name='termOfPaymentId'
          />
          {errors.termOfPaymentId && (
            <p className='mt-1 text-xs text-red-600'>{errors.termOfPaymentId}</p>
          )}
        </div>

        {/* Status - Autocomplete */}
        <div>
          <Autocomplete
            label='Status'
            required
            options={statusOptions}
            value={formData.statusId}
            onChange={handleChange('statusId')}
            placeholder='Pilih Status TTF'
            displayKey='name'
            valueKey='id'
            loading={loadingStatus}
            name='statusId'
          />
          {errors.statusId && (
            <p className='mt-1 text-xs text-red-600'>{errors.statusId}</p>
          )}
        </div>

        {/* Group Customer - Autocomplete */}
        <div>
          <Autocomplete
            label='Group Customer'
            required
            options={groupCustomerOptions}
            value={formData.groupCustomerId}
            onChange={handleChange('groupCustomerId')}
            placeholder='Pilih Group Customer'
            displayKey='name'
            valueKey='id'
            loading={loadingGroupCustomer}
            name='groupCustomerId'
          />
          {errors.groupCustomerId && (
            <p className='mt-1 text-xs text-red-600'>{errors.groupCustomerId}</p>
          )}
        </div>

        {/* Company - Autocomplete */}
        <div>
          <Autocomplete
            label='Company (Supplier)'
            required
            options={companyOptions}
            value={formData.companyId}
            onChange={handleChange('companyId')}
            placeholder='Pilih Company'
            displayKey='name'
            valueKey='id'
            loading={loadingCompany}
            name='companyId'
          />
          {errors.companyId && (
            <p className='mt-1 text-xs text-red-600'>{errors.companyId}</p>
          )}
        </div>
      </div>
    </FormModal>
  );
};

export default TandaTerimaFakturModal;
