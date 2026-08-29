import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete.jsx';
import useCustomerSearch from '../../hooks/useCustomerSearch';

const EditStokGantungModal = ({
    isOpen,
    onClose,
    movement,
    onSave,
    isLoading = false,
}) => {
    const [customerId, setCustomerId] = useState('');
    const [ekspedisi, setEkspedisi] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const {
        searchResults: customerResults = [],
        loading: customerSearchLoading,
        searchCustomers,
    } = useCustomerSearch();

    // Initial customer from movement
    const initialCustomer = useMemo(() => {
        if (!movement) return null;
        const cust =
            movement.customer ||
            movement.purchaseOrder?.customer ||
            null;
        const cId = movement.customerId || movement.customer?.id || movement.purchaseOrder?.customerId || '';
        const cName = movement.customerName || cust?.namaCustomer || cust?.nama_customer || '';
        const cCode = cust?.kodeCustomer || cust?.kode_customer || '';
        if (cId) {
            return { id: cId, label: cName || cId, code: cCode };
        }
        return null;
    }, [movement]);

    // Build customer options including initial customer if present
    const customerOptions = useMemo(() => {
        const list = customerResults.map((c) => ({
            id: c.id,
            label: c.namaCustomer || c.nama_customer || c.id,
            code: c.kodeCustomer || c.kode_customer || '',
        }));

        if (initialCustomer && !list.some((c) => c.id === initialCustomer.id)) {
            return [initialCustomer, ...list];
        }
        return list;
    }, [customerResults, initialCustomer]);

    useEffect(() => {
        if (isOpen && movement) {
            const currentCustId =
                movement.customerId ||
                movement.customer?.id ||
                movement.purchaseOrder?.customerId ||
                '';
            const checklist =
                movement.suratJalan?.checklistSuratJalan ||
                movement.purchaseOrder?.suratJalan?.checklistSuratJalan ||
                null;
            const expedisiFromNotes = movement.notes?.match(/\[EKSPEDISI:\s*([^\]]+)\]/i)?.[1]?.trim() ||
                movement.rawNotes?.match(/\[EKSPEDISI:\s*([^\]]+)\]/i)?.[1]?.trim() ||
                '';
            const currentEkspedisi =
                movement.expedisi ||
                checklist?.ekspedisi ||
                expedisiFromNotes ||
                '';

            const rawNotes = movement.notes || movement.rawNotes || '';
            const cleanNotes = rawNotes.replace(/\[EKSPEDISI:[^\]]*\]/gi, '').trim();

            setCustomerId(currentCustId);
            setEkspedisi(currentEkspedisi);
            setNotes(cleanNotes);
            setError('');
        }
    }, [isOpen, movement]);

    if (!isOpen || !movement) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await onSave({
                movementId: movement.id,
                customerId: customerId || null,
                ekspedisi: ekspedisi.trim() || null,
                notes: notes.trim() || null,
            });
        } catch (err) {
            setError(err?.message || 'Gagal menyimpan perubahan');
        }
    };

    const movementNumber = movement.movementNumber || movement.documentNumber || movement.id;
    const poNumber = movement.poNumber || movement.purchaseOrder?.po_number || movement.no_po || '-';

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div className='w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
                {/* Header */}
                <div className='flex items-center justify-between border-b border-gray-200 bg-rose-600 px-5 py-3.5 text-white'>
                    <div>
                        <h2 className='text-base font-semibold'>Edit Data Stok Gantung</h2>
                        <p className='text-xs text-rose-100'>
                            No. Dokumen: {movementNumber} | No. PO: {poNumber}
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        disabled={isLoading}
                        className='rounded p-1 hover:bg-white/20 focus:outline-none disabled:opacity-50'
                        aria-label='Tutup modal'
                    >
                        <XMarkIcon className='h-5 w-5' aria-hidden='true' />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='p-5 space-y-4'>
                    {error && (
                        <div className='rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200'>
                            {error}
                        </div>
                    )}

                    {/* Customer */}
                    <div>
                        <label htmlFor='customerId' className='block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1'>
                            Customer
                        </label>
                        <Autocomplete
                            name='customerId'
                            options={customerOptions}
                            value={customerId ? String(customerId) : ''}
                            onChange={(val) => {
                                const resolved = val?.target ? val.target.value : val;
                                setCustomerId(resolved || '');
                            }}
                            placeholder='Cari / pilih customer...'
                            displayKey='label'
                            valueKey='id'
                            loading={customerSearchLoading}
                            onSearch={async (query) => {
                                try {
                                    await searchCustomers(query, 1, 20);
                                } catch (e) {
                                    console.error(e);
                                }
                            }}
                            showId
                            clearable
                        />
                    </div>

                    {/* Ekspedisi */}
                    <div>
                        <label htmlFor='ekspedisi' className='block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1'>
                            Ekspedisi
                        </label>
                        <input
                            id='ekspedisi'
                            name='ekspedisi'
                            type='text'
                            value={ekspedisi}
                            onChange={(e) => setEkspedisi(e.target.value)}
                            placeholder='Nama ekspedisi (misal: JNE, Indah Cargo, Pribadi)'
                            maxLength={255}
                            className='h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20'
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor='notes' className='block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1'>
                            Catatan / Notes
                        </label>
                        <textarea
                            id='notes'
                            name='notes'
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder='Masukkan catatan terkait barang return...'
                            maxLength={255}
                            className='w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20'
                        />
                        <div className='flex justify-end text-[11px] text-gray-400 mt-0.5'>
                            {notes.length}/255 karakter
                        </div>
                    </div>

                    {/* Actions */}
                    <div className='flex justify-end gap-2.5 pt-2 border-t border-gray-100'>
                        <button
                            type='button'
                            onClick={onClose}
                            disabled={isLoading}
                            className='rounded-md border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition-colors'
                        >
                            Batal
                        </button>
                        <button
                            type='submit'
                            disabled={isLoading}
                            className='rounded-md bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700 focus:outline-none disabled:opacity-50 transition-colors inline-flex items-center gap-1.5'
                        >
                            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStokGantungModal;
