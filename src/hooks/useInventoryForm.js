import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { createInventory, updateInventory, getInventoryById } from '../services/inventoryService';

const useInventoryForm = (inventoryId = null) => {
  const [formData, setFormData] = useState({
    plu: '',
    nama_barang: '',
    stok_c: '',
    stok_q: '',
    harga_barang: '',
    min_stok: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(!!inventoryId);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const loadInventoryData = useCallback(async () => {
    if (!inventoryId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getInventoryById(inventoryId);
      
      if (response.success) {
        const inventory = response.data;
        setFormData({
          plu: inventory.plu || '',
          nama_barang: inventory.nama_barang || '',
          stok_c: inventory.stok_c || '',
          stok_q: inventory.stok_q || '',
          harga_barang: inventory.harga_barang || '',
          min_stok: inventory.min_stok || 10
        });
      } else {
        throw new Error(response.error?.message || 'Failed to load inventory data');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to load inventory data');
      }
    } finally {
      setLoading(false);
    }
  }, [inventoryId, handleAuthError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.plu.trim()) {
      errors.plu = 'PLU is required';
    }

    if (!formData.nama_barang.trim()) {
      errors.nama_barang = 'Nama barang is required';
    }

    if (!formData.stok_c || formData.stok_c < 0) {
      errors.stok_c = 'Stok karton must be a valid number';
    }

    if (!formData.stok_q || formData.stok_q < 0) {
      errors.stok_q = 'Stok pcs must be a valid number';
    }

    if (!formData.harga_barang || formData.harga_barang < 0) {
      errors.harga_barang = 'Harga barang must be a valid number';
    }

    if (formData.min_stok < 0) {
      errors.min_stok = 'Minimum stok must be a valid number';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix the validation errors');
      Object.values(validationErrors).forEach(errorMsg => {
        toastService.error(errorMsg);
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const inventoryData = {
        plu: formData.plu.trim(),
        nama_barang: formData.nama_barang.trim(),
        stok_c: parseInt(formData.stok_c),
        stok_q: parseInt(formData.stok_q),
        harga_barang: parseInt(formData.harga_barang),
        min_stok: parseInt(formData.min_stok)
      };

      let response;
      if (isEditMode) {
        response = await updateInventory(inventoryId, inventoryData);
      } else {
        response = await createInventory(inventoryData);
      }

      if (response.success) {
        const action = isEditMode ? 'updated' : 'created';
        toastService.success(`Inventory item ${action} successfully`);
        return response.data;
      } else {
        throw new Error(response.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} inventory`);
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} inventory`);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      plu: '',
      nama_barang: '',
      stok_c: '',
      stok_q: '',
      harga_barang: '',
      min_stok: 10
    });
    setError(null);
  };

  return {
    formData,
    setFormData,
    loading,
    error,
    setError,
    isEditMode,
    handleInputChange,
    handleSubmit,
    resetForm,
    loadInventoryData,
    validateForm
  };
};

export default useInventoryForm;
