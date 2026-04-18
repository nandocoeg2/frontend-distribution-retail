import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';
import useSupplierSearch from '../../hooks/useSupplierSearch';
import { getItems } from '../../services/itemService';

const SupplierItemPriceFormModal = ({ show, onClose, onSubmit, editData = null }) => {
  const isEdit = !!editData?.id;

  const [form, setForm] = useState({ supplierId: '', itemId: '', harga_pcs: '', spesifikasi: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemOptions, setItemOptions] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const { searchResults: supplierResults = [], loading: supplierSearchLoading, searchSuppliers } = useSupplierSearch();
  const supplierOptions = supplierResults.map((s) => ({ id: s.id, label: s.name, code: s.code }));

  useEffect(() => {
    if (show) {
      if (isEdit) {
        setForm({
          supplierId: editData.supplierId || '',
          itemId: editData.itemId || '',
          harga_pcs: editData.harga_pcs != null ? String(editData.harga_pcs) : '',
          spesifikasi: editData.spesifikasi || '',
        });
      } else {
        setForm({ supplierId: '', itemId: '', harga_pcs: '', spesifikasi: '' });
      }
      setFormError('');
      setIsSubmitting(false);
    }
  }, [show, editData, isEdit]);

  useEffect(() => {
    if (show) {
      setItemsLoading(true);
      getItems(1, 200).then((res) => {
        const raw = res?.data?.data || res?.data?.items || res?.data || [];
        setItemOptions(Array.isArray(raw) ? raw.map((i) => ({ id: i.id, label: `${i.plu} - ${i.nama_barang}`, plu: i.plu, nama_barang: i.nama_barang })) : []);
      }).catch(() => {}).finally(() => setItemsLoading(false));
    }
  }, [show]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const handleSupplierChange = (e) => {
    const v = e?.target ? e.target.value : e;
    setForm((p) => ({ ...p, supplierId: v }));
  };
  const handleItemChange = (e) => {
    const v = e?.target ? e.target.value : e;
    setForm((p) => ({ ...p, itemId: v }));
  };

  const validateForm = () => {
    if (!isEdit && !form.supplierId.trim()) return 'Supplier wajib dipilih.';
    if (!isEdit && !form.itemId.trim()) return 'Item wajib dipilih.';
    const h = Number(form.harga_pcs);
    if (!Number.isFinite(h) || h < 0) return 'Harga (PCS) harus angka >= 0.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setFormError(err); return; }

    const payload = isEdit
      ? { harga_pcs: Number(form.harga_pcs), spesifikasi: form.spesifikasi.trim() || undefined }
      : { supplierId: form.supplierId.trim(), itemId: form.itemId.trim(), harga_pcs: Number(form.harga_pcs), spesifikasi: form.spesifikasi.trim() || undefined };

    setFormError('');
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setFormError(err?.message || 'Gagal menyimpan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <div className='flex items-center justify-between border-b border-gray-200 bg-indigo-600 px-5 py-3 text-white'>
          <h2 className='text-base font-semibold'>{isEdit ? 'Edit' : 'Tambah'} Harga Item Supplier</h2>
          <button type='button' onClick={onClose} className='rounded p-1 hover:bg-white/20'><XMarkIcon className='h-5 w-5' /></button>
        </div>

        <form onSubmit={handleSubmit} className='px-5 py-4 space-y-3'>
          {!isEdit && (
            <>
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>Supplier</label>
                <Autocomplete
                  label='' name='supplierId' options={supplierOptions}
                  value={form.supplierId} onChange={handleSupplierChange}
                  placeholder='Cari supplier...' displayKey='label' valueKey='id'
                  loading={supplierSearchLoading}
                  onSearch={async (q) => { try { await searchSuppliers(q, 1, 20); } catch {} }}
                  showId
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>Item</label>
                <Autocomplete
                  label='' name='itemId' options={itemOptions}
                  value={form.itemId} onChange={handleItemChange}
                  placeholder='Cari item (PLU/nama)...' displayKey='label' valueKey='id'
                  loading={itemsLoading}
                />
              </div>
            </>
          )}

          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Harga / PCS (Rp)</label>
            <input name='harga_pcs' type='number' step='0.01' min='0' value={form.harga_pcs} onChange={handleFieldChange}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500' />
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Spesifikasi (opsional)</label>
            <input name='spesifikasi' type='text' maxLength={255} value={form.spesifikasi} onChange={handleFieldChange}
              placeholder='Opsional'
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500' />
          </div>

          {formError && (
            <div className='rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{formError}</div>
          )}

          <div className='flex justify-end gap-2 pt-2 border-t border-gray-100'>
            <button type='button' onClick={onClose}
              className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'>Batal</button>
            <button type='submit' disabled={isSubmitting}
              className='rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50'>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierItemPriceFormModal;
