import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import StockMovementItemsInput from './StockMovementItemsInput.jsx';

const initialFormState = {
  reason: '',
  items: [{ inventoryId: '', quantity: '' }],
};

const CreateReturnModal = ({
  show,
  onClose,
  onSubmit,
  inventories = [],
  optionsLoading = false,
}) => {
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
      reason: form.reason.trim(),
      items: form.items.map((item) => ({
        inventoryId: item.inventoryId.trim(),
        quantity: Number(item.quantity),
      })),
    };

    if (!payload.reason) {
      delete payload.reason;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message =
        err?.message || 'Gagal mencatat return. Coba lagi nanti.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
      <div className='w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-start justify-between border-b border-gray-200 bg-gradient-to-r from-rose-50 to-pink-50 px-6 py-4'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Create Return
            </h2>
            <p className='text-sm text-gray-600'>
              Catat retur pelanggan. Status awal PENDING menunggu klasifikasi.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full p-2 text-gray-500 transition hover:bg-white hover:text-gray-700'
            aria-label='Tutup modal'
          >
            <XMarkIcon className='h-5 w-5' aria-hidden='true' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='max-h-[75vh] overflow-y-auto px-6 py-5 space-y-6'>
          <div>
            <label
              htmlFor='reason'
              className='block text-sm font-medium text-gray-700'
            >
              Alasan Retur (Opsional)
            </label>
            <textarea
              id='reason'
              name='reason'
              rows={3}
              value={form.reason}
              onChange={handleFieldChange}
              placeholder='Barang rusak ketika diterima'
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
            />
            <p className='mt-1 text-xs text-gray-500'>
              Alasan akan tersimpan sebagai catatan pada pergerakan stok.
            </p>
          </div>

          <StockMovementItemsInput
            items={form.items}
            onChange={handleItemsChange}
            inventories={inventories}
            loading={optionsLoading}
          />

          {formError && (
            <div className='rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
              {formError}
            </div>
          )}

          <div className='flex justify-end space-x-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2'
            >
              Batal
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='inline-flex items-center rounded-md border border-transparent bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReturnModal;

