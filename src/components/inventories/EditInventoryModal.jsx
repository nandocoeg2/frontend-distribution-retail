import React, { useEffect, useState } from 'react';
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
  const [initialData, setInitialData] = useState(inventory);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    const shouldFetchDetail = inventory && (!inventory.dimensiKarton || inventory.berat === undefined);
    if (!inventory?.id || !shouldFetchDetail) {
      setInitialData(inventory);
      return;
    }

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        const response = await getInventoryById(inventory.id);
        if (response.success) {
          const detail = response.data || {};
          const dimensionList = Array.isArray(detail.dimensiBarang) ? detail.dimensiBarang : [];
          const dimensiKartonEntry = detail.dimensiKarton || dimensionList.find((dimension) => dimension?.type === 'KARTON');
          const dimensiPcsEntry = detail.dimensiPcs || dimensionList.find((dimension) => dimension?.type === 'PCS');
          const legacyDimension = detail.dimensiKardus || {};
          const dimensionSource = dimensiKartonEntry || legacyDimension;

          setInitialData({
            ...detail,
            allow_mixed_carton: Boolean(detail.allow_mixed_carton ?? true),
            dimensiKarton: dimensiKartonEntry || null,
            dimensiPcs: dimensiPcsEntry || null,
            berat: detail.berat ?? dimensionSource?.berat ?? 0,
            panjang: detail.panjang ?? dimensionSource?.panjang ?? 0,
            lebar: detail.lebar ?? dimensionSource?.lebar ?? 0,
            tinggi: detail.tinggi ?? dimensionSource?.tinggi ?? 0,
            qty_per_carton: detail.qty_per_carton ?? dimensionSource?.qty_per_carton ?? 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch inventory detail:', err);
      } finally {
        setDetailLoading(false);
      }
    };

    loadDetail();
  }, [inventory]);

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
