import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const dateField = (label, name, value, onChange) => (
  <div>
    <label className='block text-xs font-medium text-gray-600 mb-1'>{label}</label>
    <input name={name} type='date' value={value || ''} onChange={onChange}
      className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500' />
  </div>
);

const numField = (label, name, value, onChange) => (
  <div>
    <label className='block text-xs font-medium text-gray-600 mb-1'>{label}</label>
    <input name={name} type='number' step='0.01' min='0' value={value || ''} onChange={onChange}
      className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500' />
  </div>
);

const textField = (label, name, value, onChange) => (
  <div>
    <label className='block text-xs font-medium text-gray-600 mb-1'>{label}</label>
    <input name={name} type='text' maxLength={255} value={value || ''} onChange={onChange}
      className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500' />
  </div>
);

const toDateInput = (v) => {
  if (!v) return '';
  try { return new Date(v).toISOString().split('T')[0]; } catch { return ''; }
};

const EditTagihanModal = ({ show, onClose, onSubmit, record }) => {
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show && record) {
      setForm({
        no_kwitansi: record.no_kwitansi || '',
        no_invoice: record.no_invoice || '',
        no_faktur_pajak: record.no_faktur_pajak || '',
        tanggal_faktur_pajak: toDateInput(record.tanggal_faktur_pajak),
        dpp: record.dpp != null ? String(record.dpp) : '',
        ppn: record.ppn != null ? String(record.ppn) : '',
        tanggal_ttf: toDateInput(record.tanggal_ttf),
        tanggal_jatuh_tempo: toDateInput(record.tanggal_jatuh_tempo),
        tanggal_payment_list: toDateInput(record.tanggal_payment_list),
        tanggal_dibayar: toDateInput(record.tanggal_dibayar),
        total_dibayar: record.total_dibayar != null ? String(record.total_dibayar) : '',
      });
      setFormError('');
      setIsSubmitting(false);
    }
  }, [show, record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const payload = {
      no_kwitansi: form.no_kwitansi || null,
      no_invoice: form.no_invoice || null,
      no_faktur_pajak: form.no_faktur_pajak || null,
      tanggal_faktur_pajak: form.tanggal_faktur_pajak || null,
      dpp: form.dpp ? Number(form.dpp) : null,
      ppn: form.ppn ? Number(form.ppn) : null,
      tanggal_ttf: form.tanggal_ttf || null,
      tanggal_jatuh_tempo: form.tanggal_jatuh_tempo || null,
      tanggal_payment_list: form.tanggal_payment_list || null,
      tanggal_dibayar: form.tanggal_dibayar || null,
      total_dibayar: form.total_dibayar ? Number(form.total_dibayar) : null,
    };

    try {
      await onSubmit(record.id, payload);
      onClose();
    } catch (err) {
      setFormError(err?.message || 'Gagal menyimpan tagihan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show || !record) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <div className='flex items-center justify-between border-b border-gray-200 bg-amber-600 px-5 py-3 text-white'>
          <div>
            <h2 className='text-base font-semibold'>Edit Tagihan</h2>
            <p className='text-xs text-amber-100'>
              {record.supplier?.name} — {record.item?.nama_barang} — {record.movementNumber}
            </p>
          </div>
          <button type='button' onClick={onClose} className='rounded p-1 hover:bg-white/20'>
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='max-h-[75vh] overflow-y-auto px-5 py-4 space-y-3'>
          <div className='grid gap-3 sm:grid-cols-3'>
            {textField('No Kwitansi', 'no_kwitansi', form.no_kwitansi, handleChange)}
            {textField('No Invoice', 'no_invoice', form.no_invoice, handleChange)}
            {textField('No Faktur Pajak', 'no_faktur_pajak', form.no_faktur_pajak, handleChange)}
          </div>

          <div className='grid gap-3 sm:grid-cols-3'>
            {dateField('Tgl Faktur Pajak', 'tanggal_faktur_pajak', form.tanggal_faktur_pajak, handleChange)}
            {numField('DPP', 'dpp', form.dpp, handleChange)}
            {numField('PPN', 'ppn', form.ppn, handleChange)}
          </div>

          <div className='grid gap-3 sm:grid-cols-3'>
            {dateField('Tgl TTF', 'tanggal_ttf', form.tanggal_ttf, handleChange)}
            {dateField('Tgl Jatuh Tempo', 'tanggal_jatuh_tempo', form.tanggal_jatuh_tempo, handleChange)}
            {dateField('Tgl Payment List', 'tanggal_payment_list', form.tanggal_payment_list, handleChange)}
          </div>

          <div className='grid gap-3 sm:grid-cols-3'>
            {dateField('Tgl Dibayar', 'tanggal_dibayar', form.tanggal_dibayar, handleChange)}
            {numField('Total Dibayar', 'total_dibayar', form.total_dibayar, handleChange)}
            <div /> {/* spacer */}
          </div>

          {formError && (
            <div className='rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{formError}</div>
          )}

          <div className='flex justify-end gap-2 pt-2 border-t border-gray-100'>
            <button type='button' onClick={onClose}
              className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'>
              Batal
            </button>
            <button type='submit' disabled={isSubmitting}
              className='rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50'>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tagihan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTagihanModal;
