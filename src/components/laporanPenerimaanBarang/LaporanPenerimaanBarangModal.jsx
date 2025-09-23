import React, { useEffect, useMemo, useState, useCallback } from 'react';
import FormModal from '../common/FormModal';
import Autocomplete from '../common/Autocomplete';
import purchaseOrderService from '@/services/purchaseOrderService';
import customerService from '@/services/customerService';
import termOfPaymentService from '@/services/termOfPaymentService';
import statusService from '@/services/statusService';
import toastService from '@/services/toastService';

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
  const customerName = po.customer?.namaCustomer || po.customer?.name || po.customerName;
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
  const labelParts = [customer.namaCustomer || customer.name, customer.kodeCustomer].filter(Boolean);

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
  initialValues = null,
  isEdit = false,
}) => {
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [purchaseOrderOptions, setPurchaseOrderOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [termOptions, setTermOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  const [purchaseOrderLoading, setPurchaseOrderLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [termLoading, setTermLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchPurchaseOrderOptions = useCallback(async (query = '') => {
    setPurchaseOrderLoading(true);
    try {
      const response = query
        ? await purchaseOrderService.searchPurchaseOrders({ po_number: query }, 1, 10)
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

  const fetchTermOptions = useCallback(async (query = '') => {
    setTermLoading(true);
    try {
      const response = query
        ? await termOfPaymentService.searchTermOfPayments(query, 1, 10)
        : await termOfPaymentService.getAllTermOfPayments(1, 10);

      const items = extractArray(response)
        .map(mapTermOption)
        .filter(Boolean);

      setTermOptions((prev) => mergeUniqueOptions(items, prev));
    } catch (error) {
      console.error('Failed to fetch term of payments:', error);
      toastService.error('Gagal memuat data term of payment');
    } finally {
      setTermLoading(false);
    }
  }, []);

  const fetchStatusOptions = useCallback(async () => {
    setStatusLoading(true);
    try {
      const response = await statusService.getAllStatuses();
      const items = extractArray(response)
        .map(mapStatusOption)
        .filter(Boolean);

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
  }, [isOpen, fetchPurchaseOrderOptions, fetchCustomerOptions, fetchTermOptions, fetchStatusOptions]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const purchaseOrderOption = mapPurchaseOrderOption({
      id: initialValues?.purchaseOrderId || initialValues?.purchaseOrder?.id,
      po_number: initialValues?.purchaseOrder?.po_number,
      customer: initialValues?.purchaseOrder?.customer || initialValues?.customer,
    });

    const customerOption = mapCustomerOption(initialValues?.customer || (initialValues?.customerId ? { id: initialValues.customerId } : null));
    const termOption = mapTermOption(initialValues?.termOfPayment || (initialValues?.termin_bayar ? { id: initialValues.termin_bayar } : null));
    const statusOption = mapStatusOption(initialValues?.status || (initialValues?.statusId ? { id: initialValues.statusId } : null));

    if (purchaseOrderOption) {
      setPurchaseOrderOptions((prev) => mergeUniqueOptions([purchaseOrderOption], prev));
    }
    if (customerOption) {
      setCustomerOptions((prev) => mergeUniqueOptions([customerOption], prev));
    }
    if (termOption) {
      setTermOptions((prev) => mergeUniqueOptions([termOption], prev));
    }
    if (statusOption) {
      setStatusOptions((prev) => mergeUniqueOptions([statusOption], prev));
    }
  }, [initialValues, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormValues({
        purchaseOrderId: toIdString(initialValues?.purchaseOrderId || initialValues?.purchaseOrder?.id),
        tanggal_po: toDateInput(initialValues?.tanggal_po || initialValues?.purchaseOrder?.tanggal_po),
        customerId: toIdString(initialValues?.customerId || initialValues?.customer?.id),
        alamat_customer: initialValues?.alamat_customer || initialValues?.customer?.alamat || '',
        termin_bayar: toIdString(initialValues?.termin_bayar || initialValues?.termOfPayment?.id),
        statusId: toIdString(initialValues?.statusId || initialValues?.status?.id),
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
          <label className='block text-sm font-medium text-gray-700 mb-1'>Termin Bayar</label>
          <select
            name='termin_bayar'
            value={formValues.termin_bayar}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            disabled={termLoading}
          >
            <option value=''>Pilih termin bayar</option>
            {termOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
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




