import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const fieldGroups = [
  {
    label: 'PO',
    color: 'blue',
    fields: [
      { key: 'nama_supplier', label: 'Nama Supplier', type: 'text', required: true, placeholder: 'PT Sumber Makmur' },
      { key: 'no_po', label: 'No PO', type: 'text', required: true, placeholder: 'PO-2026-001' },
      { key: 'item', label: 'Item', type: 'text', required: true, placeholder: 'Sabun Cair 500ml' },
      { key: 'spesifikasi', label: 'Spesifikasi', type: 'text', placeholder: 'Varian Lavender' },
      { key: 'qty_po_pcs', label: 'Qty PO (PCS)', type: 'number', required: true, placeholder: '1000' },
      { key: 'harga_pcs', label: 'Harga (PCS)', type: 'number', required: true, placeholder: '15000' },
    ],
  },
  {
    label: 'Barang Masuk',
    color: 'green',
    fields: [
      { key: 'tanggal_kirim', label: 'Tanggal Kirim', type: 'date', placeholder: '2026-04-01' },
      { key: 'no_surat_jalan', label: 'No. Surat Jalan', type: 'text', placeholder: 'SJ-2026-001' },
      { key: 'qty_kirim', label: 'Qty Kirim', type: 'number', placeholder: '500' },
      { key: 'qty_sisa_po', label: 'Qty Sisa PO', type: 'number', placeholder: '500' },
    ],
  },
  {
    label: 'Tagihan',
    color: 'amber',
    fields: [
      { key: 'no_kwitansi', label: 'No Kwitansi', type: 'text', placeholder: 'KW-2026-001' },
      { key: 'no_invoice', label: 'No Invoice', type: 'text', placeholder: 'INV-2026-001' },
      { key: 'no_faktur_pajak', label: 'No Faktur Pajak', type: 'text', placeholder: '010.000-26.00000001' },
      { key: 'tanggal_faktur_pajak', label: 'Tgl Faktur Pajak', type: 'date', placeholder: '2026-04-05' },
      { key: 'dpp', label: 'DPP', type: 'number', placeholder: '7500000' },
      { key: 'ppn', label: 'PPN', type: 'number', placeholder: '825000' },
      { key: 'total_invoice', label: 'Total Invoice', type: 'number', placeholder: '8325000' },
      { key: 'tanggal_ttf', label: 'Tgl TTF', type: 'date', placeholder: '2026-04-10' },
      { key: 'tanggal_jatuh_tempo', label: 'Tgl Jatuh Tempo', type: 'date', placeholder: '2026-05-10' },
      { key: 'tanggal_payment_list', label: 'Tgl Payment List', type: 'date', placeholder: '2026-05-01' },
      { key: 'tanggal_dibayar', label: 'Tgl Dibayar', type: 'date', placeholder: '2026-05-08' },
      { key: 'selisih', label: 'Selisih', type: 'number', placeholder: '0' },
    ],
  },
];

const buildInitial = (data) => {
  const state = {};
  fieldGroups.forEach((g) =>
    g.fields.forEach((f) => {
      if (data && data[f.key] !== undefined && data[f.key] !== null) {
        state[f.key] = f.type === 'date' && data[f.key]
          ? data[f.key].slice(0, 10)
          : String(data[f.key]);
      } else {
        state[f.key] = '';
      }
    })
  );
  return state;
};

const groupColorMap = {
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700' },
  green: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700' },
  amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
};

const ReportPoSupplierFormModal = ({ show, onClose, onSubmit, editData = null }) => {
  const isEdit = !!editData;
  const [form, setForm] = useState(() => buildInitial(editData));
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(buildInitial(editData));
      setFormError('');
      setIsSubmitting(false);
    }
  }, [show, editData]);

  const handleChange = (key, value, type) => {
    let sanitized = value;
    if (type === 'number') {
      // allow digits, dot, minus for decimals
      sanitized = value.replace(/[^0-9.\-]/g, '');
    }
    setForm((prev) => ({ ...prev, [key]: sanitized }));
  };

  const validate = () => {
    if (!form.nama_supplier.trim()) return 'Nama Supplier wajib diisi.';
    if (!form.no_po.trim()) return 'No PO wajib diisi.';
    if (!form.item.trim()) return 'Item wajib diisi.';
    const qty = Number(form.qty_po_pcs);
    if (!Number.isFinite(qty) || qty <= 0) return 'Qty PO (PCS) harus bernilai positif.';
    const harga = Number(form.harga_pcs);
    if (!Number.isFinite(harga) || harga <= 0) return 'Harga (PCS) harus bernilai positif.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }

    const payload = {};
    fieldGroups.forEach((g) =>
      g.fields.forEach((f) => {
        const v = form[f.key];
        if (v === '' || v === undefined || v === null) return;
        if (f.type === 'number') {
          const n = Number(v);
          if (Number.isFinite(n)) payload[f.key] = n;
        } else if (f.type === 'date') {
          payload[f.key] = v;
        } else {
          payload[f.key] = v.trim();
        }
      })
    );

    setFormError('');
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setFormError(error?.message || 'Gagal menyimpan data. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-gray-200 bg-indigo-600 px-5 py-3 text-white'>
          <h2 className='text-base font-semibold'>{isEdit ? 'Edit' : 'Tambah'} Report PO Supplier</h2>
          <button type='button' onClick={onClose} className='rounded p-1 hover:bg-white/20 focus:outline-none' aria-label='Tutup modal'>
            <XMarkIcon className='h-5 w-5' aria-hidden='true' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='max-h-[85vh] overflow-y-auto'>
          {fieldGroups.map((group) => {
            const c = groupColorMap[group.color];
            return (
              <div key={group.label} className={`border-b ${c.border} px-5 py-3`}>
                <div className={`mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${c.bg} ${c.text}`}>
                  {group.label}
                </div>
                <div className='grid gap-2 sm:grid-cols-3'>
                  {group.fields.map((f) => (
                    <div key={f.key}>
                      <label htmlFor={f.key} className='block text-[11px] font-medium text-gray-500 mb-0.5'>
                        {f.label}{f.required && <span className='text-red-500'> *</span>}
                      </label>
                      <input
                        id={f.key}
                        type={f.type === 'date' ? 'date' : 'text'}
                        inputMode={f.type === 'number' ? 'decimal' : undefined}
                        value={form[f.key]}
                        onChange={(e) => handleChange(f.key, e.target.value, f.type)}
                        placeholder={f.placeholder}
                        className='w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {formError && (
            <div className='mx-5 my-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
              {formError}
            </div>
          )}

          <div className='flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3'>
            <button type='button' onClick={onClose}
              className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500'>
              Batal
            </button>
            <button type='submit' disabled={isSubmitting}
              className='rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50'>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportPoSupplierFormModal;
