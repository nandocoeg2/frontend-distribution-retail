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

    if (data.stok_c === undefined || data.stok_c === null || Number.isNaN(data.stok_c) || data.stok_c < 0) {
      errors.stok_c = 'Stok karton must be a valid number';
    }

    if (data.stok_q === undefined || data.stok_q === null || Number.isNaN(data.stok_q) || data.stok_q < 0) {
      errors.stok_q = 'Stok pcs must be a valid number';
    }

    if (data.harga_barang === undefined || data.harga_barang === null || Number.isNaN(data.harga_barang) || data.harga_barang < 0) {
      errors.harga_barang = 'Harga barang must be a valid number';
    }

    if (data.min_stok === undefined || data.min_stok === null || Number.isNaN(data.min_stok) || data.min_stok < 0) {
      errors.min_stok = 'Minimum stok must be a valid number';
    }

    const dimensionFields = ['berat', 'panjang', 'lebar', 'tinggi'];
    dimensionFields.forEach((field) => {
      const value = data[field];
      if (value === undefined || value === null || value === '') {
        return;
      }

      if (Number.isNaN(value) || value < 0) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be zero or greater`;
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
