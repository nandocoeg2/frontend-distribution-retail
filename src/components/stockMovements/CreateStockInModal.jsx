import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';
import useSupplierSearch from '../../hooks/useSupplierSearch';
import { searchItems } from '../../services/itemService';
import { createStockIn, updateStockIn, checkSuratJalanExists } from '../../services/stockMovementService';
import authService from '../../services/authService';
import toastService from '../../services/toastService';

/* ────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────── */
const Label = ({ required, children }) => (
  <label className='mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500'>
    {children}{required && <span className='ml-0.5 text-red-400'>*</span>}
  </label>
);

const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
  />
);

const SectionHeader = ({ label, color, description }) => {
  const styles = {
    blue: 'border-l-blue-500 bg-blue-50/60',
    green: 'border-l-emerald-500 bg-emerald-50/60',
    amber: 'border-l-amber-500 bg-amber-50/60',
  };
  const textColor = {
    blue: 'text-blue-700',
    green: 'text-emerald-700',
    amber: 'text-amber-700',
  };
  return (
    <div className={`mb-3 flex items-center gap-2 rounded-r-md border-l-[3px] px-3 py-1.5 ${styles[color] || ''}`}>
      <span className={`text-xs font-bold uppercase tracking-wider ${textColor[color] || ''}`}>{label}</span>
      {description && <span className='text-[10px] text-gray-400'>— {description}</span>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Initial state
   ──────────────────────────────────────────────────────────── */
const INITIAL = {
  supplierId: '',
  itemId: '',
  tanggal_kirim: new Date().toISOString().slice(0, 10),
  no_surat_jalan: '',
  qty_kirim: '',
  notes: '',
};

/* ════════════════════════════════════════════════════════════
   CreateStockInModal (Supports Create & Edit)
   ════════════════════════════════════════════════════════════ */
const CreateStockInModal = ({ onClose, onSuccess, editMovement = null }) => {
  const isEdit = Boolean(editMovement);
  const [form, setForm] = useState({ ...INITIAL });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [itemOptions, setItemOptions] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);

  const sjCheckIdRef = useRef(0);

  const { searchResults: supplierResults = [], loading: supplierSearchLoading, searchSuppliers } = useSupplierSearch();
  const companyId = useMemo(() => authService.getCompanyData()?.id || '', []);

  // Prepopulate form when editMovement is provided
  useEffect(() => {
    if (editMovement) {
      const src = editMovement.source || editMovement;
      const supplierId = src.supplierId || src.supplier?.id || editMovement.supplierId || '';
      const supplierName = src.supplier?.name || editMovement.nama_supplier || '';

      const itemObj = src.items?.[0] || {};
      const itemInfo = itemObj.item || itemObj.inventory || {};
      const itemId = itemObj.itemId || itemInfo.id || editMovement.itemId || '';
      const itemName = itemInfo.nama_barang || itemInfo.name || editMovement.nama_barang || '';
      const itemPlu = itemInfo.plu || editMovement.plu || '';

      const dateRaw = src.createdAt || editMovement.createdAt;
      const formattedDate = dateRaw
        ? new Date(dateRaw).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      const qty = itemObj.quantity != null ? itemObj.quantity : editMovement.qty != null ? editMovement.qty : editMovement.quantity;

      setForm({
        supplierId,
        itemId,
        tanggal_kirim: formattedDate,
        no_surat_jalan: src.no_surat_jalan || editMovement.no_surat_jalan || '',
        qty_kirim: qty != null ? String(qty) : '',
        notes: src.notes || editMovement.notes || '',
      });

      if (itemId && (itemName || itemPlu)) {
        setItemOptions([
          {
            id: itemId,
            label: itemPlu ? `${itemPlu} — ${itemName}` : itemName,
          },
        ]);
      }
    }
  }, [editMovement]);

  const supplierOptions = useMemo(() => {
    const list = supplierResults.map((s) => ({ id: s.id, label: s.name, code: s.code }));
    if (editMovement && form.supplierId && !list.some((s) => s.id === form.supplierId)) {
      const sName = editMovement.source?.supplier?.name || editMovement.nama_supplier || 'Supplier';
      list.unshift({ id: form.supplierId, label: sName });
    }
    return list;
  }, [supplierResults, editMovement, form.supplierId]);

  /* ── No. Surat Jalan duplicate check (real-time) ── */
  const [suratJalanState, setSuratJalanState] = useState({ status: 'idle' });

  const checkSuratJalan = useCallback(async (supplierId, noSuratJalan) => {
    const trimmed = (noSuratJalan || '').trim();
    if (!supplierId || !trimmed) {
      setSuratJalanState({ status: 'idle' });
      return;
    }

    const currentMovementId = editMovement?.movementId || editMovement?.id;
    const fetchId = ++sjCheckIdRef.current;
    setSuratJalanState({ status: 'checking' });

    try {
      const res = await checkSuratJalanExists({
        supplierId,
        no_surat_jalan: trimmed,
        excludeMovementId: currentMovementId,
      });

      if (fetchId !== sjCheckIdRef.current) return; // stale response
      if (res.exists) {
        setSuratJalanState({
          status: 'duplicate',
          message: `Sudah dipakai di ${res.movementNumber || 'movement lain'}`,
          movementNumber: res.movementNumber,
        });
      } else {
        setSuratJalanState({ status: 'available' });
      }
    } catch (err) {
      if (fetchId !== sjCheckIdRef.current) return;
      console.error('Failed to check no_surat_jalan:', err);
      setSuratJalanState({ status: 'error', message: 'Gagal mengecek No. Surat Jalan' });
    }
  }, [editMovement]);

  /* helpers */
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setNum = (k, v) => setForm((p) => ({ ...p, [k]: v.replace(/[^0-9.]/g, '') }));

  const qtyKirim = parseFloat(form.qty_kirim) || 0;

  const handleSupplierSelect = useCallback((e) => {
    const val = e?.target?.value || e;
    set('supplierId', val);
    checkSuratJalan(val, form.no_surat_jalan);
  }, [form.no_surat_jalan, checkSuratJalan]);

  /* ── No. Surat Jalan input handlers ── */
  const handleSuratJalanChange = useCallback((e) => {
    const v = e.target.value;
    set('no_surat_jalan', v);
    setSuratJalanState({ status: 'idle' });
  }, []);

  const handleSuratJalanBlur = useCallback(() => {
    checkSuratJalan(form.supplierId, form.no_surat_jalan);
  }, [checkSuratJalan, form.supplierId, form.no_surat_jalan]);

  /* ── Item search ── */
  const handleItemSearch = useCallback(async (q) => {
    if (!q || q.length < 1) return;
    setItemLoading(true);
    try {
      const res = await searchItems(q, 1, 20);
      const items = res?.data?.data || res?.data || [];
      setItemOptions(Array.isArray(items) ? items.map((i) => ({
        id: i.id, label: `${i.plu} — ${i.nama_barang}`,
      })) : []);
    } catch { /* ignore */ } finally { setItemLoading(false); }
  }, []);

  const handleItemSelect = useCallback((e) => {
    const val = e?.target?.value || e;
    set('itemId', val);
  }, []);

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.supplierId) { setFormError('Nama Supplier harus dipilih'); return; }
    if (!form.itemId) { setFormError('Item harus dipilih'); return; }
    if (!qtyKirim || qtyKirim <= 0) { setFormError('Qty Kirim harus > 0'); return; }
    if (!companyId && !isEdit) { setFormError('Company tidak ditemukan, silakan login ulang'); return; }

    if (suratJalanState.status === 'checking') {
      setFormError('Tunggu sebentar, sedang memeriksa No. Surat Jalan...');
      return;
    }
    if (suratJalanState.status === 'duplicate') {
      setFormError(
        `No. Surat Jalan "${form.no_surat_jalan.trim()}" sudah dipakai untuk supplier ini` +
        (suratJalanState.movementNumber ? ` (${suratJalanState.movementNumber})` : '')
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const movementId = editMovement.movementId || editMovement.id;
        await updateStockIn(movementId, {
          supplierId: form.supplierId,
          itemId: form.itemId,
          tanggal_kirim: form.tanggal_kirim || undefined,
          no_surat_jalan: form.no_surat_jalan || undefined,
          qty_kirim: qtyKirim,
          notes: form.notes || undefined,
          spesifikasi: form.notes || undefined,
        });
        toastService.success('Stock In berhasil diperbarui');
      } else {
        await createStockIn({
          companyId,
          supplierId: form.supplierId,
          itemId: form.itemId,
          tanggal_kirim: form.tanggal_kirim || undefined,
          no_surat_jalan: form.no_surat_jalan || undefined,
          qty_kirim: qtyKirim,
          notes: form.notes || undefined,
          spesifikasi: form.notes || undefined,
        });
        toastService.success('Stock In berhasil disimpan');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setFormError(err?.message || (isEdit ? 'Gagal memperbarui Stock In' : 'Gagal menyimpan Stock In'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <div className='w-full max-w-[900px] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-900/10'>

        {/* ── Header ── */}
        <div className='flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3.5'>
          <h2 className='text-sm font-bold tracking-wide text-white'>
            {isEdit ? 'Edit / Ubah Stock In' : 'Stock In Baru'}
          </h2>
          <button type='button' onClick={onClose} className='rounded-lg p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white'>
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ═══════════════════════════════════════════════════
             SECTION — BARANG MASUK
             ═══════════════════════════════════════════════════ */}
          <div className='px-6 pt-5 pb-6 space-y-4'>
            <SectionHeader
              label='BARANG MASUK'
              color='green'
              description={isEdit ? 'Perbarui data barang masuk / koreksi salah input' : 'Data pengiriman barang'}
            />

            {/* Row 1: Tanggal Kirim, Nama Supplier, No. Surat Jalan, Qty Kirim, Notes */}
            <div className='grid gap-x-4 gap-y-3 sm:grid-cols-12'>
              <div className='sm:col-span-2'>
                <Label>Tanggal Kirim</Label>
                <Input
                  type='date'
                  value={form.tanggal_kirim}
                  onChange={(e) => set('tanggal_kirim', e.target.value)}
                />
              </div>

              <div className='sm:col-span-3'>
                <Label required>Nama Supplier</Label>
                <Autocomplete
                  name='supplierId'
                  options={supplierOptions}
                  value={form.supplierId}
                  onChange={handleSupplierSelect}
                  placeholder='Cari supplier...'
                  displayKey='label'
                  valueKey='id'
                  loading={supplierSearchLoading}
                  onSearch={async (q) => { try { await searchSuppliers(q, 1, 20); } catch { } }}
                  showId
                />
              </div>

              <div className='sm:col-span-3'>
                <Label>No. Surat Jalan</Label>
                <Input
                  value={form.no_surat_jalan}
                  onChange={handleSuratJalanChange}
                  onBlur={handleSuratJalanBlur}
                  placeholder='SJ-2026-001'
                  className={
                    suratJalanState.status === 'duplicate'
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : suratJalanState.status === 'available'
                        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                        : ''
                  }
                />
                {suratJalanState.status === 'checking' && (
                  <p className='mt-0.5 text-[10px] text-gray-500'>Memeriksa...</p>
                )}
                {suratJalanState.status === 'duplicate' && (
                  <p className='mt-0.5 text-[10px] font-medium text-red-500'>
                    {suratJalanState.message || 'Sudah dipakai untuk supplier ini'}
                  </p>
                )}
                {suratJalanState.status === 'available' && (
                  <p className='mt-0.5 text-[10px] text-emerald-600'>Tersedia</p>
                )}
                {suratJalanState.status === 'error' && (
                  <p className='mt-0.5 text-[10px] text-amber-600'>{suratJalanState.message}</p>
                )}
              </div>

              <div className='sm:col-span-2'>
                <Label required>Qty Kirim</Label>
                <Input
                  value={form.qty_kirim}
                  onChange={(e) => setNum('qty_kirim', e.target.value)}
                  placeholder='500'
                  inputMode='numeric'
                />
              </div>

              <div className='sm:col-span-2'>
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder='Varian / ket'
                />
              </div>
            </div>

            {/* Row 2: Item Selection */}
            <div>
              <Label required>Item</Label>
              <Autocomplete
                name='itemId'
                options={itemOptions}
                value={form.itemId}
                onChange={handleItemSelect}
                placeholder='Cari item (PLU / nama barang)...'
                displayKey='label'
                valueKey='id'
                loading={itemLoading}
                onSearch={handleItemSearch}
              />
            </div>
          </div>

          {/* ── error ── */}
          {formError && (
            <div className='mx-6 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700'>
              ⚠️ {formError}
            </div>
          )}

          {/* ── footer ── */}
          <div className='flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50/80 px-6 py-3'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50'
            >
              Batal
            </button>
            <button
              type='submit'
              disabled={
                isSubmitting ||
                suratJalanState.status === 'checking' ||
                suratJalanState.status === 'duplicate'
              }
              className='rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isSubmitting ? (
                <span className='flex items-center gap-2'>
                  <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  {isEdit ? 'Memperbarui...' : 'Menyimpan...'}
                </span>
              ) : isEdit ? 'Simpan Perubahan' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStockInModal;
