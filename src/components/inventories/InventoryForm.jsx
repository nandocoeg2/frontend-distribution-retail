import React, { useState, useEffect, useMemo } from 'react';
import FormField from '../common/FormField';
import FormSection from '../common/FormSection';

const DEFAULT_FORM_STATE = {
  plu: '',
  nama_barang: '',
  stok_c: '',
  stok_q: '',
  harga_barang: '',
  min_stok: '10',
  berat: '0',
  panjang: '0',
  lebar: '0',
  tinggi: '0'
};

const getDimensionValue = (source, field) => {
  if (source == null) {
    return '0';
  }

  const directValue = source[field];
  if (directValue !== undefined && directValue !== null) {
    return String(directValue);
  }

  const nestedValue = source.dimensiKardus?.[field];
  if (nestedValue !== undefined && nestedValue !== null) {
    return String(nestedValue);
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

  const memoizedInitialData = useMemo(() => initialData, [
    initialData?.id,
    initialData?.plu,
    initialData?.nama_barang,
    initialData?.stok_c,
    initialData?.stok_q,
    initialData?.harga_barang,
    initialData?.min_stok,
    initialData?.berat,
    initialData?.panjang,
    initialData?.lebar,
    initialData?.tinggi,
    initialData?.dimensiKardus?.berat,
    initialData?.dimensiKardus?.panjang,
    initialData?.dimensiKardus?.lebar,
    initialData?.dimensiKardus?.tinggi
  ]);

  useEffect(() => {
    if (!memoizedInitialData || Object.keys(memoizedInitialData).length === 0) {
      setFormData({ ...DEFAULT_FORM_STATE });
      return;
    }

    setFormData({
      plu: memoizedInitialData.plu || '',
      nama_barang: memoizedInitialData.nama_barang || '',
      stok_c: memoizedInitialData.stok_c !== undefined && memoizedInitialData.stok_c !== null
        ? String(memoizedInitialData.stok_c)
        : '',
      stok_q: memoizedInitialData.stok_q !== undefined && memoizedInitialData.stok_q !== null
        ? String(memoizedInitialData.stok_q)
        : '',
      harga_barang: memoizedInitialData.harga_barang !== undefined && memoizedInitialData.harga_barang !== null
        ? String(memoizedInitialData.harga_barang)
        : '',
      min_stok: memoizedInitialData.min_stok !== undefined && memoizedInitialData.min_stok !== null
        ? String(memoizedInitialData.min_stok)
        : '10',
      berat: getDimensionValue(memoizedInitialData, 'berat'),
      panjang: getDimensionValue(memoizedInitialData, 'panjang'),
      lebar: getDimensionValue(memoizedInitialData, 'lebar'),
      tinggi: getDimensionValue(memoizedInitialData, 'tinggi')
    });
  }, [memoizedInitialData]);

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const dataToSubmit = {
      plu: formData.plu?.trim(),
      nama_barang: formData.nama_barang?.trim(),
      stok_c: parseInteger(formData.stok_c),
      stok_q: parseInteger(formData.stok_q),
      harga_barang: parseDecimal(formData.harga_barang),
      min_stok: parseInteger(formData.min_stok, 10),
      berat: parseDecimal(formData.berat),
      panjang: parseDecimal(formData.panjang),
      lebar: parseDecimal(formData.lebar),
      tinggi: parseDecimal(formData.tinggi)
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
      </FormSection>

      <FormSection
        title="Informasi Stok"
        description="Gunakan angka non-negatif untuk stok karton dan stok pcs."
        columns={3}
      >
        <FormField
          label="Stok Karton"
          name="stok_c"
          type="number"
          value={formData.stok_c}
          onChange={handleChange}
          required
          min={0}
          step={1}
          inputMode="numeric"
        />
        <FormField
          label="Stok Pcs"
          name="stok_q"
          type="number"
          value={formData.stok_q}
          onChange={handleChange}
          required
          min={0}
          step={1}
          inputMode="numeric"
        />
        <FormField
          label="Minimal Stok"
          name="min_stok"
          type="number"
          value={formData.min_stok}
          onChange={handleChange}
          required
          min={0}
          step={1}
          inputMode="numeric"
          helperText="Sistem akan mengirim notifikasi jika stok berada di bawah angka ini."
        />
      </FormSection>

      <FormSection
        title="Harga & Nilai"
        description="Masukkan harga satuan barang dalam Rupiah."
        columns={1}
      >
        <FormField
          label="Harga Barang"
          name="harga_barang"
          type="number"
          value={formData.harga_barang}
          onChange={handleChange}
          required
          min={0}
          step="0.01"
          inputMode="decimal"
          helperText="Gunakan titik sebagai pemisah desimal jika diperlukan."
        />
      </FormSection>

      <FormSection
        title="Dimensi Kardus"
        description="Opsional. Isi berat dan ukuran fisik kardus untuk perhitungan logistik."
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

