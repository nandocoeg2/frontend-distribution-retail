# Item Hooks Documentation

Dokumentasi hooks untuk manajemen data item yang menggantikan modul inventory lama.

## Hooks yang Tersedia

### 1. useItemsPage
Hook utama untuk halaman daftar item lengkap dengan pagination, pencarian, dan delete.

**Fitur:**
- Ambil daftar item dengan pagination
- Pencarian dengan debounce
- Delete item dan refresh otomatis
- Penanganan error dan state loading terpusat

**Penggunaan:**
```jsx
import { useItemsPage } from '../hooks/useItem';

const ItemsPage = () => {
  const {
    items,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteItem,
    fetchItems,
  } = useItemsPage();

  // ... komponen
};
```

### 2. useItemForm
Hook untuk form create & edit item.

**Fitur:**
- Manajemen state form lengkap
- Validasi input
- Auto load data pada edit mode
- Penanganan error & redirect auth

**Penggunaan:**
```jsx
import { useItemForm } from '../hooks/useItem';

const ItemFormComponent = ({ itemId = null }) => {
  const {
    formData,
    setFormData,
    loading,
    error,
    isEditMode,
    handleInputChange,
    handleSubmit,
    resetForm,
    loadItemData,
    validateForm,
  } = useItemForm(itemId);

  // ... komponen
};
```

### 3. useItemDetail
Hook untuk detail item tunggal.

**Fitur:**
- Load detail item
- Delete item
- Refresh data
- Penanganan error & redirect auth

**Penggunaan:**
```jsx
import { useItemDetail } from '../hooks/useItem';

const ItemDetailComponent = ({ itemId }) => {
  const {
    item,
    loading,
    error,
    deleteLoading,
    handleDelete,
    refreshItem,
  } = useItemDetail(itemId);

  // ... komponen
};
```

### 4. useItemSearch
Hook khusus pencarian item.

**Fitur:**
- Pencarian dengan debounce
- Pagination hasil pencarian
- Clear state pencarian
- Penanganan error & auth

**Penggunaan:**
```jsx
import { useItemSearch } from '../hooks/useItem';

const SearchComponent = () => {
  const {
    searchResults,
    pagination,
    loading,
    error,
    searchQuery,
    handleSearchChange,
    handlePageChange,
    clearSearch,
  } = useItemSearch();

  // ... komponen
};
```

### 5. useItemOperations
Hook utilitas CRUD item.

**Fitur:**
- Create / Update / Delete item
- Get item by ID
- Validasi payload
- Penanganan error & auth

**Penggunaan:**
```jsx
import { useItemOperations } from '../hooks/useItem';

const OperationsComponent = () => {
  const {
    loading,
    error,
    createItemData,
    updateItemData,
    deleteItemData,
    getItemData,
    validateItemData,
  } = useItemOperations();

  // ... komponen
};
```

## Field Item

Mengikuti API terbaru, struktur payload item yang digunakan:

- `plu`: Kode barang (wajib)
- `nama_barang`: Nama barang (wajib)
- `eanBarcode`: Barcode EAN-8 / EAN-13 (opsional)
- `uom`: Unit of Measurement (default `KARTON`, opsional)
- `allow_mixed_carton`: Boolean apakah boleh mixed carton (wajib)
- `dimensi`: Objek dimensi tunggal (berat, panjang, lebar, tinggi)
- `itemStock`: Objek stok (`stok_quantity`, `min_stok`, `qty_per_carton`)
- `itemPrice`: Objek harga (`harga`, `pot1`, `harga1`, `pot2`, `harga2`, `ppn`)

## Error Handling

Semua hooks item menggunakan pola berikut:
- Redirect ke login saat token kadaluarsa (401/403)
- Toast notification untuk pesan error
- State `error` dan `loading` konsisten

## Response Format

Semua hooks mengharapkan response API dengan format:

```json
{
  "success": true,
  "data": {
    "data": [...],
    "pagination": {...}
  }
}
```

Atau untuk single item:

```json
{
  "success": true,
  "data": {...}
}
```

## Import

Gunakan entry point `src/hooks/useItem.js` untuk mengimpor seluruh hooks item:

```jsx
import {
  useItemsPage,
  useItemForm,
  useItemDetail,
  useItemSearch,
  useItemOperations,
} from '../hooks/useItem';
```
