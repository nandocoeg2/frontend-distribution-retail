import React, { useState, useEffect, useMemo } from 'react';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';

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

const InventoryForm = ({ onSubmit, onClose, initialData = {}, loading = false, error = null }) => {
  const [formData, setFormData] = useState(() => ({ ...DEFAULT_FORM_STATE }));

  const memoizedInitialData = useMemo(() => initialData, [initialData]);

  useEffect(() => {
    if (!memoizedInitialData || Object.keys(memoizedInitialData).length === 0) {
      setFormData({ ...DEFAULT_FORM_STATE });
      return;
    }

    setFormData({
      plu: memoizedInitialData.plu || '',
      nama_barang: memoizedInitialData.nama_barang || '',
      eanBarcode: memoizedInitialData.eanBarcode || '',
      uom: memoizedInitialData.uom || DEFAULT_FORM_STATE.uom,
      allow_mixed_carton: Boolean(
        memoizedInitialData.allow_mixed_carton ?? true
      ),
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
      harga: getPriceValue(memoizedInitialData, 'harga'),
      pot1: getPriceValue(memoizedInitialData, 'pot1'),
      harga1: getPriceValue(memoizedInitialData, 'harga1'),
      pot2: getPriceValue(memoizedInitialData, 'pot2'),
      harga2: getPriceValue(memoizedInitialData, 'harga2'),
      ppn: getPriceValue(memoizedInitialData, 'ppn')
    });
  }, [memoizedInitialData]);

  const handleChange = ({ target }) => {
    const { name, value, type, checked } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const dataToSubmit = {
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
        description="Lengkapi identitas utama inventory. PLU tidak dapat diubah setelah data dibuat."
      >
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
        title="Dimensi"
        description="Isi detail dimensi barang sesuai struktur payload API."
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
        description="Konfigurasi itemPrice. Biarkan nilai 0 jika tidak digunakan."
      >
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
          label="Potongan 1 (%)"
          name="pot1"
          type="number"
          value={formData.pot1}
          onChange={handleChange}
          min={0}
          step="0.01"
          inputMode="decimal"
        />
        <FormField
          label="Harga Setelah Potongan 1"
          name="harga1"
          type="number"
          value={formData.harga1}
          onChange={handleChange}
          min={0}
          step="0.01"
          inputMode="decimal"
        />
        <FormField
          label="Potongan 2 (%)"
          name="pot2"
          type="number"
          value={formData.pot2}
          onChange={handleChange}
          min={0}
          step="0.01"
          inputMode="decimal"
        />
        <FormField
          label="Harga Setelah Potongan 2"
          name="harga2"
          type="number"
          value={formData.harga2}
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
          {loading ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Buat Inventory'}
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;

