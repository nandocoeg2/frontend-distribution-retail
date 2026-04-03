import { useMemo } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';

const defaultItem = { itemId: '', quantity: '' };

const StockMovementItemsInput = ({
  items,
  onChange,
  itemCatalog = [],
  loading = false,
}) => {
  const itemOptions = useMemo(() => {
    if (!Array.isArray(itemCatalog)) return [];
    return itemCatalog
      .map((item) => ({
        id: item?.id || '',
        label:
          item?.nama_barang || item?.name || item?.inventoryName ||
          item?.inventory_name || item?.sku || item?.plu || item?.id || '',
      }))
      .filter((o) => o.id && o.label);
  }, [itemCatalog]);

  // Block non-numeric keys on quantity fields
  const handleQuantityKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    // Block anything that's not a digit
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleItemChange = (index, field, value) => {
    let sanitized = value;
    if (field === 'quantity') {
      // Strip anything non-digit, cap at max int (2147483647)
      sanitized = value.replace(/\D/g, '');
      if (sanitized && Number(sanitized) > 2147483647) {
        sanitized = '2147483647';
      }
    }
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: sanitized } : item
    );
    onChange(next);
  };

  const handleAddItem = () => onChange([...items, { ...defaultItem }]);

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
            Detail Item
          </h3>
          <span className='rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'>
            {items.length} item · {items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)} pcs
          </span>
        </div>
        <button
          type='button'
          onClick={handleAddItem}
          className='inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500'
        >
          <PlusIcon className='h-3.5 w-3.5' aria-hidden='true' />
          Tambah
        </button>
      </div>

      {loading && (
        <div className='flex items-center gap-2 rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500'>
          <span className='inline-flex h-2 w-2 animate-pulse rounded-full bg-indigo-500' />
          Memuat data item...
        </div>
      )}

      {/* Table-like header */}
      <div className='hidden sm:grid sm:grid-cols-[1fr_120px_40px] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-400'>
        <span>Item</span>
        <span>Qty</span>
        <span />
      </div>

      <div className='space-y-2'>
        {items.map((item, index) => (
          <div
            key={`movement-item-${index}`}
            className='grid grid-cols-1 gap-2 rounded-md border border-gray-200 bg-white p-2.5 sm:grid-cols-[1fr_120px_40px] sm:items-center'
          >
            <Autocomplete
              label='' name={`itemId-${index}`} options={itemOptions}
              value={item.itemId ? String(item.itemId) : ''}
              onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
              placeholder='Cari item...'
              displayKey='label' valueKey='id' loading={loading} showId
            />
            <input
              id={`item-quantity-${index}`}
              type='text' inputMode='numeric' pattern='[0-9]*'
              value={item.quantity}
              onKeyDown={handleQuantityKeyDown}
              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text');
                if (!/^\d+$/.test(pasted)) e.preventDefault();
              }}
              placeholder='Qty'
              className='w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            />
            <button
              type='button'
              onClick={() => handleRemoveItem(index)}
              disabled={items.length === 1}
              className='flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:invisible'
              aria-label={`Hapus item ${index + 1}`}
            >
              <TrashIcon className='h-4 w-4' aria-hidden='true' />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockMovementItemsInput;
