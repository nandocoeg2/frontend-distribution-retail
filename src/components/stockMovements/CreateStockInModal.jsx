import React, { useEffect, useMemo, useState, useId } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import StockMovementItemsInput from './StockMovementItemsInput.jsx';

const initialFormState = {
  supplierId: '',
  notes: '',
  items: [{ inventoryId: '', quantity: '' }],
};

const CreateStockInModal = ({
  show,
  onClose,
  onSubmit,
  inventories = [],
  suppliers = [],
  optionsLoading = false,
}) => {
  const supplierListId = useId();
  const [form, setForm] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(initialFormState);
      setFormError('');
      setIsSubmitting(false);
    }
  }, [show]);

  const supplierOptions = useMemo(() => {
    if (!Array.isArray(suppliers)) {
      return [];
    }

    return suppliers
      .map((supplier) => ({
        id: supplier?.id || '',
        label:
          supplier?.name ||
          supplier?.nama ||
          supplier?.company_name ||
          supplier?.companyName ||
          supplier?.id ||
          '',
      }))
      .filter((option) => option.id);
  }, [suppliers]);

  const handleItemsChange = (items) => {
    setForm((prev) => ({
      ...prev,
      items,
    }));
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const supplierId = form.supplierId.trim();
    if (!supplierId) {
      return 'Supplier wajib dipilih.';
    }

    if (!Array.isArray(form.items) || form.items.length === 0) {
      return 'Minimal tambahkan satu item inventory.';
    }

    for (let index = 0; index < form.items.length; index += 1) {
      const item = form.items[index];
      const inventoryId = (item.inventoryId || '').trim();
      const quantity = Number(item.quantity);

      if (!inventoryId) {
        return `Inventory pada baris ${index + 1} wajib diisi.`;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return `Quantity pada baris ${index + 1} harus lebih dari 0.`;
      }
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      supplierId: form.supplierId.trim(),
      notes: form.notes.trim(),
      items: form.items.map((item) => ({
        inventoryId: item.inventoryId.trim(),
        quantity: Number(item.quantity),
      })),
    };

    if (!payload.notes) {
      delete payload.notes;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message =
        err?.message || 'Gagal mencatat stock in. Coba lagi nanti.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <div className='w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5'>
        <div className='flex items-start justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500 px-6 py-5 text-white'>
          <div>
            <h2 className='text-xl font-semibold'>Catat Stock In</h2>
            <p className='mt-1 text-xs text-indigo-100'>
              Lengkapi informasi penerimaan stok sebelum menyimpan perubahan.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full bg-white/10 p-2 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60'
            aria-label='Tutup modal'
          >
            <XMarkIcon className='h-5 w-5' aria-hidden='true' />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='max-h-[80vh] overflow-y-auto px-6 py-6 space-y-6'
        >
          <section className='rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='flex flex-col'>
                <label
                  htmlFor='supplierId'
                  className='text-sm font-medium text-gray-700'
                >
                  Pilih Supplier
                </label>
                <input
                  id='supplierId'
                  name='supplierId'
                  list={supplierListId}
                  value={form.supplierId}
                  onChange={handleFieldChange}
                  placeholder='Cari atau masukkan ID supplier'
                  autoComplete='off'
                  className='mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  aria-describedby='supplier-helper'
                />
                <datalist id={supplierListId}>
                  {supplierOptions.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.label}
                    </option>
                  ))}
                </datalist>
                <div className='mt-2 flex items-start gap-2 text-xs text-gray-500'>
                  <span className='inline-flex h-2 w-2 translate-y-1 rounded-full bg-indigo-400' />
                  <p id='supplier-helper'>
                    Gunakan daftar untuk memilih supplier atau ketik manual ID yang valid.
                    {optionsLoading && (
                      <span className='ml-1 text-indigo-600'>
                        Memuat data supplier...
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className='flex flex-col'>
                <label
                  htmlFor='notes'
                  className='text-sm font-medium text-gray-700'
                >
                  Catatan Penerimaan
                </label>
                <textarea
                  id='notes'
                  name='notes'
                  rows={4}
                  value={form.notes}
                  onChange={handleFieldChange}
                  placeholder='Contoh: Restock mingguan dari supplier utama'
                  className='mt-2 block h-full w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
                <p className='mt-2 text-xs text-gray-500'>
                  Opsional, gunakan untuk menyimpan catatan pengecekan, nomor dokumen, atau info tambahan.
                </p>
              </div>
            </div>
          </section>

          <StockMovementItemsInput
            items={form.items}
            onChange={handleItemsChange}
            inventories={inventories}
            loading={optionsLoading}
          />

          {formError && (
            <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm'>
              {formError}
            </div>
          )}

          <div className='flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end sm:gap-4'>
            <button
              type='button'
              onClick={onClose}
              className='inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            >
              Batalkan
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='inline-flex items-center justify-center rounded-xl border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Stock In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStockInModal;
