import React, { useState, useEffect, useMemo } from 'react';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';
import { MultiSelect } from '../ui';
import { getMixableItems } from '../../services/itemService';
import { getCompanies } from '../../services/companyService';
import authService from '../../services/authService';

const DEFAULT_FORM_STATE = {
  companyId: '',
  plu: '',
  nama_barang: '',
  eanBarcode: '',
  uom: 'KARTON',
  allow_mixed_carton: true,
  mixedWithItemIds: [],
  berat: '0',
  panjang: '0',
  lebar: '0',
  tinggi: '0',
  karton_berat: '',
  karton_panjang: '',
  karton_lebar: '',
  karton_tinggi: '',
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

const legacyDimensionMatchers = ['dimensiBarang', 'dimensi'];
const itemStockSources = ['itemStock', 'itemStocks', 'item_stock'];
const itemPriceSources = ['itemPrice', 'itemPrices', 'item_price'];

const getDimensionValue = (source, field) => {
  if (source == null) {
    return '0';
  }

  const directValue = source[field];
  if (directValue !== undefined && directValue !== null) {
    return String(directValue);
  }

  for (const key of legacyDimensionMatchers) {
    const candidate = source[key];
    if (candidate && typeof candidate === 'object' && candidate[field] !== undefined && candidate[field] !== null) {
      return String(candidate[field]);
    }
  }

  if (Array.isArray(source.dimensiBarang)) {
    const [firstEntry] = source.dimensiBarang;
    if (firstEntry && firstEntry[field] !== undefined && firstEntry[field] !== null) {
      return String(firstEntry[field]);
    }
  }

  return '0';
};

const getCartonDimensionValue = (source, field) => {
  if (source == null) {
    return '';
  }

  const cartonSource =
    source.dimensiKarton ||
    source.cartonDimension ||
    source.dimensionCarton ||
    source.cargoDimension;

  if (cartonSource && typeof cartonSource === 'object' && cartonSource[field] !== undefined && cartonSource[field] !== null) {
    return String(cartonSource[field]);
  }

  return '';
};

const getStockValue = (source, field) => {
  if (source == null) {
    return '0';
  }

  for (const key of itemStockSources) {
    const candidate = source?.[key];
    if (candidate && typeof candidate === 'object' && candidate[field] !== undefined && candidate[field] !== null) {
      return String(candidate[field]);
    }
  }

  return '0';
};

const getPriceValue = (source, field) => {
  if (source == null) {
    return '0';
  }

  for (const key of itemPriceSources) {
    const candidate = source?.[key];
    if (candidate && typeof candidate === 'object') {
      const value = candidate[field];
      if (value !== undefined && value !== null) {
        return String(value);
      }
    }

    if (Array.isArray(candidate) && candidate.length > 0) {
      const [firstEntry] = candidate;
      if (firstEntry && firstEntry[field] !== undefined && firstEntry[field] !== null) {
        return String(firstEntry[field]);
      }
    }
  }

  return '0';
};

const parseInteger = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseDecimal = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const ItemForm = ({ onSubmit, onClose, initialData = {}, loading = false, error = null }) => {
  const [formData, setFormData] = useState(() => ({ ...DEFAULT_FORM_STATE }));
  const [mixableItems, setMixableItems] = useState([]);
  const [loadingMixableItems, setLoadingMixableItems] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const memoizedInitialData = useMemo(() => initialData, [initialData]);

  // Get default company from logged-in user
  const defaultCompanyId = useMemo(() => {
    const company = authService.getCompanyData();
    return company?.id || '';
  }, []);

  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const response = await getCompanies(1, 100); // Get up to 100 companies
        const data = response?.data?.data || response?.data || [];
        setCompanies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Load mixable items when allow_mixed_carton is true
  useEffect(() => {
    const loadMixableItems = async () => {
      if (!formData.allow_mixed_carton) {
        setMixableItems([]);
        return;
      }

      setLoadingMixableItems(true);
      try {
        const response = await getMixableItems();
        const items = response.data || [];
        // Filter out current item if editing
        const filtered = items.filter(item => item.id !== memoizedInitialData?.id);
        setMixableItems(filtered);
      } catch (error) {
        console.error('Failed to load mixable items:', error);
      } finally {
        setLoadingMixableItems(false);
      }
    };

    loadMixableItems();
  }, [formData.allow_mixed_carton, memoizedInitialData?.id]);

  // Helper function to calculate prices after discounts
  const calculatePricesAfterDiscount = (harga, pot1, pot2) => {
    const hargaNum = parseFloat(harga) || 0;
    const pot1Num = parseFloat(pot1) || 0;
    const pot2Num = parseFloat(pot2) || 0;

    // Harga1 = Harga Dasar - (Harga Dasar * pot1/100)
    const harga1 = hargaNum - (hargaNum * pot1Num / 100);
    // Harga2 = Harga1 - (Harga1 * pot2/100)
    const harga2 = harga1 - (harga1 * pot2Num / 100);

    return {
      harga1: harga1.toFixed(2),
      harga2: harga2.toFixed(2)
    };
  };

  useEffect(() => {
    if (!memoizedInitialData || Object.keys(memoizedInitialData).length === 0) {
      // For new items, set default company
      setFormData({ ...DEFAULT_FORM_STATE, companyId: defaultCompanyId });
      return;
    }

    // Extract mixedWithItemIds from relationships
    const mixedWithItemIds = memoizedInitialData.mixedWithItems?.map(
      rel => rel.mixedWithItemId
    ) || [];

    // Get price values
    const harga = getPriceValue(memoizedInitialData, 'harga');
    const pot1 = getPriceValue(memoizedInitialData, 'pot1');
    const pot2 = getPriceValue(memoizedInitialData, 'pot2');

    // Auto-calculate harga1 and harga2 based on harga and potongan
    const calculated = calculatePricesAfterDiscount(harga, pot1, pot2);

    setFormData({
      companyId: memoizedInitialData.companyId || defaultCompanyId,
      plu: memoizedInitialData.plu || '',
      nama_barang: memoizedInitialData.nama_barang || '',
      eanBarcode: memoizedInitialData.eanBarcode || '',
      uom: memoizedInitialData.uom || DEFAULT_FORM_STATE.uom,
      allow_mixed_carton: Boolean(
        memoizedInitialData.allow_mixed_carton ?? true
      ),
      mixedWithItemIds,
      berat: getDimensionValue(memoizedInitialData, 'berat'),
      panjang: getDimensionValue(memoizedInitialData, 'panjang'),
      lebar: getDimensionValue(memoizedInitialData, 'lebar'),
      tinggi: getDimensionValue(memoizedInitialData, 'tinggi'),
      karton_berat: getCartonDimensionValue(memoizedInitialData, 'berat'),
      karton_panjang: getCartonDimensionValue(memoizedInitialData, 'panjang'),
      karton_lebar: getCartonDimensionValue(memoizedInitialData, 'lebar'),
      karton_tinggi: getCartonDimensionValue(memoizedInitialData, 'tinggi'),
      stok_quantity: getStockValue(memoizedInitialData, 'stok_quantity'),
      min_stok: getStockValue(memoizedInitialData, 'min_stok'),
      qty_per_carton: getStockValue(memoizedInitialData, 'qty_per_carton'),
      harga: harga,
      pot1: pot1,
      harga1: calculated.harga1,  // Auto-calculated
      pot2: pot2,
      harga2: calculated.harga2,  // Auto-calculated
      ppn: getPriceValue(memoizedInitialData, 'ppn')
    });
  }, [memoizedInitialData, defaultCompanyId]);

  const handleChange = ({ target }) => {
    const { name, value, type, checked } = target;

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto-calculate harga1 and harga2 when harga, pot1, or pot2 changes
      if (name === 'harga' || name === 'pot1' || name === 'pot2') {
        const harga = name === 'harga' ? value : prev.harga;
        const pot1 = name === 'pot1' ? value : prev.pot1;
        const pot2 = name === 'pot2' ? value : prev.pot2;

        const calculated = calculatePricesAfterDiscount(harga, pot1, pot2);
        newData.harga1 = calculated.harga1;
        newData.harga2 = calculated.harga2;
      }

      return newData;
    });

    // Clear mixedWithItemIds when allow_mixed_carton is disabled
    if (name === 'allow_mixed_carton' && !checked) {
      setFormData(prev => ({ ...prev, mixedWithItemIds: [] }));
    }
  };

  const handleMixedItemsChange = (selectedIds) => {
    setFormData(prev => ({
      ...prev,
      mixedWithItemIds: selectedIds
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const dataToSubmit = {
      companyId: formData.companyId,
      plu: formData.plu?.trim(),
      nama_barang: formData.nama_barang?.trim(),
      allow_mixed_carton: Boolean(formData.allow_mixed_carton)
    };

    const eanBarcode = formData.eanBarcode?.trim();
    if (eanBarcode) {
      dataToSubmit.eanBarcode = eanBarcode;
    }

    const uom = formData.uom?.trim();
    if (uom) {
      dataToSubmit.uom = uom.toUpperCase();
    }

    dataToSubmit.dimensi = {
      berat: parseDecimal(formData.berat),
      panjang: parseDecimal(formData.panjang),
      lebar: parseDecimal(formData.lebar),
      tinggi: parseDecimal(formData.tinggi)
    };

    dataToSubmit.itemStock = {
      stok_quantity: parseInteger(formData.stok_quantity),
      min_stok: parseInteger(formData.min_stok),
      qty_per_carton: parseInteger(formData.qty_per_carton)
    };

    const dimensiKartonPayload = {
      berat: parseDecimal(formData.karton_berat),
      panjang: parseDecimal(formData.karton_panjang),
      lebar: parseDecimal(formData.karton_lebar),
      tinggi: parseDecimal(formData.karton_tinggi)
    };
    const hasDimensiKarton = ['karton_berat', 'karton_panjang', 'karton_lebar', 'karton_tinggi'].some(
      key => formData[key] !== '' && formData[key] !== null && formData[key] !== undefined
    );
    if (hasDimensiKarton) {
      dataToSubmit.dimensiKarton = dimensiKartonPayload;
    }

    dataToSubmit.itemPrice = {
      harga: parseDecimal(formData.harga),
      pot1: parseDecimal(formData.pot1),
      harga1: parseDecimal(formData.harga1),
      pot2: parseDecimal(formData.pot2),
      harga2: parseDecimal(formData.harga2),
      ppn: parseDecimal(formData.ppn)
    };

    // Add mixed carton relationships if allowed
    if (formData.allow_mixed_carton && formData.mixedWithItemIds.length > 0) {
      dataToSubmit.mixedWithItemIds = formData.mixedWithItemIds;
    }

    onSubmit(dataToSubmit);
  };

  const isEditMode = Boolean(memoizedInitialData?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      ) : null}

      <FormSection
        title="Informasi Dasar"
        description="Lengkapi identitas utama item. PLU tidak dapat diubah setelah data dibuat."
      >
        <div className="mb-4">
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
            Company <span className="text-red-500">*</span>
          </label>
          <select
            id="companyId"
            name="companyId"
            value={formData.companyId}
            onChange={handleChange}
            required
            disabled={loading || loadingCompanies}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">{loadingCompanies ? 'Loading companies...' : 'Pilih Company'}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.kode_company} - {company.nama_perusahaan}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Item akan terdaftar di company yang dipilih.
          </p>
        </div>
        <FormField
          label="PLU (Price Look-Up)"
          name="plu"
          value={formData.plu}
          onChange={handleChange}
          required
          disabled={isEditMode}
          placeholder="Contoh: PLU001"
        />
        <FormField
          label="Nama Barang"
          name="nama_barang"
          value={formData.nama_barang}
          onChange={handleChange}
          required
          placeholder="Contoh: Tas Belanja Premium"
        />
        <FormField
          label="EAN Barcode"
          name="eanBarcode"
          value={formData.eanBarcode}
          onChange={handleChange}
          placeholder="Opsional, EAN-8 atau EAN-13"
        />
        <FormField
          label="Satuan (UoM)"
          name="uom"
          value={formData.uom}
          onChange={handleChange}
          placeholder="Contoh: KARTON"
          helperText="Nilai disimpan dalam huruf besar."
        />
        <div className="flex items-start gap-2 pt-2">
          <input
            id="allow_mixed_carton"
            name="allow_mixed_carton"
            type="checkbox"
            checked={Boolean(formData.allow_mixed_carton)}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <label htmlFor="allow_mixed_carton" className="text-sm font-medium text-gray-700">
              Perbolehkan Mixed Carton
            </label>
            <p className="text-xs text-gray-500">
              Centang jika barang boleh dicampur dalam mixed carton (default: aktif).
            </p>
          </div>
        </div>

        {/* Mixed Carton Relationships */}
        {formData.allow_mixed_carton && (
          <div className="mt-4">
            <MultiSelect
              label="Item yang Boleh Dicampur"
              options={mixableItems.map(item => ({
                value: item.id,
                label: `${item.plu} - ${item.nama_barang}`
              }))}
              value={formData.mixedWithItemIds}
              onChange={handleMixedItemsChange}
              placeholder="Pilih item yang boleh dicampur dengan item ini..."
              loading={loadingMixableItems}
              disabled={loading}
              helperText="Pilih item mana saja yang boleh dicampur dalam satu karton dengan item ini. Hanya item dengan 'Allow Mixed Carton' yang ditampilkan."
            />

            {/* Display current relationships if editing */}
            {memoizedInitialData?.mixedWithItems && memoizedInitialData.mixedWithItems.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs font-medium text-blue-900 mb-1">Relasi Saat Ini:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  {memoizedInitialData.mixedWithItems.map(rel => (
                    <li key={rel.id} className="flex items-center">
                      <svg className="h-3 w-3 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {rel.mixedWithItem?.plu} - {rel.mixedWithItem?.nama_barang}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </FormSection>

      <FormSection
        title="Dimensi Karton (Opsional)"
        description="Isi jika dimensi karton berbeda dengan dimensi produk."
      >
        <FormField
          label="Berat Karton (kg)"
          name="karton_berat"
          type="number"
          value={formData.karton_berat}
          onChange={handleChange}
          min={0}
          step="0.01"
          inputMode="decimal"
        />
        <FormField
          label="Panjang Karton (cm)"
          name="karton_panjang"
          type="number"
          value={formData.karton_panjang}
          onChange={handleChange}
          min={0}
          step="0.1"
          inputMode="decimal"
        />
        <FormField
          label="Lebar Karton (cm)"
          name="karton_lebar"
          type="number"
          value={formData.karton_lebar}
          onChange={handleChange}
          min={0}
          step="0.1"
          inputMode="decimal"
        />
        <FormField
          label="Tinggi Karton (cm)"
          name="karton_tinggi"
          type="number"
          value={formData.karton_tinggi}
          onChange={handleChange}
          min={0}
          step="0.1"
          inputMode="decimal"
        />
      </FormSection>

      <FormSection
        title="Dimensi Unit"
        description="Isi detail dimensi unit barang."
      >
        <FormField
          label="Berat (kg)"
          name="berat"
          type="number"
          value={formData.berat}
          onChange={handleChange}
          min={0}
          step="0.01"
          inputMode="decimal"
        />
        <FormField
          label="Panjang (cm)"
          name="panjang"
          type="number"
          value={formData.panjang}
          onChange={handleChange}
          min={0}
          step="0.1"
          inputMode="decimal"
        />
        <FormField
          label="Lebar (cm)"
          name="lebar"
          type="number"
          value={formData.lebar}
          onChange={handleChange}
          min={0}
          step="0.1"
          inputMode="decimal"
        />
        <FormField
          label="Tinggi (cm)"
          name="tinggi"
          type="number"
          value={formData.tinggi}
          onChange={handleChange}
          min={0}
          step="0.1"
          inputMode="decimal"
        />
      </FormSection>

      <FormSection
        title="Stok"
        description="Masukkan data stok dalam itemStock (opsional)."
      >
        <FormField
          label="Stok Quantity (pcs)"
          name="stok_quantity"
          type="number"
          value={formData.stok_quantity}
          onChange={handleChange}
          min={0}
          step={1}
          inputMode="numeric"
        />
        <FormField
          label="Minimum Stok (pcs)"
          name="min_stok"
          type="number"
          value={formData.min_stok}
          onChange={handleChange}
          min={0}
          step={1}
          inputMode="numeric"
        />
        <FormField
          label="Isi per Karton"
          name="qty_per_carton"
          type="number"
          value={formData.qty_per_carton}
          onChange={handleChange}
          min={0}
          step={1}
          inputMode="numeric"
          helperText="Digunakan untuk menghitung estimasi stok karton."
        />
      </FormSection>

      <FormSection
        title="Harga"
        description="Konfigurasi itemPrice. Harga Setelah Potongan dihitung otomatis."
      >
        {/* Row 1: Harga Dasar | PPN */}
        <FormField
          label="Harga Dasar"
          name="harga"
          type="number"
          value={formData.harga}
          onChange={handleChange}
          min={0}
          step="0.01"
          inputMode="decimal"
        />
        <FormField
          label="PPN (%)"
          name="ppn"
          type="number"
          value={formData.ppn}
          onChange={handleChange}
          min={0}
          step="0.01"
          inputMode="decimal"
        />

        {/* Row 2: Potongan A | Harga Setelah Potongan A */}
        <FormField
          label="Potongan A (%)"
          name="pot1"
          type="number"
          value={formData.pot1}
          onChange={handleChange}
          min={0}
          step="0.01"
          inputMode="decimal"
        />
        <FormField
          label="Harga Setelah Potongan A"
          name="harga1"
          type="number"
          value={formData.harga1}
          disabled={true}
          helperText="Dihitung otomatis: Harga Dasar - (Harga Dasar × Potongan A%)"
        />

        {/* Row 3: Potongan B | Harga Setelah Potongan B */}
        <FormField
          label="Potongan B (%)"
          name="pot2"
          type="number"
          value={formData.pot2}
          onChange={handleChange}
          min={0}
          step="0.01"
          inputMode="decimal"
        />
        <FormField
          label="Harga Setelah Potongan B"
          name="harga2"
          type="number"
          value={formData.harga2}
          disabled={true}
          helperText="Dihitung otomatis: Harga Setelah Potongan A - (Harga Setelah Potongan A × Potongan B%)"
        />
      </FormSection>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        >
          Batal
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Buat Item'}
        </button>
      </div>
    </form>
  );
};

export default ItemForm;
