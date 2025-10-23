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
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-gray-700'>
          Items
        </span>
        <button
          type='button'
          onClick={handleAddItem}
          className='inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors'
        >
          <PlusIcon className='mr-1 h-4 w-4' aria-hidden='true' />
          Tambah Item
        </button>
      </div>

      {loading && (
        <p className='text-xs text-gray-500'>
          Memuat data inventory...
        </p>
      )}

      <datalist id={datalistId}>
        {inventoryOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </datalist>

      <div className='space-y-4'>
        {items.map((item, index) => (
          <div
            key={`movement-item-${index}`}
            className='rounded-lg border border-gray-200 p-4'
          >
            <div className='grid gap-4 md:grid-cols-12'>
              <div className='md:col-span-7'>
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
                  placeholder='inventory-uuid'
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
                />
                <p className='mt-1 text-xs text-gray-500'>
                  Pilih ID inventory atau ketik manual.
                </p>
              </div>

              <div className='md:col-span-4'>
                <label
                  htmlFor={`inventory-quantity-${index}`}
                  className='block text-sm font-medium text-gray-700'
                >
                  Quantity
                </label>
                <input
                  id={`inventory-quantity-${index}`}
                  name={`quantity-${index}`}
                  type='number'
                  min='1'
                  value={item.quantity}
                  onChange={(event) =>
                    handleItemChange(index, 'quantity', event.target.value)
                  }
                  placeholder='Contoh: 100'
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
                />
              </div>

              <div className='md:col-span-1 flex items-end justify-end'>
                {items.length > 1 && (
                  <button
                    type='button'
                    onClick={() => handleRemoveItem(index)}
                    className='inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors'
                  >
                    <TrashIcon className='h-4 w-4' aria-hidden='true' />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockMovementItemsInput;

