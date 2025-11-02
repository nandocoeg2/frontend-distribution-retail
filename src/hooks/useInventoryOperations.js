import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { 
  createInventory, 
  updateInventory, 
  deleteInventory, 
  getInventoryById 
} from '../services/inventoryService';

const useInventoryOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const createInventoryItem = useCallback(async (inventoryData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await createInventory(inventoryData);
      
      if (response.success) {
        toastService.success('Inventory item created successfully');
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to create inventory');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to create inventory');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const updateInventoryItem = useCallback(async (id, inventoryData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateInventory(id, inventoryData);
      
      if (response.success) {
        toastService.success('Inventory item updated successfully');
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update inventory');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to update inventory');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const deleteInventoryItem = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteInventory(id);
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
      setLoading(false);
    }
  }, [handleAuthError]);

  const getInventoryItem = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getInventoryById(id);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get inventory');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to get inventory');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const validateInventoryData = useCallback((data) => {
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
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryItem,
    validateInventoryData
  };
};

export default useInventoryOperations;
