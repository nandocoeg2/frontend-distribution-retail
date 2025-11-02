import React, { useCallback, useEffect, useState } from 'react';
import InventoryForm from './InventoryForm';
import { useInventoryOperations } from '../../hooks/useInventory';
import { getInventoryById } from '../../services/inventoryService';

const EditInventoryModal = ({ inventory, onClose }) => {
  const {
    updateInventoryItem,
    loading,
    error,
    setError,
    clearError,
    validateInventoryData
  } = useInventoryOperations();
  const normalizeInventoryPayload = useCallback((payload = {}) => {
    const dimensiValue = (() => {
      if (
        payload.dimensiBarang &&
        typeof payload.dimensiBarang === 'object' &&
        !Array.isArray(payload.dimensiBarang)
      ) {
        return payload.dimensiBarang;
      }
      if (Array.isArray(payload.dimensiBarang) && payload.dimensiBarang.length > 0) {
        return payload.dimensiBarang[0];
      }
      if (payload.dimensi && typeof payload.dimensi === 'object') {
        return payload.dimensi;
      }
      return {};
    })();

    const dimensiKarton = (() => {
      if (
        payload.dimensiKarton &&
        typeof payload.dimensiKarton === 'object' &&
        !Array.isArray(payload.dimensiKarton)
      ) {
        return payload.dimensiKarton;
      }
      if (Array.isArray(payload.dimensiKarton) && payload.dimensiKarton.length > 0) {
        return payload.dimensiKarton[0];
      }
      if (payload.cartonDimension && typeof payload.cartonDimension === 'object') {
        return payload.cartonDimension;
      }
      return null;
    })();

    const itemStock = payload.itemStock || payload.itemStocks || payload.item_stock || {};
    const itemPrice = (() => {
      if (payload.itemPrice && typeof payload.itemPrice === 'object') {
        return payload.itemPrice;
      }
      if (Array.isArray(payload.itemPrices) && payload.itemPrices.length > 0) {
        return payload.itemPrices[0];
      }
      if (payload.item_price && typeof payload.item_price === 'object') {
        return payload.item_price;
      }
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
  const [initialData, setInitialData] = useState(() => normalizeInventoryPayload(inventory));
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    setInitialData(normalizeInventoryPayload(inventory));

    if (!inventory?.id) {
      return;
    }

    const hasDimensiObject =
      inventory.dimensiBarang &&
      typeof inventory.dimensiBarang === 'object' &&
      !Array.isArray(inventory.dimensiBarang);
    const hasItemStock = Boolean(inventory.itemStock || inventory.itemStocks);

    const shouldFetchDetail = !hasDimensiObject || !hasItemStock;
    if (!shouldFetchDetail) {
      return;
    }

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        const response = await getInventoryById(inventory.id);
        if (response.success) {
          const detail = normalizeInventoryPayload(response.data || {});
          setInitialData(detail);
        }
      } catch (err) {
        console.error('Failed to fetch inventory detail:', err);
      } finally {
        setDetailLoading(false);
      }
    };

    loadDetail();
  }, [inventory, normalizeInventoryPayload]);

  const handleSubmit = async (formData) => {
    const validationErrors = validateInventoryData(formData);
    if (Object.keys(validationErrors).length > 0) {
      const [firstErrorMessage] = Object.values(validationErrors);
      setError(firstErrorMessage);
      return;
    }

    try {
      await updateInventoryItem(inventory.id, formData);
      onClose();
    } catch (error) {
      console.error('Update inventory error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ubah Inventory</h2>
            <p className="text-sm text-gray-600">Perbarui data barang dan pastikan konsisten dengan API.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-white hover:text-gray-700"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          <InventoryForm
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

export default EditInventoryModal;
