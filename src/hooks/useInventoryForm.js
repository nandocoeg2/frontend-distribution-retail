import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { createInventory, updateInventory, getInventoryById } from '../services/inventoryService';

const DEFAULT_FORM_STATE = {
  plu: '',
  nama_barang: '',
  eanBarcode: '',
  uom: 'KARTON',
  allow_mixed_carton: true,
  berat: '0',
  panjang: '0',
  lebar: '0',
  tinggi: '0',
  stok_quantity: '0',
  min_stok: '0',
  qty_per_carton: '0',
  harga: '0',
  pot1: '0',
  harga1: '0',
  pot2: '0',
  harga2: '0',
  ppn: '0'
};

const toStringValue = (value, fallback = '0') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const resolveDimensiBarang = (source = {}) => {
  if (
    source.dimensiBarang &&
    typeof source.dimensiBarang === 'object' &&
    !Array.isArray(source.dimensiBarang)
  ) {
    return source.dimensiBarang;
  }
  if (Array.isArray(source.dimensiBarang) && source.dimensiBarang.length > 0) {
    return source.dimensiBarang[0];
  }
  if (source.dimensi && typeof source.dimensi === 'object') {
    return source.dimensi;
  }
  return {};
};

const resolveDimensiKarton = (source = {}) => {
  if (
    source.dimensiKarton &&
    typeof source.dimensiKarton === 'object' &&
    !Array.isArray(source.dimensiKarton)
  ) {
    return source.dimensiKarton;
  }
  if (Array.isArray(source.dimensiKarton) && source.dimensiKarton.length > 0) {
    return source.dimensiKarton[0];
  }
  if (source.cartonDimension && typeof source.cartonDimension === 'object') {
    return source.cartonDimension;
  }
  return {};
};

const resolveItemStock = (source = {}) => {
  return source.itemStock || source.itemStocks || source.item_stock || {};
};

const resolveItemPrice = (source = {}) => {
  if (source.itemPrice && typeof source.itemPrice === 'object') {
    return source.itemPrice;
  }
  if (Array.isArray(source.itemPrices) && source.itemPrices.length > 0) {
    return source.itemPrices[0] || {};
  }
  if (source.item_price && typeof source.item_price === 'object') {
    return source.item_price;
  }
  return {};
};

const parseDecimal = (value) => {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseInteger = (value) => {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const useInventoryForm = (inventoryId = null) => {
  const [formData, setFormData] = useState(() => ({ ...DEFAULT_FORM_STATE }));
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
        const inventory = response.data || {};
        const dimensiBarang = resolveDimensiBarang(inventory);
        const dimensiKarton = resolveDimensiKarton(inventory);
        const itemStock = resolveItemStock(inventory);
        const itemPrice = resolveItemPrice(inventory);

        setFormData({
          plu: inventory.plu || '',
          nama_barang: inventory.nama_barang || '',
          eanBarcode: inventory.eanBarcode || '',
          uom: inventory.uom || DEFAULT_FORM_STATE.uom,
          allow_mixed_carton: Boolean(inventory.allow_mixed_carton ?? true),
          berat: toStringValue(inventory.berat ?? dimensiBarang?.berat),
          panjang: toStringValue(inventory.panjang ?? dimensiBarang?.panjang),
          lebar: toStringValue(inventory.lebar ?? dimensiBarang?.lebar),
          tinggi: toStringValue(inventory.tinggi ?? dimensiBarang?.tinggi),
          karton_berat: toStringValue(dimensiKarton?.berat, ''),
          karton_panjang: toStringValue(dimensiKarton?.panjang, ''),
          karton_lebar: toStringValue(dimensiKarton?.lebar, ''),
          karton_tinggi: toStringValue(dimensiKarton?.tinggi, ''),
          stok_quantity: toStringValue(itemStock?.stok_quantity ?? inventory.stok_quantity),
          min_stok: toStringValue(itemStock?.min_stok ?? inventory.min_stok),
          qty_per_carton: toStringValue(itemStock?.qty_per_carton ?? inventory.qty_per_carton),
          harga: toStringValue(itemPrice?.harga, '0'),
          pot1: toStringValue(itemPrice?.pot1, '0'),
          harga1: toStringValue(itemPrice?.harga1, '0'),
          pot2: toStringValue(itemPrice?.pot2, '0'),
          harga2: toStringValue(itemPrice?.harga2, '0'),
          ppn: toStringValue(itemPrice?.ppn, '0')
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

    const numericFields = [
      'berat',
      'panjang',
      'lebar',
      'tinggi',
      'karton_berat',
      'karton_panjang',
      'karton_lebar',
      'karton_tinggi',
      'stok_quantity',
      'min_stok',
      'qty_per_carton',
      'harga',
      'pot1',
      'harga1',
      'pot2',
      'harga2',
      'ppn'
    ];
    numericFields.forEach((field) => {
      const value = formData[field];
      if (value === '' || value === null || value === undefined) {
        return;
      }
      if (Number.isNaN(Number(value)) || Number(value) < 0) {
        errors[field] = `${field} must be zero or greater`;
      }
    });

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
        allow_mixed_carton: Boolean(formData.allow_mixed_carton),
        dimensi: {
          berat: parseDecimal(formData.berat),
          panjang: parseDecimal(formData.panjang),
          lebar: parseDecimal(formData.lebar),
          tinggi: parseDecimal(formData.tinggi)
        },
        dimensiKarton: undefined,
        itemStock: {
          stok_quantity: parseInteger(formData.stok_quantity),
          min_stok: parseInteger(formData.min_stok),
          qty_per_carton: parseInteger(formData.qty_per_carton)
        },
        itemPrice: {
          harga: parseDecimal(formData.harga),
          pot1: parseDecimal(formData.pot1),
          harga1: parseDecimal(formData.harga1),
          pot2: parseDecimal(formData.pot2),
          harga2: parseDecimal(formData.harga2),
          ppn: parseDecimal(formData.ppn)
        }
      };

      const eanBarcode = formData.eanBarcode.trim();
      if (eanBarcode) {
        inventoryData.eanBarcode = eanBarcode;
      }

      const uom = formData.uom.trim();
      if (uom) {
        inventoryData.uom = uom.toUpperCase();
      }

      const hasDimensiKarton = ['karton_berat', 'karton_panjang', 'karton_lebar', 'karton_tinggi'].some(
        key => formData[key] !== '' && formData[key] !== null && formData[key] !== undefined
      );
      if (hasDimensiKarton) {
        inventoryData.dimensiKarton = {
          berat: parseDecimal(formData.karton_berat),
          panjang: parseDecimal(formData.karton_panjang),
          lebar: parseDecimal(formData.karton_lebar),
          tinggi: parseDecimal(formData.karton_tinggi)
        };
      } else {
        delete inventoryData.dimensiKarton;
      }

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
    setFormData({ ...DEFAULT_FORM_STATE });
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
    validateForm,
    setIsEditMode
  };
};

export default useInventoryForm;
