import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { 
  createItem, 
  updateItem, 
  deleteItem, 
  getItemById 
} from '../services/itemService';

const useItemOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const createItemData = useCallback(async (itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await createItem(itemData);
      
      if (response.success) {
        toastService.success('Item created successfully');
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to create item');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to create item');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const updateItemData = useCallback(async (id, itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateItem(id, itemData);
      
      if (response.success) {
        toastService.success('Item updated successfully');
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update item');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to update item');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const deleteItemData = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteItem(id);
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
      setLoading(false);
    }
  }, [handleAuthError]);

  const getItemData = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getItemById(id);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get item');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to get item');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const validateItemData = useCallback((data) => {
    const errors = {};

    if (!data.plu || !data.plu.trim()) {
      errors.plu = 'PLU is required';
    }

    if (!data.nama_barang || !data.nama_barang.trim()) {
      errors.nama_barang = 'Nama barang is required';
    }

    if (typeof data.allow_mixed_carton !== 'boolean') {
      errors.allow_mixed_carton = 'Allow mixed carton must be true or false';
    }

    const dimensi = data.dimensi || data.dimensiBarang;
    const dimensionFields = ['berat', 'panjang', 'lebar', 'tinggi'];
    if (!dimensi || typeof dimensi !== 'object') {
      errors.dimensi = 'Dimensi payload is required';
    } else {
      dimensionFields.forEach((field) => {
        const value = dimensi[field];
        if (value === undefined || value === null || value === '') {
          return;
        }

        if (Number.isNaN(Number(value)) || Number(value) < 0) {
          const capitalized = field.charAt(0).toUpperCase() + field.slice(1);
          errors[`dimensi.${field}`] = `${capitalized} must be zero or greater`;
        }
      });
    }

    const itemStock = data.itemStock || data.itemStocks || {};
    const stockFields = ['stok_quantity', 'min_stok', 'qty_per_carton'];
    stockFields.forEach((field) => {
      if (itemStock[field] === undefined || itemStock[field] === null || itemStock[field] === '') {
        return;
      }
      if (Number.isNaN(Number(itemStock[field])) || Number(itemStock[field]) < 0) {
        const label = field.replace('_', ' ');
        errors[`itemStock.${field}`] = `${label} must be zero or greater`;
      }
    });

    const dimensiKarton = data.dimensiKarton;
    if (dimensiKarton && typeof dimensiKarton === 'object') {
      dimensionFields.forEach((field) => {
        const value = dimensiKarton[field];
        if (value === undefined || value === null || value === '') {
          return;
        }
        if (Number.isNaN(Number(value)) || Number(value) < 0) {
          const capitalized = field.charAt(0).toUpperCase() + field.slice(1);
          errors[`dimensiKarton.${field}`] = `${capitalized} must be zero or greater`;
        }
      });
    }

    const itemPrice = data.itemPrice || (Array.isArray(data.itemPrices) ? data.itemPrices[0] : null) || {};
    const priceFields = ['harga', 'pot1', 'harga1', 'pot2', 'harga2', 'ppn'];
    priceFields.forEach((field) => {
      if (itemPrice[field] === undefined || itemPrice[field] === null || itemPrice[field] === '') {
        return;
      }
      if (Number.isNaN(Number(itemPrice[field])) || Number(itemPrice[field]) < 0) {
        const label = field.replace(/_/g, ' ');
        errors[`itemPrice.${field}`] = `${label} must be zero or greater`;
      }
    });

    return errors;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    setError,
    clearError,
    createItemData,
    updateItemData,
    deleteItemData,
    getItemData,
    validateItemData
  };
};

export default useItemOperations;
