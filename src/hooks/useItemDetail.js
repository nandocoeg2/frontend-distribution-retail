import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { getItemById, deleteItem } from '../services/itemService';

const useItemDetail = (itemId) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const normalizeItem = (detail = {}) => {
    const dimensiValue = (() => {
      if (
        detail.dimensiBarang &&
        typeof detail.dimensiBarang === 'object' &&
        !Array.isArray(detail.dimensiBarang)
      ) {
        return detail.dimensiBarang;
      }
      if (Array.isArray(detail.dimensiBarang) && detail.dimensiBarang.length > 0) {
        return detail.dimensiBarang[0];
      }
      if (detail.dimensi && typeof detail.dimensi === 'object') {
        return detail.dimensi;
      }
      return {};
    })();

    const dimensiKarton = (() => {
      if (
        detail.dimensiKarton &&
        typeof detail.dimensiKarton === 'object' &&
        !Array.isArray(detail.dimensiKarton)
      ) {
        return detail.dimensiKarton;
      }
      if (Array.isArray(detail.dimensiKarton) && detail.dimensiKarton.length > 0) {
        return detail.dimensiKarton[0];
      }
      if (detail.cartonDimension && typeof detail.cartonDimension === 'object') {
        return detail.cartonDimension;
      }
      return null;
    })();

    const itemStock = detail.itemStock || detail.itemStocks || detail.item_stock || {};
    const itemPrice = (() => {
      if (detail.itemPrice && typeof detail.itemPrice === 'object') {
        return detail.itemPrice;
      }
      if (Array.isArray(detail.itemPrices) && detail.itemPrices.length > 0) {
        return detail.itemPrices[0];
      }
      if (detail.item_price && typeof detail.item_price === 'object') {
        return detail.item_price;
      }
      return {};
    })();

    return {
      ...detail,
      allow_mixed_carton: Boolean(detail.allow_mixed_carton ?? true),
      dimensiBarang: dimensiValue,
      dimensi: detail.dimensi || dimensiValue,
      dimensiKarton,
      itemStock,
      itemStocks: itemStock,
      itemPrice,
      stok_quantity: itemStock?.stok_quantity ?? detail.stok_quantity ?? 0,
      min_stok: itemStock?.min_stok ?? detail.min_stok ?? 0,
      berat: detail.berat ?? dimensiValue?.berat ?? 0,
      panjang: detail.panjang ?? dimensiValue?.panjang ?? 0,
      lebar: detail.lebar ?? dimensiValue?.lebar ?? 0,
      tinggi: detail.tinggi ?? dimensiValue?.tinggi ?? 0,
      qty_per_carton: itemStock?.qty_per_carton ?? detail.qty_per_carton ?? 0,
      harga: itemPrice?.harga ?? detail.harga ?? 0
    };
  };

  const loadItem = useCallback(async () => {
    if (!itemId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getItemById(itemId);
      
      if (response.success) {
        const detail = normalizeItem(response.data || {});
        setItem(detail);
      } else {
        throw new Error(response.error?.message || 'Failed to load item');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to load item');
      }
    } finally {
      setLoading(false);
    }
  }, [itemId, handleAuthError]);

  const handleDelete = async () => {
    if (!itemId) return;

    try {
      setDeleteLoading(true);
      await deleteItem(itemId);
      toastService.success('Item deleted successfully');
      return true;
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to delete item');
      }
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  const refreshItem = useCallback(() => {
    loadItem();
  }, [loadItem]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  return {
    item,
    setItem,
    loading,
    error,
    setError,
    deleteLoading,
    handleDelete,
    refreshItem,
    loadItem
  };
};

export default useItemDetail;
