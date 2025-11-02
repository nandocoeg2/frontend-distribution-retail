import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Autocomplete from '@/components/common/Autocomplete';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import useReturnForm from '@/hooks/useReturnForm';
import {
  getInventories,
  searchInventories,
} from '@/services/inventoryService';
import toastService from '@/services/toastService';

const INVENTORY_FETCH_LIMIT = 20;

const extractInventoryList = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response.data?.inventories)) {
    return response.data.inventories;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.inventories)) {
    return response.inventories;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
};

const ReturnCreate = () => {
  const navigate = useNavigate();
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const {
    formData,
    errors,
    submitting,
    handleChange,
    handleSubmit,
    setErrors,
    setFormData,
  } = useReturnForm({
    onSuccess: () => {
      navigate('/returns');
    },
  });

  const loadInventories = useCallback(
    async (query = '') => {
      setInventoryLoading(true);
      try {
        const response = query
          ? await searchInventories(query, 1, INVENTORY_FETCH_LIMIT)
          : await getInventories(1, INVENTORY_FETCH_LIMIT);
        const list = extractInventoryList(response);
        setInventoryOptions(Array.isArray(list) ? list : []);
      } catch (err) {
        toastService.error(err.message || 'Gagal memuat data inventaris.');
        setInventoryOptions([]);
      } finally {
        setInventoryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadInventories();
  }, [loadInventories]);

  const normalizedInventoryOptions = useMemo(() => {
    return inventoryOptions.map((item) => {
      const id =
        item.id ||
        item.inventoryId ||
        item.inventory_id ||
        item.inventory_id_id ||
        '';

      const itemStock = item.itemStock || item.itemStocks || item.item_stock || {};

      return {
        id,
        label: item.nama_barang || item.name || item.productName || 'Tanpa Nama',
        stokQuantity:
          itemStock.stok_quantity ??
          item.stok_quantity ??
          item.stok_q ??
          item.stokQ ??
          item.stockQty ??
          null,
        minStock:
          itemStock.min_stok ??
          item.min_stok ??
          null,
        qtyPerCarton:
          itemStock.qty_per_carton ??
          item.qty_per_carton ??
          null,
        raw: item,
      };
    });
  }, [inventoryOptions]);

  const selectedInventory = useMemo(() => {
    return normalizedInventoryOptions.find(
      (option) => option.id === formData.inventoryId
    );
  }, [formData.inventoryId, normalizedInventoryOptions]);

  const handleInventoryChange = useCallback(
    (event) => {
      handleChange(event);
      if (!event.target.value) {
        setErrors((prev) => ({
          ...prev,
          inventoryId: 'Produk wajib dipilih.',
        }));
      }
    },
    [handleChange, setErrors]
  );

  const handleInventorySearch = useCallback(
    async (query) => {
      await loadInventories(query);
    },
    [loadInventories]
  );

  const handleQuantityInput = (event) => {
    const { value } = event.target;
    if (Number(value) < 0) {
      setFormData((prev) => ({
        ...prev,
        quantity: '',
      }));
      setErrors((prev) => ({
        ...prev,
        quantity: 'Jumlah tidak boleh negatif.',
      }));
      return;
    }
    handleChange(event);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await handleSubmit();
  };

  const handleBack = () => {
    navigate('/returns');
  };

  return (
    <div className='max-w-4xl px-6 py-8 mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>
            Buat Retur Barang
          </h1>
          <p className='mt-1 text-sm text-gray-500'>
            Lengkapi informasi retur dan pastikan detail produk sesuai.
          </p>
        </div>
        <button
          type='button'
          onClick={handleBack}
          className='inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 transition-colors bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50'
        >
          Kembali
        </button>
      </div>

      <div className='p-6 mb-6 border border-blue-100 rounded-lg bg-blue-50'>
        <div className='flex items-start gap-3'>
          <div className='flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full'>
            <HeroIcon name='sparkles' className='w-6 h-6 text-blue-600' />
          </div>
          <div className='text-sm text-blue-800'>
            <p className='font-semibold'>
              Kiat untuk kasus retur sebagian:
            </p>
            <p className='mt-1'>
              Jika satu pengiriman memiliki barang baik dan rusak, buat dua
              catatan retur terpisah. Misalnya 5 unit dikembalikan, 3 layak jual
              dan 2 rusak:
            </p>
            <ul className='mt-2 list-disc list-inside'>
              <li>
                Retur #1: jumlah <strong>3</strong> dengan alasan barang baik
                namun kemasan rusak, lalu pilih aksi <strong>Stok Ulang</strong>.
              </li>
              <li>
                Retur #2: jumlah <strong>2</strong> dengan alasan barang rusak,
                lalu pilih aksi <strong>Tolak</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className='p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-sm'
      >
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Produk / Inventaris
          </label>
          <div className='mt-2'>
            <Autocomplete
              options={normalizedInventoryOptions}
              value={formData.inventoryId}
              onChange={handleInventoryChange}
              placeholder='Cari dan pilih produk'
              displayKey='label'
              valueKey='id'
              name='inventoryId'
              loading={inventoryLoading}
              onSearch={handleInventorySearch}
            />
            {errors.inventoryId ? (
              <p className='mt-1 text-sm text-red-600'>{errors.inventoryId}</p>
            ) : (
              selectedInventory && (
                <p className='mt-1 text-sm text-gray-500'>
                  Stok Gudang: {selectedInventory.stokQuantity ?? '-'} unit
                  {selectedInventory.minStock !== null &&
                    selectedInventory.minStock !== undefined && (
                      <>
                        {' '}
                        &bull; Min {selectedInventory.minStock}
                      </>
                    )}
                  {selectedInventory.qtyPerCarton !== null &&
                    selectedInventory.qtyPerCarton !== undefined && (
                      <>
                        {' '}
                        &bull; Qty/Carton {selectedInventory.qtyPerCarton}
                      </>
                    )}
                </p>
              )
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor='quantity'
            className='block text-sm font-medium text-gray-700'
          >
            Jumlah
          </label>
          <input
            id='quantity'
            name='quantity'
            type='number'
            min='1'
            value={formData.quantity}
            onChange={handleQuantityInput}
            className='block w-full mt-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
            placeholder='Masukkan jumlah retur'
          />
          {errors.quantity ? (
            <p className='mt-1 text-sm text-red-600'>{errors.quantity}</p>
          ) : (
            <p className='mt-1 text-sm text-gray-500'>
              Masukkan jumlah barang yang dikembalikan oleh pelanggan.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='reason'
            className='block text-sm font-medium text-gray-700'
          >
            Alasan Retur
          </label>
          <textarea
            id='reason'
            name='reason'
            rows={4}
            value={formData.reason}
            onChange={handleChange}
            placeholder='Contoh: Kemasan penyok, produk dalam kondisi baik'
            className='block w-full mt-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
          />
          {errors.reason ? (
            <p className='mt-1 text-sm text-red-600'>{errors.reason}</p>
          ) : (
            <p className='mt-1 text-sm text-gray-500'>
              Sampaikan alasan singkat namun jelas untuk membantu proses QC.
            </p>
          )}
        </div>

        <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-100'>
          <button
            type='button'
            onClick={handleBack}
            className='inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 transition-colors bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50'
          >
            Batal
          </button>
          <button
            type='submit'
            disabled={submitting}
            className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 border border-transparent rounded-md shadow-sm disabled:opacity-60 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            {submitting ? (
              <span className='flex items-center'>
                <span className='w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin'></span>
                Menyimpan...
              </span>
            ) : (
              <>
                <HeroIcon name='check' className='w-5 h-5 mr-2' />
                Simpan Retur
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReturnCreate;
