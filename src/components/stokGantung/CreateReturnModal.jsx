import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import StokGantungItemsInput from './StokGantungItemsInput.jsx';

const initialFormState = {
    reason: '',
    items: [{ itemId: '', quantity: '' }],
};

const CreateReturnModal = ({
    show,
    onClose,
    onSubmit,
    itemOptions = [],
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
            return 'Minimal tambahkan satu item.';
        }

        for (let index = 0; index < form.items.length; index += 1) {
            const item = form.items[index];
            const itemId = (item.itemId || '').trim();
            const quantity = Number(item.quantity);

            if (!itemId) {
                return `Item pada baris ${index + 1} wajib diisi.`;
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
                itemId: item.itemId.trim(),
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
            <div className='w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5'>
                <div className='flex items-start justify-between border-b border-pink-100 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 px-6 py-5 text-white'>
                    <div>
                        <h2 className='text-xl font-semibold'>Catat Stok Gantung</h2>
                        <p className='mt-1 text-xs text-rose-100'>
                            Isi detail retur pelanggan untuk melacak proses klasifikasi.
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
                        <label
                            htmlFor='reason'
                            className='block text-sm font-medium text-gray-700'
                        >
                            Alasan Retur
                        </label>
                        <textarea
                            id='reason'
                            name='reason'
                            rows={4}
                            value={form.reason}
                            onChange={handleFieldChange}
                            placeholder='Ceritakan kondisi retur, contoh: Barang rusak ketika diterima'
                            className='mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500'
                        />
                        <p className='mt-2 text-xs text-gray-500'>
                            Opsional, namun sangat membantu tim gudang saat menilai kelayakan restock / reject.
                        </p>
                    </section>

                    <StokGantungItemsInput
                        items={form.items}
                        onChange={handleItemsChange}
                        itemCatalog={itemOptions}
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
                            className='inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2'
                        >
                            Batalkan
                        </button>
                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className='inline-flex items-center justify-center rounded-xl border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Stok Gantung'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateReturnModal;
