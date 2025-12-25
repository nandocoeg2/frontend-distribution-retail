import React, { useMemo } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';

const defaultItem = { itemId: '', quantity: '' };

const StokGantungItemsInput = ({
    items,
    onChange,
    itemCatalog = [],
    loading = false,
}) => {
    const itemOptions = useMemo(() => {
        if (!Array.isArray(itemCatalog)) {
            return [];
        }

        return itemCatalog
            .map((item) => ({
                id: item?.id || '',
                label:
                    item?.nama_barang ||
                    item?.name ||
                    item?.inventoryName ||
                    item?.inventory_name ||
                    item?.sku ||
                    item?.plu ||
                    item?.id ||
                    '',
            }))
            .filter((option) => option.id && option.label);
    }, [itemCatalog]);

    const handleItemChange = (index, field, value) => {
        const nextItems = items.map((item, currentIndex) =>
            currentIndex === index ? { ...item, [field]: value } : item
        );
        onChange(nextItems);
    };

    const handleAddItem = () => {
        onChange([...items, { ...defaultItem }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length === 1) {
            return;
        }

        const nextItems = items.filter((_, currentIndex) => currentIndex !== index);
        onChange(nextItems);
    };

    return (
        <section className='space-y-5'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
                <div>
                    <h2 className='text-sm font-semibold text-gray-900'>
                        Detail Item
                    </h2>
                    <p className='text-xs text-gray-500'>
                        Pilih item dan isi quantity sesuai barang yang diretur.
                    </p>
                </div>
                <button
                    type='button'
                    onClick={handleAddItem}
                    className='inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2'
                >
                    <PlusIcon className='mr-1 h-4 w-4' aria-hidden='true' />
                    Tambah Item
                </button>
            </div>

            {loading && (
                <div className='flex items-center gap-2 rounded-lg border border-dashed border-rose-200 bg-rose-50/60 px-3 py-2 text-xs text-rose-700'>
                    <span className='inline-flex h-2 w-2 animate-pulse rounded-full bg-rose-500' />
                    Memuat data item terbaru...
                </div>
            )}

            <div className='space-y-4'>
                {items.map((item, index) => {
                    const itemIndex = index + 1;
                    return (
                        <div
                            key={`movement-item-${index}`}
                            className='rounded-xl border border-gray-200 bg-gray-50/60 p-4 shadow-sm'
                        >
                            <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                <div>
                                    <span className='inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow'>
                                        Item #{itemIndex}
                                    </span>
                                    <p className='mt-2 text-xs text-gray-500'>
                                        Masukkan ID item dan quantity sesuai dokumen sumber.
                                    </p>
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type='button'
                                        onClick={() => handleRemoveItem(index)}
                                        className='inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                                        aria-label={`Hapus item ${itemIndex}`}
                                    >
                                        <TrashIcon className='mr-1 h-4 w-4' aria-hidden='true' />
                                        Hapus
                                    </button>
                                )}
                            </div>

                            <div className='grid gap-4 sm:grid-cols-2'>
                                <div>
                                    <label
                                        htmlFor={`item-id-${index}`}
                                        className='block text-sm font-medium text-gray-700'
                                    >
                                        Item
                                    </label>
                                    <Autocomplete
                                        label=''
                                        name={`itemId-${index}`}
                                        options={itemOptions}
                                        value={item.itemId ? String(item.itemId) : ''}
                                        onChange={(event) =>
                                            handleItemChange(index, 'itemId', event.target.value)
                                        }
                                        placeholder='Cari nama barang atau ID item'
                                        displayKey='label'
                                        valueKey='id'
                                        loading={loading}
                                        showId
                                        className='mt-1'
                                        inputClassName='rounded-lg border-gray-300 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500'
                                    />
                                    <p
                                        id={`item-helper-${index}`}
                                        className='mt-1 text-xs text-gray-500'
                                    >
                                        Ketik untuk mencari item, lalu pilih dari daftar yang muncul.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor={`item-quantity-${index}`}
                                        className='block text-sm font-medium text-gray-700'
                                    >
                                        Quantity
                                    </label>
                                    <div className='mt-1 flex rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500'>
                                        <input
                                            id={`item-quantity-${index}`}
                                            name={`quantity-${index}`}
                                            type='number'
                                            min='1'
                                            value={item.quantity}
                                            onChange={(event) =>
                                                handleItemChange(index, 'quantity', event.target.value)
                                            }
                                            placeholder='cth. 100'
                                            className='w-full rounded-lg px-3 py-2 text-sm focus:outline-none'
                                            aria-describedby={`quantity-helper-${index}`}
                                        />
                                        <span className='inline-flex items-center px-3 text-xs font-medium text-gray-500'>
                                            pcs
                                        </span>
                                    </div>
                                    <p
                                        id={`quantity-helper-${index}`}
                                        className='mt-1 text-xs text-gray-500'
                                    >
                                        Masukkan jumlah unit yang diretur.
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default StokGantungItemsInput;
