import { useEffect, useState, useMemo, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import useSupplierSearch from '../../hooks/useSupplierSearch';
import { searchItems } from '../../services/itemService';

const initialForm = {
  supplierId: '', no_po: '', itemIds: [], spesifikasi: '',
  qty_po_pcs: '', harga_pcs: '',
  tanggal_kirim: '', no_surat_jalan: '', qty_kirim: '',
  no_kwitansi: '', no_invoice: '', no_faktur_pajak: '',
  tanggal_faktur_pajak: '', dpp: '', ppn: '',
  tanggal_ttf: '', tanggal_jatuh_tempo: '', tanggal_payment_list: '',
  tanggal_dibayar: '', total_dibayar: '',
};

const buildForm = (data) => {
  if (!data) return { ...initialForm };
  const f = { ...initialForm };
  f.supplierId = data.supplierId || data.supplier?.id || '';
  f.no_po = data.no_po || '';
  f.itemIds = data.items?.map((i) => i.itemId || i.item?.id) || [];
  f.spesifikasi = data.spesifikasi || '';
  f.qty_po_pcs = data.qty_po_pcs != null ? String(data.qty_po_pcs) : '';
  f.harga_pcs = data.harga_pcs != null ? String(data.harga_pcs) : '';
  f.tanggal_kirim = data.tanggal_kirim ? data.tanggal_kirim.slice(0, 10) : '';
  f.no_surat_jalan = data.no_surat_jalan || '';
  f.qty_kirim = data.qty_kirim != null ? String(data.qty_kirim) : '';
  f.no_kwitansi = data.no_kwitansi || '';
  f.no_invoice = data.no_invoice || '';
  f.no_faktur_pajak = data.no_faktur_pajak || '';
  f.tanggal_faktur_pajak = data.tanggal_faktur_pajak ? data.tanggal_faktur_pajak.slice(0, 10) : '';
  f.dpp = data.dpp != null ? String(data.dpp) : '';
  f.ppn = data.ppn != null ? String(data.ppn) : '';
  f.tanggal_ttf = data.tanggal_ttf ? data.tanggal_ttf.slice(0, 10) : '';
  f.tanggal_jatuh_tempo = data.tanggal_jatuh_tempo ? data.tanggal_jatuh_tempo.slice(0, 10) : '';
  f.tanggal_payment_list = data.tanggal_payment_list ? data.tanggal_payment_list.slice(0, 10) : '';
  f.tanggal_dibayar = data.tanggal_dibayar ? data.tanggal_dibayar.slice(0, 10) : '';
  f.total_dibayar = data.total_dibayar != null ? String(data.total_dibayar) : '';
  return f;
};

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const posNum = (v) => Math.max(0, num(v));

const groupColors = {
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700' },
  green: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700' },
  amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
};

// Defined outside component to prevent remount on every render
const Label = ({ children, required: req }) => (
  <label className='block text-[11px] font-medium text-gray-500 mb-0.5'>
    {children}{req && <span className='text-red-500'> *</span>}
  </label>
);
const Input = ({ value, onChange, placeholder, type = 'text', disabled = false, inputMode }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    inputMode={inputMode}
    className={`w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${disabled ? 'bg-gray-100 text-gray-500' : ''}`} />
);
const Computed = ({ value }) => (
  <input type='text' value={value} readOnly
    className='w-full rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-sm text-gray-600' />
);
const GroupHeader = ({ label, color }) => {
  const c = groupColors[color];
  return <div className={`mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${c.bg} ${c.text}`}>{label}</div>;
};

const ReportPoSupplierFormModal = ({ show, onClose, onSubmit, editData = null }) => {
  const isEdit = !!editData;
  const [form, setForm] = useState(() => buildForm(editData));
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supplier search
  const { searchResults: supplierResults = [], loading: supplierLoading, searchSuppliers } = useSupplierSearch();
  const supplierOptions = useMemo(() =>
    supplierResults.map((s) => ({ id: s.id, label: s.name, code: s.code })),
    [supplierResults]
  );

  // Item search
  const [itemOptions, setItemOptions] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);

  const handleItemSearch = useCallback(async (query) => {
    if (!query || query.length < 1) return;
    setItemLoading(true);
    try {
      const res = await searchItems(query, 1, 50);
      const items = res?.data?.data || res?.data || [];
      setItemOptions(items.map((i) => ({ id: i.id, name: i.nama_barang || i.plu || i.id })));
    } catch (e) { console.error(e); }
    finally { setItemLoading(false); }
  }, []);

  // Preload items on mount
  useEffect(() => {
    if (show) handleItemSearch('a');
  }, [show, handleItemSearch]);

  useEffect(() => {
    if (show) { setForm(buildForm(editData)); setFormError(''); setIsSubmitting(false); }
  }, [show, editData]);

  // Computed fields
  const total = posNum(form.qty_po_pcs) * posNum(form.harga_pcs);
  const qty_sisa_po = Math.max(0, posNum(form.qty_po_pcs) - posNum(form.qty_kirim));
  const total_invoice = posNum(form.dpp) + posNum(form.ppn);
  const selisih = total_invoice - posNum(form.total_dibayar);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const setNum = (key, val) => set(key, val.replace(/[^0-9.]/g, ''));

  const validate = () => {
    if (!form.supplierId) return 'Supplier wajib dipilih.';
    if (!form.no_po.trim()) return 'No PO wajib diisi.';
    if (!form.itemIds.length) return 'Minimal pilih satu item.';
    if (posNum(form.qty_po_pcs) <= 0 && form.qty_po_pcs !== '0') return 'Qty PO (PCS) wajib diisi.';
    if (posNum(form.harga_pcs) <= 0 && form.harga_pcs !== '0') return 'Harga (PCS) wajib diisi.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }

    const payload = {
      supplierId: form.supplierId,
      no_po: form.no_po.trim(),
      itemIds: form.itemIds,
      qty_po_pcs: posNum(form.qty_po_pcs),
      harga_pcs: posNum(form.harga_pcs),
    };
    if (form.spesifikasi.trim()) payload.spesifikasi = form.spesifikasi.trim();
    if (form.tanggal_kirim) payload.tanggal_kirim = form.tanggal_kirim;
    if (form.no_surat_jalan.trim()) payload.no_surat_jalan = form.no_surat_jalan.trim();
    if (form.qty_kirim !== '') payload.qty_kirim = posNum(form.qty_kirim);
    if (form.no_kwitansi.trim()) payload.no_kwitansi = form.no_kwitansi.trim();
    if (form.no_invoice.trim()) payload.no_invoice = form.no_invoice.trim();
    if (form.no_faktur_pajak.trim()) payload.no_faktur_pajak = form.no_faktur_pajak.trim();
    if (form.tanggal_faktur_pajak) payload.tanggal_faktur_pajak = form.tanggal_faktur_pajak;
    if (form.dpp !== '') payload.dpp = posNum(form.dpp);
    if (form.ppn !== '') payload.ppn = posNum(form.ppn);
    if (form.tanggal_ttf) payload.tanggal_ttf = form.tanggal_ttf;
    if (form.tanggal_jatuh_tempo) payload.tanggal_jatuh_tempo = form.tanggal_jatuh_tempo;
    if (form.tanggal_payment_list) payload.tanggal_payment_list = form.tanggal_payment_list;
    if (form.tanggal_dibayar) payload.tanggal_dibayar = form.tanggal_dibayar;
    if (form.total_dibayar !== '') payload.total_dibayar = posNum(form.total_dibayar);

    setFormError('');
    setIsSubmitting(true);
    try { await onSubmit(payload); onClose(); }
    catch (error) { setFormError(error?.message || 'Gagal menyimpan.'); }
    finally { setIsSubmitting(false); }
  };

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <div className='flex items-center justify-between border-b border-gray-200 bg-indigo-600 px-5 py-3 text-white'>
          <h2 className='text-base font-semibold'>{isEdit ? 'Edit' : 'Tambah'} Report PO Supplier</h2>
          <button type='button' onClick={onClose} className='rounded p-1 hover:bg-white/20 focus:outline-none' aria-label='Tutup'>
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='max-h-[85vh] overflow-y-auto'>
          {/* === GRUP PO === */}
          <div className='border-b border-blue-200 px-5 py-3'>
            <GroupHeader label='PO' color='blue' />
            <div className='grid gap-2 sm:grid-cols-4'>
              <div className='sm:col-span-2'>
                <Label required>Nama Supplier</Label>
                <Autocomplete name='supplierId' options={supplierOptions}
                  value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)}
                  placeholder='Cari supplier...' displayKey='label' valueKey='id'
                  loading={supplierLoading}
                  onSearch={async (q) => { try { await searchSuppliers(q, 1, 20); } catch(e) { console.error(e); } }}
                  showId />
              </div>
              <div>
                <Label required>No PO</Label>
                <Input value={form.no_po} onChange={(e) => set('no_po', e.target.value)} placeholder='PO-2026-001' />
              </div>
              <div>
                <Label>Spesifikasi</Label>
                <Input value={form.spesifikasi} onChange={(e) => set('spesifikasi', e.target.value)} placeholder='Varian Lavender' />
              </div>
            </div>
            <div className='mt-2'>
              <Label required>Item</Label>
              <AutocompleteCheckboxLimitTag name='itemIds' options={itemOptions}
                value={form.itemIds} onChange={(e) => set('itemIds', e.target.value)}
                placeholder='Cari item...' displayKey='name' valueKey='id'
                loading={itemLoading} onSearchChange={handleItemSearch}
                limitTags={3} size='small' />
            </div>
            <div className='mt-2 grid gap-2 sm:grid-cols-4'>
              <div>
                <Label required>Qty PO (PCS)</Label>
                <Input value={form.qty_po_pcs} onChange={(e) => setNum('qty_po_pcs', e.target.value)} placeholder='1000' inputMode='numeric' />
              </div>
              <div>
                <Label required>Harga (PCS)</Label>
                <Input value={form.harga_pcs} onChange={(e) => setNum('harga_pcs', e.target.value)} placeholder='15000' inputMode='decimal' />
              </div>
              <div>
                <Label>Total</Label>
                <Computed value={total.toLocaleString('id-ID')} />
              </div>
              <div />
            </div>
          </div>

          {/* === GRUP BARANG MASUK === */}
          <div className='border-b border-green-200 px-5 py-3'>
            <GroupHeader label='Barang Masuk' color='green' />
            <div className='grid gap-2 sm:grid-cols-4'>
              <div>
                <Label>Tanggal Kirim</Label>
                <Input type='date' value={form.tanggal_kirim} onChange={(e) => set('tanggal_kirim', e.target.value)} />
              </div>
              <div>
                <Label>No. Surat Jalan</Label>
                <Input value={form.no_surat_jalan} onChange={(e) => set('no_surat_jalan', e.target.value)} placeholder='SJ-2026-001' />
              </div>
              <div>
                <Label>Qty Kirim</Label>
                <Input value={form.qty_kirim} onChange={(e) => setNum('qty_kirim', e.target.value)} placeholder='500' inputMode='numeric' />
              </div>
              <div>
                <Label>Qty Sisa PO</Label>
                <Computed value={qty_sisa_po.toLocaleString('id-ID')} />
              </div>
            </div>
          </div>

          {/* === GRUP TAGIHAN === */}
          <div className='border-b border-amber-200 px-5 py-3'>
            <GroupHeader label='Tagihan' color='amber' />
            <div className='grid gap-2 sm:grid-cols-4'>
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
            </div>
            <div className='mt-2 grid gap-2 sm:grid-cols-4'>
              <div>
                <Label>Tgl Faktur Pajak</Label>
                <Input type='date' value={form.tanggal_faktur_pajak} onChange={(e) => set('tanggal_faktur_pajak', e.target.value)} />
              </div>
              <div>
                <Label>DPP</Label>
                <Input value={form.dpp} onChange={(e) => setNum('dpp', e.target.value)} placeholder='7500000' inputMode='decimal' />
              </div>
              <div>
                <Label>PPN</Label>
                <Input value={form.ppn} onChange={(e) => setNum('ppn', e.target.value)} placeholder='825000' inputMode='decimal' />
              </div>
              <div>
                <Label>Total Invoice</Label>
                <Computed value={total_invoice.toLocaleString('id-ID')} />
              </div>
            </div>
            <div className='mt-2 grid gap-2 sm:grid-cols-4'>
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
            <div className='mt-2 grid gap-2 sm:grid-cols-4'>
              <div>
                <Label>Total Dibayar</Label>
                <Input value={form.total_dibayar} onChange={(e) => setNum('total_dibayar', e.target.value)} placeholder='8325000' inputMode='decimal' />
              </div>
              <div>
                <Label>Selisih</Label>
                <Computed value={selisih.toLocaleString('id-ID')} />
              </div>
              <div />
              <div />
            </div>
          </div>

          {formError && (
            <div className='mx-5 my-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{formError}</div>
          )}

          <div className='flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3'>
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

export default ReportPoSupplierFormModal;
