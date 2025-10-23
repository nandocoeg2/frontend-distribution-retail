import React, { useMemo, useId } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const defaultItem = { inventoryId: '', quantity: '' };

const StockMovementItemsInput = ({
  items,
  onChange,
  inventories = [],
  loading = false,
}) => {
  const datalistId = useId();

  const inventoryOptions = useMemo(() => {
    if (!Array.isArray(inventories)) {
      return [];
    }

    return inventories
      .map((inventory) => ({
        id: inventory?.id || '',
        label:
          inventory?.nama_barang ||
          inventory?.name ||
          inventory?.inventoryName ||
          inventory?.inventory_name ||
          inventory?.sku ||
          inventory?.plu ||
          inventory?.id ||
          '',
      }))
      .filter((option) => option.id);
  }, [inventories]);

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
            Pilih inventory dan isi quantity sesuai barang yang bergerak. Kamu bisa menambahkan lebih
            dari satu item sekaligus.
          </p>
        </div>
        <button
          type='button'
          onClick={handleAddItem}
          className='inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        >
          <PlusIcon className='mr-1 h-4 w-4' aria-hidden='true' />
          Tambah Item
        </button>
      </div>

      {loading && (
        <div className='flex items-center gap-2 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-700'>
          <span className='inline-flex h-2 w-2 animate-pulse rounded-full bg-indigo-500' />
          Memuat data inventory terbaru...
        </div>
      )}

      <datalist id={datalistId}>
        {inventoryOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </datalist>

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
                    Masukkan ID inventory dan quantity sesuai dokumen sumber.
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
                    htmlFor={`inventory-id-${index}`}
                    className='block text-sm font-medium text-gray-700'
                  >
                    Inventory ID
                  </label>
                  <input
                    id={`inventory-id-${index}`}
                    name={`inventoryId-${index}`}
                    list={datalistId}
                    value={item.inventoryId}
                    onChange={(event) =>
                      handleItemChange(index, 'inventoryId', event.target.value)
                    }
                    placeholder='Contoh: inventory-uuid'
                    autoComplete='off'
                    className='mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    aria-describedby={`inventory-helper-${index}`}
                  />
                  <p
                    id={`inventory-helper-${index}`}
                    className='mt-1 text-xs text-gray-500'
                  >
                    Pilih dari daftar atau ketik manual sesuai master data inventory.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor={`inventory-quantity-${index}`}
                    className='block text-sm font-medium text-gray-700'
                  >
                    Quantity
                  </label>
                  <div className='mt-1 flex rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500'>
                    <input
                      id={`inventory-quantity-${index}`}
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
                    Masukkan jumlah unit yang bergerak. Gunakan angka positif.
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

export default StockMovementItemsInput;
