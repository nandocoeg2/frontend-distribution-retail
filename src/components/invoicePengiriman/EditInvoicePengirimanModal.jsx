import React, { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toastService from '../../services/toastService';
import invoicePengirimanService from '../../services/invoicePengirimanService';
import { formatCurrency } from '../../utils/formatUtils';

const DEFAULT_FORM = {
  deliver_to: '',
  expired_date: '',
  termOfPaymentId: '',
  type: 'PEMBAYARAN',
  sub_total: '',
  total_discount: '',
  total_price: '',
  ppn_percentage: '11',
  ppnRupiah: '',
  grand_total: '',
};

const numericFields = [
  'sub_total',
  'total_discount',
  'total_price',
  'ppn_percentage',
  'ppnRupiah',
  'grand_total',
];

const toStringValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const toNumberValue = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrencyDisplay = (value) => formatCurrency(toNumberValue(value));

const EditInvoicePengirimanModal = ({
  show,
  onClose,
  invoice,
  onInvoiceUpdated,
  handleAuthError,
  invoiceLoading = false,
  invoiceError = null,
  onRetry,
}) => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (show && invoice) {
      setFormData({
        deliver_to: toStringValue(invoice.deliver_to),
        expired_date: invoice.expired_date
          ? invoice.expired_date.substring(0, 10)
          : '',
        termOfPaymentId: toStringValue(
          invoice.termOfPaymentId ??
            invoice.term_of_payment_id ??
            invoice.termOfPayment?.id
        ),
        type: toStringValue(invoice.type || 'PEMBAYARAN'),
        sub_total: toStringValue(invoice.sub_total),
        total_discount: toStringValue(invoice.total_discount),
        total_price: toStringValue(invoice.total_price),
        ppn_percentage: toStringValue(invoice.ppn_percentage ?? '11'),
        ppnRupiah: toStringValue(invoice.ppnRupiah ?? invoice.ppn_rupiah),
        grand_total: toStringValue(invoice.grand_total),
      });
      setErrors({});
    } else {
      setFormData(DEFAULT_FORM);
      setErrors({});
    }
  }, [invoice, show]);

  const derivedTotals = useMemo(
    () => ({
      subTotal: toNumberValue(formData.sub_total),
      discount: toNumberValue(formData.total_discount),
      totalPrice: toNumberValue(formData.total_price),
      ppnPercentage: toNumberValue(formData.ppn_percentage),
      ppnRupiah: toNumberValue(formData.ppnRupiah),
      grandTotal: toNumberValue(formData.grand_total),
    }),
    [formData]
  );

  const handleChange = (field, value) => {
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

  const recalculateFinancials = () => {
    const subTotal = toNumberValue(formData.sub_total);
    const discount = toNumberValue(formData.total_discount);
    const ppnPercentage = toNumberValue(formData.ppn_percentage);

    const totalPrice = Math.max(subTotal - discount, 0);
    const ppnRupiah = Math.round(totalPrice * (ppnPercentage / 100));
    const grandTotal = totalPrice + ppnRupiah;

    setFormData((prev) => ({
      ...prev,
      total_price: String(totalPrice),
      ppnRupiah: String(ppnRupiah),
      grand_total: String(grandTotal),
    }));
    toastService.info(
      'Nilai finansial dihitung otomatis. Silakan simpan untuk menerapkan.'
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.deliver_to.trim()) {
      newErrors.deliver_to = 'Tujuan pengiriman wajib diisi.';
    }

    numericFields.forEach((field) => {
      const value = formData[field];
      if (value !== '' && Number.isNaN(Number(value))) {
        newErrors[field] = 'Masukkan angka yang valid.';
      }
      if (Number(value) < 0) {
        newErrors[field] = 'Nilai tidak boleh negatif.';
      }
    });

    if (!formData.sub_total) {
      newErrors.sub_total = 'Sub total wajib diisi.';
    }
    if (!formData.total_price) {
      newErrors.total_price = 'Total harga wajib diisi.';
    }
    if (!formData.grand_total) {
      newErrors.grand_total = 'Grand total wajib diisi.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toastService.error('Periksa kembali isian formulir.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice?.id) {
      toastService.error('Data invoice pengiriman tidak ditemukan');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = { ...formData };
      numericFields.forEach((field) => {
        payload[field] = toNumberValue(formData[field]);
      });

      const result = await invoicePengirimanService.updateInvoicePengiriman(
        invoice.id,
        payload
      );
      if (result?.success === false) {
        throw new Error(
          result?.error?.message || 'Gagal memperbarui invoice pengiriman'
        );
      }

      const updatedInvoice = result?.data || result || {};
      if (!updatedInvoice.id) {
        updatedInvoice.id = invoice.id;
      }

      onInvoiceUpdated(updatedInvoice);
      toastService.success('Invoice pengiriman berhasil diperbarui');
      onClose();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Gagal memperbarui invoice pengiriman';
      toastService.error(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-10'>
      <div className='relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-start justify-between border-b border-gray-200 px-6 py-5'>
          <div>
            <p className='text-sm font-semibold uppercase tracking-wide text-blue-600'>
              Ubah Invoice Pengiriman
            </p>
            <h2 className='mt-1 text-2xl font-bold text-gray-900'>
              {invoice?.no_invoice || '-'}{' '}
            </h2>
            <p className='text-sm text-gray-500'>
              Tanggal dibuat:{' '}
              {invoice?.tanggal
                ? new Date(invoice.tanggal).toLocaleDateString('id-ID')
                : '-'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'
            aria-label='Tutup modal'
          >
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        {invoiceError ? (
          <div className='px-6 py-12 text-center'>
            <p className='mb-6 text-sm text-red-600'>{invoiceError}</p>
            <div className='flex justify-center space-x-3'>
              {onRetry ? (
                <button
                  type='button'
                  onClick={onRetry}
                  className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
                >
                  Coba Muat Ulang
                </button>
              ) : null}
              <button
                type='button'
                onClick={onClose}
                className='inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
              >
                Tutup
              </button>
            </div>
          </div>
        ) : invoiceLoading ? (
          <div className='flex items-center justify-center px-6 py-24'>
            <div className='w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin' />
          </div>
        ) : !invoice ? (
          <div className='px-6 py-12 text-center text-sm text-gray-600'>
            Data invoice pengiriman tidak tersedia.
          </div>
        ) : (
          <div className='max-h-[80vh] overflow-y-auto px-6 py-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div className='rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-blue-500'>
                  Grand Total
                </p>
                <p className='mt-2 text-xl font-bold text-blue-700'>
                  {formatCurrencyDisplay(formData.grand_total)}
                </p>
              </div>
              <div className='rounded-xl border border-gray-100 bg-gray-50 p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  Total Harga (setelah diskon)
                </p>
                <p className='mt-2 text-lg font-semibold text-gray-800'>
                  {formatCurrencyDisplay(derivedTotals.totalPrice)}
                </p>
              </div>
              <div className='rounded-xl border border-gray-100 bg-gray-50 p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  PPN
                </p>
                <p className='mt-2 text-lg font-semibold text-gray-800'>
                  {formatCurrencyDisplay(derivedTotals.ppnRupiah)} (
                  {derivedTotals.ppnPercentage}% )
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='mt-6 space-y-8'>
              <section>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Informasi Dasar
                </h3>
                <p className='text-sm text-gray-500'>
                  Perbarui data pelanggan dan ketentuan pembayaran.
                </p>
                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <label
                      htmlFor='deliver_to'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      Tujuan Pengiriman *
                    </label>
                    <input
                      id='deliver_to'
                      name='deliver_to'
                      type='text'
                      value={formData.deliver_to}
                      onChange={(e) =>
                        handleChange('deliver_to', e.target.value)
                      }
                      className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.deliver_to ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder='Masukkan alamat tujuan'
                      disabled={submitLoading}
                    />
                    {errors.deliver_to && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.deliver_to}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='expired_date'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      Tanggal Jatuh Tempo
                    </label>
                    <input
                      id='expired_date'
                      name='expired_date'
                      type='date'
                      value={formData.expired_date}
                      onChange={(e) =>
                        handleChange('expired_date', e.target.value)
                      }
                      className='w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400'
                      disabled={submitLoading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='termOfPaymentId'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      Term of Payment (Optional)
                    </label>
                    <input
                      id='termOfPaymentId'
                      name='termOfPaymentId'
                      type='text'
                      value={formData.termOfPaymentId}
                      onChange={(e) =>
                        handleChange('termOfPaymentId', e.target.value)
                      }
                      placeholder='Term of Payment ID'
                      className='w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400'
                      disabled={submitLoading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='type'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      Tipe Invoice
                    </label>
                    <select
                      id='type'
                      name='type'
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className='w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400'
                      disabled={submitLoading}
                    >
                      <option value='PEMBAYARAN'>PEMBAYARAN</option>
                      <option value='PENGIRIMAN'>PENGIRIMAN</option>
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Rincian Finansial
                    </h3>
                    <p className='text-sm text-gray-500'>
                      Pastikan nilai sesuai dengan dokumen dan perhitungan
                      pajak.
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={recalculateFinancials}
                    className='inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-60'
                    disabled={submitLoading}
                  >
                    <ArrowPathIcon className='h-4 w-4' /> Hitung otomatis
                  </button>
                </div>

                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <label
                      htmlFor='sub_total'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      Sub Total *
                    </label>
                    <input
                      id='sub_total'
                      name='sub_total'
                      type='number'
                      step='0.01'
                      value={formData.sub_total}
                      onChange={(e) =>
                        handleChange('sub_total', e.target.value)
                      }
                      className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.sub_total ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder='Subtotal sebelum diskon'
                      disabled={submitLoading}
                    />
                    {errors.sub_total && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.sub_total}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='total_discount'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      Total Diskon
                    </label>
                    <input
                      id='total_discount'
                      name='total_discount'
                      type='number'
                      step='0.01'
                      value={formData.total_discount}
                      onChange={(e) =>
                        handleChange('total_discount', e.target.value)
                      }
                      className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.total_discount ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder='Diskon total (opsional)'
                      disabled={submitLoading}
                    />
                    {errors.total_discount && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.total_discount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='total_price'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      Total Harga *
                    </label>
                    <input
                      id='total_price'
                      name='total_price'
                      type='number'
                      step='0.01'
                      value={formData.total_price}
                      onChange={(e) =>
                        handleChange('total_price', e.target.value)
                      }
                      className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.total_price ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder='Harga setelah diskon'
                      disabled={submitLoading}
                    />
                    {errors.total_price && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.total_price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='ppn_percentage'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      PPN (%)
                    </label>
                    <input
                      id='ppn_percentage'
                      name='ppn_percentage'
                      type='number'
                      step='0.01'
                      value={formData.ppn_percentage}
                      onChange={(e) =>
                        handleChange('ppn_percentage', e.target.value)
                      }
                      className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.ppn_percentage ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder='Persentase PPN'
                      disabled={submitLoading}
                    />
                    {errors.ppn_percentage && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.ppn_percentage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='ppnRupiah'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      PPN (Rp)
                    </label>
                    <input
                      id='ppnRupiah'
                      name='ppnRupiah'
                      type='number'
                      step='0.01'
                      value={formData.ppnRupiah}
                      onChange={(e) =>
                        handleChange('ppnRupiah', e.target.value)
                      }
                      className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.ppnRupiah ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder='Nilai PPN dalam Rupiah'
                      disabled={submitLoading}
                    />
                    {errors.ppnRupiah && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.ppnRupiah}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='grand_total'
                      className='mb-1 block text-sm font-medium text-gray-700'
                    >
                      Grand Total *
                    </label>
                    <input
                      id='grand_total'
                      name='grand_total'
                      type='number'
                      step='0.01'
                      value={formData.grand_total}
                      onChange={(e) =>
                        handleChange('grand_total', e.target.value)
                      }
                      className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.grand_total ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder='Total akhir termasuk PPN'
                      disabled={submitLoading}
                    />
                    {errors.grand_total && (
                      <p className='mt-1 text-sm text-red-600'>
                        {errors.grand_total}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Catatan Sistem
                </h3>
                <p className='text-sm text-gray-500'>
                  Informasi referensi yang dihasilkan secara otomatis oleh
                  sistem.
                </p>
                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                      Dibuat Oleh
                    </p>
                    <p className='mt-1 text-sm font-medium text-gray-800'>
                      {invoice?.createdBy || '-'}
                    </p>
                  </div>
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                      Diperbarui Oleh
                    </p>
                    <p className='mt-1 text-sm font-medium text-gray-800'>
                      {invoice?.updatedBy || '-'}
                    </p>
                  </div>
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                      Dibuat Pada
                    </p>
                    <p className='mt-1 text-sm font-medium text-gray-800'>
                      {invoice?.createdAt
                        ? new Date(invoice.createdAt).toLocaleString('id-ID')
                        : '-'}
                    </p>
                  </div>
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                      Diperbarui Pada
                    </p>
                    <p className='mt-1 text-sm font-medium text-gray-800'>
                      {invoice?.updatedAt
                        ? new Date(invoice.updatedAt).toLocaleString('id-ID')
                        : '-'}
                    </p>
                  </div>
                </div>
              </section>

              <div className='flex justify-end gap-3 border-t border-gray-200 pt-6'>
                <button
                  type='button'
                  onClick={onClose}
                  className='rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100'
                  disabled={submitLoading}
                >
                  Batal
                </button>
                <button
                  type='submit'
                  className='inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60'
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditInvoicePengirimanModal;
