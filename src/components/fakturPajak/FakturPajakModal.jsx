import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FormModal from '../common/FormModal';
import toastService from '@/services/toastService';

const DEFAULT_FORM_VALUES = {
  no_pajak: '',
  invoicePenagihanId: '',
  tanggal_invoice: '',
  laporanPenerimaanBarangId: '',
  customerId: '',
  total_harga_jual: '',
  potongan_harga: '',
  dasar_pengenaan_pajak: '',
  ppn_rp: '',
  ppn_percentage: '11',
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

const toInputString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  return String(value);
};

const mapInitialValues = (initialValues = {}) => ({
  no_pajak: initialValues.no_pajak || '',
  invoicePenagihanId:
    initialValues.invoicePenagihanId ||
    initialValues.invoicePenagihan?.id ||
    '',
  tanggal_invoice: toDateInputValue(initialValues.tanggal_invoice),
  laporanPenerimaanBarangId:
    initialValues.laporanPenerimaanBarangId ||
    initialValues.laporanPenerimaanBarang?.id ||
    '',
  customerId: initialValues.customerId || initialValues.customer?.id || '',
  total_harga_jual: toInputString(initialValues.total_harga_jual),
  potongan_harga: toInputString(initialValues.potongan_harga),
  dasar_pengenaan_pajak: toInputString(initialValues.dasar_pengenaan_pajak),
  ppn_rp: toInputString(initialValues.ppn_rp),
  ppn_percentage: toInputString(
    initialValues.ppn_percentage != null ? initialValues.ppn_percentage : 11,
  ),
  termOfPaymentId:
    initialValues.termOfPaymentId || initialValues.termOfPayment?.id || '',
  statusId: initialValues.statusId || initialValues.status?.id || '',
});

const FakturPajakModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState(DEFAULT_FORM_VALUES);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDppTouched, setIsDppTouched] = useState(false);
  const [isPpnTouched, setIsPpnTouched] = useState(false);

  const isDppTouchedRef = useRef(false);
  const isPpnTouchedRef = useRef(false);

  const markDppTouched = useCallback(() => {
    if (!isDppTouchedRef.current) {
      isDppTouchedRef.current = true;
      setIsDppTouched(true);
    }
  }, []);

  const markPpnTouched = useCallback(() => {
    if (!isPpnTouchedRef.current) {
      isPpnTouchedRef.current = true;
      setIsPpnTouched(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => {
        const mapped = mapInitialValues(initialValues);
        return { ...prev, ...mapped };
      });
      setErrors({});
      setIsSubmitting(false);
      setIsDppTouched(false);
      setIsPpnTouched(false);
      isDppTouchedRef.current = false;
      isPpnTouchedRef.current = false;
    } else {
      setFormData(DEFAULT_FORM_VALUES);
      setErrors({});
      setIsSubmitting(false);
      setIsDppTouched(false);
      setIsPpnTouched(false);
      isDppTouchedRef.current = false;
      isPpnTouchedRef.current = false;
    }
  }, [isOpen, initialValues]);

  const toNumber = useCallback((value) => {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? 0 : numeric;
  }, []);

  const isBlank = (value) =>
    value === '' || value === null || value === undefined;

  const recalculateDerivedValues = useCallback(
    (draft) => {
      const next = { ...draft };

      if (!isDppTouchedRef.current) {
        if (isBlank(next.total_harga_jual) && isBlank(next.potongan_harga)) {
          next.dasar_pengenaan_pajak = '';
        } else {
          const total = toNumber(next.total_harga_jual);
          const discount = toNumber(next.potongan_harga);
          const dpp = Math.max(total - discount, 0);
          if (Number.isFinite(dpp)) {
            next.dasar_pengenaan_pajak = String(Math.round(dpp));
          }
        }
      }

      if (!isPpnTouchedRef.current) {
        if (
          isBlank(next.dasar_pengenaan_pajak) ||
          isBlank(next.ppn_percentage)
        ) {
          next.ppn_rp = '';
        } else {
          const dppValue = toNumber(next.dasar_pengenaan_pajak);
          const percentValue = toNumber(next.ppn_percentage);
          const ppn = dppValue * (percentValue / 100);
          if (Number.isFinite(ppn)) {
            next.ppn_rp = String(Math.round(ppn));
          }
        }
      }

      return next;
    },
    [toNumber],
  );

  const updateFormData = useCallback(
    (updater) => {
      setFormData((prev) => {
        const draft =
          typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        const recalculated = recalculateDerivedValues(draft);
        return recalculated;
      });
    },
    [recalculateDerivedValues],
  );

  const clearFieldError = useCallback((field) => {
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }, [errors]);

  const handleChange = useCallback(
    (field) => (event) => {
      const value = event?.target ? event.target.value : event;
      if (field === 'dasar_pengenaan_pajak') {
        markDppTouched();
        updateFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      } else if (field === 'ppn_rp') {
        markPpnTouched();
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      } else if (field === 'ppn_percentage') {
        updateFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      } else {
        updateFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }
      clearFieldError(field);
    },
    [clearFieldError, markDppTouched, markPpnTouched, updateFormData],
  );

  const nomorFakturRegex =
    /^\d{3}\.\d{3}-\d{2}\.\d{8}$/;

  const validationMessages = useMemo(
    () => ({
      no_pajak: 'Nomor faktur pajak wajib diisi.',
      invoicePenagihanId: 'Invoice penagihan ID wajib diisi.',
      tanggal_invoice: 'Tanggal invoice wajib diisi.',
      laporanPenerimaanBarangId:
        'Laporan penerimaan barang ID wajib diisi.',
      customerId: 'Customer ID wajib diisi.',
      total_harga_jual:
        'Total harga jual harus berupa angka dan tidak boleh negatif.',
      potongan_harga:
        'Potongan harga harus berupa angka dan tidak boleh negatif.',
      dasar_pengenaan_pajak:
        'Dasar pengenaan pajak harus berupa angka dan tidak boleh negatif.',
      dppConsistency:
        'Dasar pengenaan pajak harus sama dengan total harga jual dikurangi potongan.',
      ppn_rp: 'PPN (Rp) harus berupa angka dan tidak boleh negatif.',
      ppn_percentage: 'Persentase PPN harus di antara 0 hingga 100.',
      termOfPaymentId: 'Term of payment ID wajib diisi.',
      statusId: 'Status ID wajib diisi.',
      no_pajak_format:
        'Format nomor faktur pajak harus XXX.XXX-XX.XXXXXXXX.',
      tanggal_invoice_invalid: 'Tanggal invoice tidak valid.',
    }),
    [],
  );

  const validate = useCallback(() => {
    const nextErrors = {};

    if (!formData.no_pajak.trim()) {
      nextErrors.no_pajak = validationMessages.no_pajak;
    } else if (!nomorFakturRegex.test(formData.no_pajak.trim())) {
      nextErrors.no_pajak = validationMessages.no_pajak_format;
    }

    if (!formData.invoicePenagihanId.trim()) {
      nextErrors.invoicePenagihanId = validationMessages.invoicePenagihanId;
    }

    if (!formData.tanggal_invoice) {
      nextErrors.tanggal_invoice = validationMessages.tanggal_invoice;
    } else {
      const date = new Date(formData.tanggal_invoice);
      if (Number.isNaN(date.getTime())) {
        nextErrors.tanggal_invoice =
          validationMessages.tanggal_invoice_invalid;
      }
    }

    if (!formData.laporanPenerimaanBarangId.trim()) {
      nextErrors.laporanPenerimaanBarangId =
        validationMessages.laporanPenerimaanBarangId;
    }

    if (!formData.customerId.trim()) {
      nextErrors.customerId = validationMessages.customerId;
    }

    const totalHarga = Number(formData.total_harga_jual);
    if (
      formData.total_harga_jual === '' ||
      Number.isNaN(totalHarga) ||
      totalHarga < 0
    ) {
      nextErrors.total_harga_jual = validationMessages.total_harga_jual;
    }

    const potongan = Number(
      formData.potongan_harga === '' ? 0 : formData.potongan_harga,
    );
    if (
      formData.potongan_harga !== '' &&
      (Number.isNaN(potongan) || potongan < 0)
    ) {
      nextErrors.potongan_harga = validationMessages.potongan_harga;
    }

    const dpp = Number(formData.dasar_pengenaan_pajak);
    if (
      formData.dasar_pengenaan_pajak === '' ||
      Number.isNaN(dpp) ||
      dpp < 0
    ) {
      nextErrors.dasar_pengenaan_pajak =
        validationMessages.dasar_pengenaan_pajak;
    } else if (!Number.isNaN(totalHarga) && !Number.isNaN(potongan)) {
      const expected = Math.max(totalHarga - potongan, 0);
      if (Math.abs(dpp - expected) > 1) {
        nextErrors.dasar_pengenaan_pajak =
          validationMessages.dppConsistency;
      }
    }

    const ppnRp = Number(formData.ppn_rp);
    if (
      formData.ppn_rp === '' ||
      Number.isNaN(ppnRp) ||
      ppnRp < 0
    ) {
      nextErrors.ppn_rp = validationMessages.ppn_rp;
    }

    const ppnPercentage = Number(formData.ppn_percentage);
    if (
      formData.ppn_percentage === '' ||
      Number.isNaN(ppnPercentage) ||
      ppnPercentage < 0 ||
      ppnPercentage > 100
    ) {
      nextErrors.ppn_percentage = validationMessages.ppn_percentage;
    }

    if (!formData.termOfPaymentId.trim()) {
      nextErrors.termOfPaymentId = validationMessages.termOfPaymentId;
    }

    if (!formData.statusId.trim()) {
      nextErrors.statusId = validationMessages.statusId;
    }

    return nextErrors;
  }, [formData, validationMessages, nomorFakturRegex]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toastService.error('Periksa kembali form faktur pajak Anda.');
      return;
    }

    const payload = {
      no_pajak: formData.no_pajak.trim(),
      invoicePenagihanId: formData.invoicePenagihanId.trim(),
      tanggal_invoice: new Date(formData.tanggal_invoice).toISOString(),
      laporanPenerimaanBarangId: formData.laporanPenerimaanBarangId.trim(),
      customerId: formData.customerId.trim(),
      total_harga_jual: Number(formData.total_harga_jual),
      potongan_harga:
        formData.potongan_harga === ''
          ? 0
          : Number(formData.potongan_harga),
      dasar_pengenaan_pajak: Number(formData.dasar_pengenaan_pajak),
      ppn_rp: Number(formData.ppn_rp),
      ppn_percentage: Number(formData.ppn_percentage),
      termOfPaymentId: formData.termOfPaymentId.trim(),
      statusId: formData.statusId.trim(),
    };

    setIsSubmitting(true);
    try {
      await onSubmit?.(payload);
    } catch (error) {
      console.error('Failed to submit faktur pajak:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      show={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Faktur Pajak' : 'Tambah Faktur Pajak'}
      subtitle={
        isEdit
          ? 'Perbarui data faktur pajak sesuai kebutuhan'
          : 'Lengkapi informasi faktur pajak untuk pencatatan pajak penjualan'
      }
      isSubmitting={isSubmitting}
      isEdit={isEdit}
      handleSubmit={handleSubmit}
      entityName='Faktur Pajak'
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Nomor Faktur Pajak <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={formData.no_pajak}
            onChange={handleChange('no_pajak')}
            placeholder='010.000-24.12345678'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.no_pajak && (
            <p className='mt-1 text-xs text-red-600'>{errors.no_pajak}</p>
          )}
        </div>

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
            Tanggal Invoice <span className='text-red-500'>*</span>
          </label>
          <input
            type='date'
            value={formData.tanggal_invoice}
            onChange={handleChange('tanggal_invoice')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.tanggal_invoice && (
            <p className='mt-1 text-xs text-red-600'>
              {errors.tanggal_invoice}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Laporan Penerimaan Barang ID{' '}
            <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={formData.laporanPenerimaanBarangId}
            onChange={handleChange('laporanPenerimaanBarangId')}
            placeholder='Masukkan ID laporan penerimaan barang'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.laporanPenerimaanBarangId && (
            <p className='mt-1 text-xs text-red-600'>
              {errors.laporanPenerimaanBarangId}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Customer ID <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={formData.customerId}
            onChange={handleChange('customerId')}
            placeholder='Masukkan ID customer'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.customerId && (
            <p className='mt-1 text-xs text-red-600'>{errors.customerId}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Total Harga Jual (IDR) <span className='text-red-500'>*</span>
          </label>
          <input
            type='number'
            min='0'
            step='1'
            value={formData.total_harga_jual}
            onChange={handleChange('total_harga_jual')}
            placeholder='Masukkan total harga jual'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.total_harga_jual && (
            <p className='mt-1 text-xs text-red-600'>
              {errors.total_harga_jual}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Potongan Harga (IDR)
          </label>
          <input
            type='number'
            min='0'
            step='1'
            value={formData.potongan_harga}
            onChange={handleChange('potongan_harga')}
            placeholder='Masukkan potongan (opsional)'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.potongan_harga && (
            <p className='mt-1 text-xs text-red-600'>
              {errors.potongan_harga}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Dasar Pengenaan Pajak (DPP) <span className='text-red-500'>*</span>
          </label>
          <input
            type='number'
            min='0'
            step='1'
            value={formData.dasar_pengenaan_pajak}
            onChange={handleChange('dasar_pengenaan_pajak')}
            placeholder='Total harga jual - potongan'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.dasar_pengenaan_pajak && (
            <p className='mt-1 text-xs text-red-600'>
              {errors.dasar_pengenaan_pajak}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Persentase PPN (%) <span className='text-red-500'>*</span>
          </label>
          <input
            type='number'
            min='0'
            max='100'
            step='0.01'
            value={formData.ppn_percentage}
            onChange={handleChange('ppn_percentage')}
            placeholder='Contoh: 11'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.ppn_percentage && (
            <p className='mt-1 text-xs text-red-600'>
              {errors.ppn_percentage}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            PPN (Rp) <span className='text-red-500'>*</span>
          </label>
          <input
            type='number'
            min='0'
            step='1'
            value={formData.ppn_rp}
            onChange={handleChange('ppn_rp')}
            placeholder='DPP x % PPN'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.ppn_rp && (
            <p className='mt-1 text-xs text-red-600'>{errors.ppn_rp}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Term of Payment ID <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={formData.termOfPaymentId}
            onChange={handleChange('termOfPaymentId')}
            placeholder='Masukkan ID term of payment'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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
            placeholder='Masukkan ID status'
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

export default FakturPajakModal;
