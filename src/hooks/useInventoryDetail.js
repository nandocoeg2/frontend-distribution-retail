import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { getInventoryById, deleteInventory } from '../services/inventoryService';

const useInventoryDetail = (inventoryId) => {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const loadInventory = useCallback(async () => {
    if (!inventoryId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getInventoryById(inventoryId);
      
      if (response.success) {
        const detail = response.data || {};
        const dimensionList = Array.isArray(detail.dimensiBarang) ? detail.dimensiBarang : [];
        const dimensiKartonEntry = detail.dimensiKarton || dimensionList.find((dimension) => dimension?.type === 'KARTON');
        const dimensiPcsEntry = detail.dimensiPcs || dimensionList.find((dimension) => dimension?.type === 'PCS');
        const legacyDimension = detail.dimensiKardus || {};
        const dimensionSource = dimensiKartonEntry || legacyDimension;

        setInventory({
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
      } else {
        throw new Error(response.error?.message || 'Failed to load inventory');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to load inventory');
      }
    } finally {
      setLoading(false);
    }
  }, [inventoryId, handleAuthError]);

  const handleDelete = async () => {
    if (!inventoryId) return;

    try {
      setDeleteLoading(true);
      await deleteInventory(inventoryId);
      toastService.success('Inventory item deleted successfully');
      return true;
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to delete inventory');
      }
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  const refreshInventory = useCallback(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return {
    inventory,
    setInventory,
    loading,
    error,
    setError,
    deleteLoading,
    handleDelete,
    refreshInventory,
    loadInventory
  };
};

export default useInventoryDetail;
