# Inventory Hooks Documentation

Dokumentasi hooks untuk manajemen inventory yang telah diperbaiki sesuai dengan API documentation.

## Hooks yang Tersedia

### 1. useInventoriesPage
Hook utama untuk halaman daftar inventory dengan pagination dan search.

**Fitur:**
- Fetch daftar inventory dengan pagination
- Search inventory dengan debounce
- Delete inventory
- Error handling dan loading states
- Auto refresh setelah operasi

**Penggunaan:**
```jsx
import { useInventoriesPage } from '../hooks/useInventory';

const InventoriesPage = () => {
  const {
    inventories,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteInventory,
    fetchInventories
  } = useInventoriesPage();

  // ... komponen
};
```

### 2. useInventoryForm
Hook untuk form create dan edit inventory.

**Fitur:**
- Form state management
- Validation
- Auto load data untuk edit mode
- Error handling

**Penggunaan:**
```jsx
import { useInventoryForm } from '../hooks/useInventory';

const InventoryFormComponent = ({ inventoryId = null }) => {
  const {
    formData,
    setFormData,
    loading,
    error,
    isEditMode,
    handleInputChange,
    handleSubmit,
    resetForm,
    loadInventoryData,
    validateForm
  } = useInventoryForm(inventoryId);

  // ... komponen
};
```

### 3. useInventoryDetail
Hook untuk menampilkan detail inventory individual.

**Fitur:**
- Load detail inventory
- Delete inventory
- Refresh data
- Error handling

**Penggunaan:**
```jsx
import { useInventoryDetail } from '../hooks/useInventory';

const InventoryDetailComponent = ({ inventoryId }) => {
  const {
    inventory,
    loading,
    error,
    deleteLoading,
    handleDelete,
    refreshInventory
  } = useInventoryDetail(inventoryId);

  // ... komponen
};
```

### 4. useInventorySearch
Hook khusus untuk search inventory.

**Fitur:**
- Search dengan debounce
- Pagination untuk hasil search
- Clear search
- Error handling

**Penggunaan:**
```jsx
import { useInventorySearch } from '../hooks/useInventory';

const SearchComponent = () => {
  const {
    searchResults,
    pagination,
    loading,
    error,
    searchQuery,
    handleSearchChange,
    handlePageChange,
    clearSearch
  } = useInventorySearch();

  // ... komponen
};
```

### 5. useInventoryOperations
Hook untuk operasi CRUD inventory.

**Fitur:**
- Create inventory
- Update inventory
- Delete inventory
- Get inventory by ID
- Validation
- Error handling

**Penggunaan:**
```jsx
import { useInventoryOperations } from '../hooks/useInventory';

const OperationsComponent = () => {
  const {
    loading,
    error,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryItem,
    validateInventoryData
  } = useInventoryOperations();

  // ... komponen
};
```

## Field Inventory

Mengikuti API terbaru, struktur payload inventory yang digunakan:

- `plu`: Price Look-Up code (kode barang) - Required
- `nama_barang`: Nama barang - Required
- `eanBarcode`: Barcode EAN-8 / EAN-13 - Optional
- `uom`: Unit of Measurement (default `KARTON`) - Optional
- `allow_mixed_carton`: Apakah barang boleh mixed carton - Required (boolean)
- `dimensi`: Objek dimensi tunggal (berat, panjang, lebar, tinggi) - Required
- `itemStock`: Objek stok (stok_quantity, min_stok, qty_per_carton) - Optional (default 0)
- `itemPrice`: Objek harga (harga, pot1, harga1, pot2, harga2, ppn) - Optional

## Error Handling

Semua hooks menggunakan error handling yang konsisten:
- Auto redirect ke login jika token expired (401/403)
- Toast notification untuk error messages
- Error state management
- Loading state management

## Response Format

Semua hooks mengharapkan response format dari API:
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

```jsx
// Import individual hooks
import { 
  useInventoriesPage, 
  useInventoryForm, 
  useInventoryDetail, 
  useInventorySearch, 
  useInventoryOperations 
} from '../hooks/useInventory';

// Atau import default (useInventoriesPage)
import useInventoriesPage from '../hooks/useInventoriesPage';
```
