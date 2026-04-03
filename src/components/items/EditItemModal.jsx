import { useCallback, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ItemForm from './ItemForm';
import { useItemOperations } from '../../hooks/useItem';
import { getItemById } from '../../services/itemService';

const EditItemModal = ({ item, onClose }) => {
  const {
    updateItemData,
    loading,
    error,
    setError,
    clearError,
    validateItemData
  } = useItemOperations();

  const normalizeItemPayload = useCallback((payload = {}) => {
    const dimensiValue = (() => {
      if (payload.dimensiBarang && typeof payload.dimensiBarang === 'object' && !Array.isArray(payload.dimensiBarang)) return payload.dimensiBarang;
      if (Array.isArray(payload.dimensiBarang) && payload.dimensiBarang.length > 0) return payload.dimensiBarang[0];
      if (payload.dimensi && typeof payload.dimensi === 'object') return payload.dimensi;
      return {};
    })();

    const dimensiKarton = (() => {
      if (payload.dimensiKarton && typeof payload.dimensiKarton === 'object' && !Array.isArray(payload.dimensiKarton)) return payload.dimensiKarton;
      if (Array.isArray(payload.dimensiKarton) && payload.dimensiKarton.length > 0) return payload.dimensiKarton[0];
      if (payload.cartonDimension && typeof payload.cartonDimension === 'object') return payload.cartonDimension;
      return null;
    })();

    const itemStock = payload.itemStock || payload.itemStocks || payload.item_stock || {};
    const itemPrice = (() => {
      if (payload.itemPrice && typeof payload.itemPrice === 'object') return payload.itemPrice;
      if (Array.isArray(payload.itemPrices) && payload.itemPrices.length > 0) return payload.itemPrices[0];
      if (payload.item_price && typeof payload.item_price === 'object') return payload.item_price;
      return {};
    })();

    return {
      ...payload,
      allow_mixed_carton: Boolean(payload.allow_mixed_carton ?? true),
      dimensiBarang: dimensiValue,
      dimensi: payload.dimensi || dimensiValue,
      dimensiKarton,
      itemStock,
      itemStocks: itemStock,
      itemPrice,
      berat: payload.berat ?? dimensiValue?.berat ?? 0,
      panjang: payload.panjang ?? dimensiValue?.panjang ?? 0,
      lebar: payload.lebar ?? dimensiValue?.lebar ?? 0,
      tinggi: payload.tinggi ?? dimensiValue?.tinggi ?? 0
    };
  }, []);

  const [initialData, setInitialData] = useState(() => normalizeItemPayload(item));
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { clearError(); }, [clearError]);

  useEffect(() => {
    setInitialData(normalizeItemPayload(item));
    if (!item?.id) return;

    const hasDimensiObject = item.dimensiBarang && typeof item.dimensiBarang === 'object' && !Array.isArray(item.dimensiBarang);
    const hasItemStock = Boolean(item.itemStock || item.itemStocks);
    if (hasDimensiObject && hasItemStock) return;

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        const response = await getItemById(item.id);
        if (response.success) setInitialData(normalizeItemPayload(response.data || {}));
      } catch (err) {
        console.error('Failed to fetch item detail:', err);
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [item, normalizeItemPayload]);

  const handleSubmit = async (formData) => {
    const validationErrors = validateItemData(formData);
    if (Object.keys(validationErrors).length > 0) {
      const [firstErrorMessage] = Object.values(validationErrors);
      setError(firstErrorMessage);
      return;
    }
    try {
      await updateItemData(item.id, formData);
      onClose();
    } catch (error) {
      console.error('Update item error:', error);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-gray-200 bg-amber-600 px-5 py-3 text-white'>
          <h2 className='text-base font-semibold'>Edit Item</h2>
          <button onClick={onClose} className='rounded p-1 hover:bg-white/20 focus:outline-none' aria-label='Tutup'>
            <XMarkIcon className='h-5 w-5' aria-hidden='true' />
          </button>
        </div>

        <div className='max-h-[80vh] overflow-y-auto px-5 py-4'>
          <ItemForm
            onSubmit={handleSubmit}
            onClose={onClose}
            initialData={initialData}
            loading={loading || detailLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;
