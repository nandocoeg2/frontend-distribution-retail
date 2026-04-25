import React, { useState, useCallback, useMemo, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';
import useSupplierSearch from '../../hooks/useSupplierSearch';
import { searchItems } from '../../services/itemService';
import { reportPoSupplierService } from '../../services/reportPoSupplierService';
import { createStockIn } from '../../services/stockMovementService';
import authService from '../../services/authService';
import toastService from '../../services/toastService';
import { supplierItemPriceService } from '../../services/supplierItemPriceService';

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

const ReadOnly = ({ value, label }) => (
  <div>
    {label && <Label>{label}</Label>}
    <div className='flex h-9 items-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 text-sm font-semibold tabular-nums text-gray-700'>
      {value}
    </div>
  </div>
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

const PoModeButton = ({ active, onClick, children }) => (
  <button
    type='button' onClick={onClick}
    className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
    }`}
  >{children}</button>
);

const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

/* ────────────────────────────────────────────────────────────
   Initial state
   ──────────────────────────────────────────────────────────── */
const INITIAL = {
  supplierId: '', no_po: '', spesifikasi: '', itemId: '',
  qty_po: '', harga_pcs: '',
  tanggal_kirim: new Date().toISOString().slice(0, 10),
  no_surat_jalan: '', qty_kirim: '',
  no_kwitansi: '', no_invoice: '', no_faktur_pajak: '', tanggal_faktur_pajak: '',
  dpp: '', ppn: '', tanggal_ttf: '', tanggal_jatuh_tempo: '',
  tanggal_payment_list: '', tanggal_dibayar: '', total_dibayar: '',
};

/* ════════════════════════════════════════════════════════════
   CreateStockInModal
   ════════════════════════════════════════════════════════════ */
const CreateStockInModal = ({ onClose, onSuccess, editMovement = null }) => {
  const isEdit = !!editMovement;
  const [form, setForm] = useState({ ...INITIAL });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [poMode, setPoMode] = useState('baru');
  const [editReportId, setEditReportId] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [poResults, setPoResults] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [previousDeliveredQty, setPreviousDeliveredQty] = useState(0);

  const [itemOptions, setItemOptions] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [ppnRate, setPpnRate] = useState(0);

  const priceFetchIdRef = useRef(0);

  const fetchSupplierPrice = useCallback(async (sid, iid) => {
    if (!sid || !iid || poMode === 'lama' || isEdit) return;
    const fetchId = ++priceFetchIdRef.current;
    try {
      const res = await supplierItemPriceService.getAllWithFilters(1, 1, { supplierId: sid, itemId: iid });
      if (fetchId !== priceFetchIdRef.current) return;
      const rows = res?.data?.data?.data || res?.data?.data || [];
      const record = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (record?.harga_pcs != null) {
        setForm((p) => ({ ...p, harga_pcs: String(Number(record.harga_pcs)) }));
      }
    } catch (e) {
      console.error('Failed to fetch supplier price:', e);
    }
  }, [poMode, isEdit]);

  /* ── load edit data on mount ── */
  React.useEffect(() => {
    if (!editMovement?.id) return;
    let cancelled = false;
    const load = async () => {
      setLoadingEdit(true);
      try {
        const rpo = await reportPoSupplierService.getByMovementId(editMovement.id);
        if (cancelled || !rpo) return;
        setEditReportId(rpo.id);
        const fmtDate = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';
        setForm({
          supplierId: rpo.supplierId || editMovement.supplierId || '',
          no_po: rpo.no_po || '', spesifikasi: rpo.spesifikasi || '',
          itemId: rpo.itemId || '',
          qty_po: rpo.qty_po != null ? String(rpo.qty_po) : '',
          harga_pcs: rpo.harga_pcs != null ? String(Number(rpo.harga_pcs)) : '',
          tanggal_kirim: fmtDate(rpo.tanggal_kirim),
          no_surat_jalan: rpo.no_surat_jalan || '',
          qty_kirim: rpo.qty_kirim != null ? String(rpo.qty_kirim) : '',
          no_kwitansi: rpo.no_kwitansi || '', no_invoice: rpo.no_invoice || '',
          no_faktur_pajak: rpo.no_faktur_pajak || '',
          tanggal_faktur_pajak: fmtDate(rpo.tanggal_faktur_pajak),
          dpp: '', ppn: '',
          tanggal_ttf: fmtDate(rpo.tanggal_ttf),
          tanggal_jatuh_tempo: fmtDate(rpo.tanggal_jatuh_tempo),
          tanggal_payment_list: fmtDate(rpo.tanggal_payment_list),
          tanggal_dibayar: fmtDate(rpo.tanggal_dibayar),
          total_dibayar: rpo.total_dibayar != null ? String(Number(rpo.total_dibayar)) : '',
        });
        if (rpo.no_po) setPoMode('lama');
        if (rpo.item) {
          setItemOptions([{ id: rpo.itemId, label: `${rpo.item.plu || ''} — ${rpo.item.nama_barang || ''}`, ppn: rpo.item.itemPrice?.ppn ?? 0 }]);
          setPpnRate(rpo.item.itemPrice?.ppn ? Number(rpo.item.itemPrice.ppn) : 0);
        }
      } catch (e) {
        console.error('Failed to load edit data:', e);
        setFormError('Gagal memuat data untuk edit');
      } finally {
        setLoadingEdit(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [editMovement]);

  const { searchResults: supplierResults = [], loading: supplierSearchLoading, searchSuppliers } = useSupplierSearch();
  const supplierOptions = useMemo(() => supplierResults.map((s) => ({ id: s.id, label: s.name, code: s.code })), [supplierResults]);
  const companyId = useMemo(() => authService.getCompanyData()?.id || '', []);

  /* helpers */
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setNum = (k, v) => setForm((p) => ({ ...p, [k]: v.replace(/[^0-9.]/g, '') }));

  /* computed */
  const qtyPo = parseFloat(form.qty_po) || 0;
  const hargaPcs = parseFloat(form.harga_pcs) || 0;
  const qtyKirim = parseFloat(form.qty_kirim) || 0;
  const total = qtyPo * hargaPcs;
  const maxQtyKirim = qtyPo > 0 ? qtyPo - previousDeliveredQty : Infinity;
  const qtySisaPo = qtyPo - qtyKirim - previousDeliveredQty;
  const dppVal = hargaPcs * qtyKirim;
  const ppnVal = dppVal * ppnRate / 100;
  const totalInvoice = dppVal + ppnVal;
  const totalDibayar = parseFloat(form.total_dibayar) || 0;
  const selisih = totalInvoice - totalDibayar;

  const handleSupplierSelect = useCallback((e) => {
    const val = e?.target?.value || e;
    set('supplierId', val);
    fetchSupplierPrice(val, form.itemId);
  }, [fetchSupplierPrice, form.itemId]);

  /* ── PO search ── */
  const handlePoSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setPoResults([]); return; }
    setPoLoading(true);
    try {
      const results = await reportPoSupplierService.searchPo(q);
      setPoResults(Array.isArray(results) ? results.map((r) => ({
        id: `${r.no_po}__${r.itemId}`,
        label: `${r.no_po} — ${r.itemName}`,
        ...r,
      })) : []);
    } catch { /* ignore */ } finally { setPoLoading(false); }
  }, []);

  const handlePoSelect = useCallback((e) => {
    const val = e?.target?.value || e;
    if (!val) return;
    const po = poResults.find((p) => p.id === val);
    if (!po) return;
    setSelectedPo(po);
    setPreviousDeliveredQty(po.total_qty_kirim || 0);
    setPpnRate(po.ppn_rate || 0);
    setForm((prev) => ({
      ...prev,
      no_po: po.no_po, supplierId: po.supplierId, itemId: po.itemId,
      qty_po: String(po.qty_po || ''), harga_pcs: String(po.harga_pcs || ''),
      spesifikasi: po.spesifikasi || '',
    }));
    setItemOptions([{ id: po.itemId, label: `${po.itemPlu} — ${po.itemName}` }]);
  }, [poResults]);

  const resetPoFields = useCallback(() => {
    setSelectedPo(null);
    setPreviousDeliveredQty(0);
    setItemOptions([]);
    setForm((p) => ({ ...p, no_po: '', itemId: '', qty_po: '', harga_pcs: '', spesifikasi: '' }));
  }, []);

  /* ── Item search ── */
  const handleItemSearch = useCallback(async (q) => {
    if (!q || q.length < 1) return;
    setItemLoading(true);
    try {
      const res = await searchItems(q, 1, 20);
      const items = res?.data?.data || res?.data || [];
      setItemOptions(Array.isArray(items) ? items.map((i) => ({
        id: i.id, label: `${i.plu} — ${i.nama_barang}`, ppn: i.itemPrice?.ppn ?? 0,
      })) : []);
    } catch { /* ignore */ } finally { setItemLoading(false); }
  }, []);

  const handleItemSelect = useCallback((e) => {
    const val = e?.target?.value || e;
    set('itemId', val);
    const selected = itemOptions.find((o) => o.id === val);
    if (selected?.ppn != null) setPpnRate(Number(selected.ppn));
    fetchSupplierPrice(form.supplierId, val);
  }, [itemOptions, fetchSupplierPrice, form.supplierId]);

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.supplierId) { setFormError('Supplier harus dipilih'); return; }
    if (!form.itemId) { setFormError('Item harus dipilih'); return; }
    if (!qtyKirim || qtyKirim <= 0) { setFormError('Qty Kirim harus > 0'); return; }
    if (qtyPo > 0 && qtyKirim > maxQtyKirim) { setFormError(`Qty Kirim tidak boleh melebihi Qty Sisa PO (${fmt(maxQtyKirim)})`); return; }
    if (!companyId) { setFormError('Company tidak ditemukan, silakan login ulang'); return; }

    setIsSubmitting(true);
    try {
      if (isEdit && editReportId) {
        // Update existing ReportPoSupplier tagihan fields
        await reportPoSupplierService.updateTagihan(editReportId, {
          no_kwitansi: form.no_kwitansi || null,
          no_invoice: form.no_invoice || null,
          no_faktur_pajak: form.no_faktur_pajak || null,
          tanggal_faktur_pajak: form.tanggal_faktur_pajak || null,
          dpp: dppVal || null,
          ppn: ppnVal || null,
          total_invoice: totalInvoice || null,
          tanggal_ttf: form.tanggal_ttf || null,
          tanggal_jatuh_tempo: form.tanggal_jatuh_tempo || null,
          tanggal_payment_list: form.tanggal_payment_list || null,
          tanggal_dibayar: form.tanggal_dibayar || null,
          total_dibayar: totalDibayar || null,
          selisih: selisih || null,
        });
        toastService.success('Stock In berhasil diperbarui');
      } else {
        await createStockIn({
          companyId, supplierId: form.supplierId,
          no_po: form.no_po || undefined, spesifikasi: form.spesifikasi || undefined,
          itemId: form.itemId, qty_po: qtyPo || undefined, harga_pcs: hargaPcs || undefined,
          tanggal_kirim: form.tanggal_kirim || undefined, no_surat_jalan: form.no_surat_jalan || undefined,
          qty_kirim: qtyKirim,
          no_kwitansi: form.no_kwitansi || undefined, no_invoice: form.no_invoice || undefined,
          no_faktur_pajak: form.no_faktur_pajak || undefined, tanggal_faktur_pajak: form.tanggal_faktur_pajak || undefined,
          dpp: dppVal || undefined, ppn: ppnVal || undefined, total_invoice: totalInvoice || undefined,
          tanggal_ttf: form.tanggal_ttf || undefined, tanggal_jatuh_tempo: form.tanggal_jatuh_tempo || undefined,
          tanggal_payment_list: form.tanggal_payment_list || undefined, tanggal_dibayar: form.tanggal_dibayar || undefined,
          total_dibayar: totalDibayar || undefined, selisih: selisih || undefined,
        });
        toastService.success('Stock In berhasil disimpan');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setFormError(err?.message || 'Gagal menyimpan Stock In');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <div className='w-full max-w-[860px] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-900/10'>

        {/* ── Header ── */}
        <div className='flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3.5'>
          <h2 className='text-sm font-bold tracking-wide text-white'>{isEdit ? 'Edit Stock In' : 'Stock In'}</h2>
          <button type='button' onClick={onClose} className='rounded-lg p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white'>
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='max-h-[82vh] overflow-y-auto'>

          {/* ═══════════════════════════════════════════════════
             SECTION 1 — PO
             ═══════════════════════════════════════════════════ */}
          <div className='px-6 pt-4 pb-4'>
            <SectionHeader label='PO' color='blue' description='Data Purchase Order' />

            {/* Row 1: Supplier + No PO + Spesifikasi */}
            <div className='grid gap-x-4 gap-y-3 sm:grid-cols-12'>
              <div className='sm:col-span-5'>
                <Label required>Nama Supplier</Label>
                <Autocomplete
                  name='supplierId' options={supplierOptions} value={form.supplierId}
                  onChange={handleSupplierSelect}
                  placeholder='Cari supplier...' displayKey='label' valueKey='id'
                  loading={supplierSearchLoading}
                  onSearch={async (q) => { try { await searchSuppliers(q, 1, 20); } catch {} }}
                  showId disabled={isEdit || (poMode === 'lama' && !!selectedPo)}
                />
              </div>
              <div className='sm:col-span-4'>
                <div className='flex items-end justify-between'>
                  <Label>No PO</Label>
                  {!isEdit && <div className='mb-1 flex gap-1'>
                    <PoModeButton active={poMode === 'baru'} onClick={() => { setPoMode('baru'); resetPoFields(); }}>Baru</PoModeButton>
                    <PoModeButton active={poMode === 'lama'} onClick={() => { setPoMode('lama'); setForm((p) => ({ ...p, no_po: '' })); }}>Lama</PoModeButton>
                  </div>}
                </div>
                {poMode === 'baru' ? (
                  <Input value={form.no_po} onChange={(e) => set('no_po', e.target.value)} placeholder='PO-2026-001' disabled={isEdit} />
                ) : (
                  <Autocomplete
                    name='no_po' options={poResults} value={selectedPo?.id || ''}
                    onChange={handlePoSelect} placeholder='Cari PO lama...' displayKey='label' valueKey='id'
                    loading={poLoading} onSearch={handlePoSearch}
                  />
                )}
              </div>
              <div className='sm:col-span-3'>
                <Label>Spesifikasi</Label>
                <Input value={form.spesifikasi} onChange={(e) => set('spesifikasi', e.target.value)} placeholder='Varian / ket' disabled={isEdit} />
              </div>
            </div>

            {/* Row 2: Item (full width) */}
            <div className='mt-3'>
              <Label required>Item</Label>
              <Autocomplete
                name='itemId' options={itemOptions} value={form.itemId}
                onChange={handleItemSelect} placeholder='Cari item (PLU / nama barang)...' displayKey='label' valueKey='id'
                loading={itemLoading} onSearch={handleItemSearch}
                disabled={isEdit || (poMode === 'lama' && !!selectedPo)}
              />
            </div>

            {/* Row 3: Qty PO + Harga + Total + blank */}
            <div className='mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-4'>
              <div>
                <Label>Qty PO (PCS)</Label>
                <Input value={form.qty_po} onChange={(e) => setNum('qty_po', e.target.value)} placeholder='1.000' inputMode='numeric' disabled={isEdit} />
              </div>
              <div>
                <Label>Harga / PCS</Label>
                <Input value={form.harga_pcs} onChange={(e) => setNum('harga_pcs', e.target.value)} placeholder='15.000' inputMode='decimal' disabled={isEdit} />
              </div>
              <ReadOnly label='Total PO' value={fmt(total)} />
              <div>{/* spacer */}</div>
            </div>
          </div>

          <div className='mx-6 border-t border-gray-100' />

          {/* ═══════════════════════════════════════════════════
             SECTION 2 — Barang Masuk
             ═══════════════════════════════════════════════════ */}
          <div className='px-6 pt-4 pb-4'>
            <SectionHeader label='Barang Masuk' color='green' description='Data pengiriman barang' />

            <div className='grid gap-x-4 gap-y-3 sm:grid-cols-4'>
              <div>
                <Label>Tanggal Kirim</Label>
                <Input type='date' value={form.tanggal_kirim} onChange={(e) => set('tanggal_kirim', e.target.value)} disabled={isEdit} />
              </div>
              <div>
                <Label>No. Surat Jalan</Label>
                <Input value={form.no_surat_jalan} onChange={(e) => set('no_surat_jalan', e.target.value)} placeholder='SJ-2026-001' disabled={isEdit} />
              </div>
              <div>
                <Label required>Qty Kirim</Label>
                <Input value={form.qty_kirim} onChange={(e) => setNum('qty_kirim', e.target.value)} placeholder='500' inputMode='numeric'
                  max={maxQtyKirim !== Infinity ? maxQtyKirim : undefined} disabled={isEdit} />
                {qtyPo > 0 && qtyKirim > maxQtyKirim && (
                  <p className='mt-0.5 text-[10px] font-medium text-red-500'>Melebihi sisa PO ({fmt(maxQtyKirim)})</p>
                )}
              </div>
              <ReadOnly label='Qty Sisa PO' value={fmt(qtySisaPo)} />
            </div>
          </div>

          <div className='mx-6 border-t border-gray-100' />

          {/* ═══════════════════════════════════════════════════
             SECTION 3 — Tagihan
             ═══════════════════════════════════════════════════ */}
          <div className='px-6 pt-4 pb-4'>
            <SectionHeader label='Tagihan' color='amber' description='Data faktur & pembayaran' />

            {/* Row 1 */}
            <div className='grid gap-x-4 gap-y-3 sm:grid-cols-4'>
              <div>
                <Label>No Kwitansi</Label>
                <Input value={form.no_kwitansi} onChange={(e) => set('no_kwitansi', e.target.value)} placeholder='KW-2026-001' />
              </div>
              <div>
                <Label>No Invoice</Label>
                <Input value={form.no_invoice} onChange={(e) => set('no_invoice', e.target.value)} placeholder='INV-2026-001' />
              </div>
              <div className='sm:col-span-2'>
                <Label>No Faktur Pajak</Label>
                <Input value={form.no_faktur_pajak} onChange={(e) => set('no_faktur_pajak', e.target.value)} placeholder='010.000-26.00000001' />
              </div>
            </div>

            {/* Row 2 */}
            <div className='mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-4'>
              <div>
                <Label>Tgl Faktur Pajak</Label>
                <Input type='date' value={form.tanggal_faktur_pajak} onChange={(e) => set('tanggal_faktur_pajak', e.target.value)} />
              </div>
              <ReadOnly label='DPP' value={fmt(dppVal)} />
              <ReadOnly label={`PPN (${ppnRate}%)`} value={fmt(ppnVal)} />
              <ReadOnly label='Total Invoice' value={fmt(totalInvoice)} />
            </div>

            {/* Row 3 */}
            <div className='mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-4'>
              <div>
                <Label>Tgl TTF</Label>
                <Input type='date' value={form.tanggal_ttf} onChange={(e) => set('tanggal_ttf', e.target.value)} />
              </div>
              <div>
                <Label>Tgl Jatuh Tempo</Label>
                <Input type='date' value={form.tanggal_jatuh_tempo} onChange={(e) => set('tanggal_jatuh_tempo', e.target.value)} />
              </div>
              <div>
                <Label>Tgl Payment List</Label>
                <Input type='date' value={form.tanggal_payment_list} onChange={(e) => set('tanggal_payment_list', e.target.value)} />
              </div>
              <div>
                <Label>Tgl Dibayar</Label>
                <Input type='date' value={form.tanggal_dibayar} onChange={(e) => set('tanggal_dibayar', e.target.value)} />
              </div>
            </div>

            {/* Row 4 */}
            <div className='mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-4'>
              <div>
                <Label>Total Dibayar</Label>
                <Input value={form.total_dibayar} onChange={(e) => setNum('total_dibayar', e.target.value)} placeholder='8.325.000' inputMode='decimal' />
              </div>
              <ReadOnly label='Selisih' value={fmt(selisih)} />
              <div /><div />
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
            <button type='button' onClick={onClose}
              className='rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50'>
              Batal
            </button>
            <button type='submit' disabled={isSubmitting}
              className='rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50'>
              {isSubmitting ? (
                <span className='flex items-center gap-2'>
                  <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  Menyimpan...
                </span>
              ) : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStockInModal;
