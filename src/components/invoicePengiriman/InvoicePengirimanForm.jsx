import React, { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import toastService from '../../services/toastService';
import { formatCurrency } from '../../utils/formatUtils';

const formatNumber = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const enrichInvoiceDetails = (invoice) => {
  if (!invoice) return [];
  const details = invoice.invoiceDetails || [];
  const poDetails = invoice.purchaseOrder?.purchaseOrderDetails || [];

  const poByItemId = new Map();
  const poByPlu = new Map();
  const poByName = new Map();

  for (const poItem of poDetails) {
    if (poItem.itemId) poByItemId.set(String(poItem.itemId), poItem);
    const pluKey = (poItem.plu || poItem.PLU || '').trim().toLowerCase();
    if (pluKey) poByPlu.set(pluKey, poItem);
    const nameKey = (poItem.nama_barang || '').trim().toLowerCase();
    if (nameKey) poByName.set(nameKey, poItem);
  }

  return details.map((item) => {
    const itemPlu = (item.PLU || item.plu || '').trim().toLowerCase();
    const itemName = (item.nama_barang || '').trim().toLowerCase();
    const itemIdStr = item.itemId ? String(item.itemId) : '';

    const matchedPo =
      (itemIdStr && poByItemId.get(itemIdStr)) ||
      (itemPlu && poByPlu.get(itemPlu)) ||
      (itemName && poByName.get(itemName)) ||
      null;

    const potA =
      item.potongan_a ??
      item.potonganA ??
      matchedPo?.potongan_a ??
      item.discount_percentage ??
      item.discountPercentage ??
      0;
    const potB = item.potongan_b ?? item.potonganB ?? matchedPo?.potongan_b ?? 0;
    const vatRate =
      item.PPN_pecentage ??
      item.ppn_percentage ??
      item.vatRate ??
      matchedPo?.vatRate ??
      invoice.ppn_percentage ??
      11;

    return {
      id: item.id,
      itemId: item.itemId,
      plu: item.PLU || item.plu || '',
      nama_barang: item.nama_barang || '',
      quantity: item.quantity ?? item.qty ?? 0,
      satuan: item.satuan || 'PCS',
      harga: Number(item.harga) || 0,
      potongan_a: Number(potA) || 0,
      potongan_b: Number(potB) || 0,
      vatRate: Number(vatRate) || 11,
    };
  });
};

const calculateRow = (item) => {
  const qty = item.quantity === '' ? 0 : Number(item.quantity) || 0;
  const harga = item.harga === '' ? 0 : Number(item.harga) || 0;
  const potA = item.potongan_a === '' ? 0 : Number(item.potongan_a) || 0;
  const potB = item.potongan_b === '' ? 0 : Number(item.potongan_b) || 0;
  const vatRate = item.vatRate === '' ? 0 : Number(item.vatRate ?? 11) || 0;

  const hargaPotA = potA > 0 ? Number((harga * (1 - potA / 100)).toFixed(2)) : harga;
  const hargaPotB = potB > 0 ? Number((hargaPotA * (1 - potB / 100)).toFixed(2)) : hargaPotA;
  const subtotal = Number((qty * harga).toFixed(2));
  const total = Number((qty * hargaPotB).toFixed(2));
  const discountRupiah = Number((subtotal - total).toFixed(2));
  const ppnRupiah = Number(((total * vatRate) / 100).toFixed(2));
  const grandTotal = Number((total + ppnRupiah).toFixed(2));

  return {
    ...item,
    qty,
    harga,
    potA,
    potB,
    vatRate,
    hargaPotA,
    hargaPotB,
    subtotal,
    total,
    discountRupiah,
    ppnRupiah,
    grandTotal,
  };
};

const InvoicePengirimanForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  formId,
}) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (initialValues) {
      setItems(enrichInvoiceDetails(initialValues));
    } else {
      setItems([]);
    }
  }, [initialValues]);

  const calculatedItems = useMemo(() => {
    return items.map(calculateRow);
  }, [items]);

  const totals = useMemo(() => {
    const totalQty = calculatedItems.reduce((sum, it) => sum + it.qty, 0);
    const subTotal = calculatedItems.reduce((sum, it) => sum + it.subtotal, 0);
    const totalPrice = calculatedItems.reduce((sum, it) => sum + it.total, 0);
    const totalDiscount = Math.max(Number((subTotal - totalPrice).toFixed(2)), 0);
    const totalPpn = calculatedItems.reduce((sum, it) => sum + it.ppnRupiah, 0);
    const grandTotal = Number((totalPrice + totalPpn).toFixed(2));
    const ppnPercentage =
      calculatedItems.length > 0 ? calculatedItems[0].vatRate : 11;

    return {
      totalQty,
      subTotal: Number(subTotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      totalPrice: Number(totalPrice.toFixed(2)),
      totalPpn: Number(totalPpn.toFixed(2)),
      grandTotal,
      ppnPercentage,
    };
  }, [calculatedItems]);

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value === '' ? '' : value,
      };
      return updated;
    });
  };

  const recalculateFinancials = () => {
    setItems((prev) => [...prev]);
    toastService.info(
      'Nilai finansial dihitung otomatis. Silakan simpan untuk menerapkan.'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSubmit) return;

    if (calculatedItems.length === 0) {
      toastService.error('Invoice tidak memiliki detail item.');
      return;
    }

    const payload = {
      ...(initialValues || {}),
      sub_total: totals.subTotal,
      total_discount: totals.totalDiscount,
      total_price: totals.totalPrice,
      ppn_percentage: totals.ppnPercentage,
      ppnRupiah: totals.totalPpn,
      grand_total: totals.grandTotal,
      invoiceDetails: calculatedItems.map((item) => ({
        ...(item.id ? { id: item.id } : {}),
        ...(item.itemId ? { itemId: item.itemId } : {}),
        PLU: item.plu || '',
        nama_barang: item.nama_barang || '',
        quantity: Math.round(item.qty),
        satuan: item.satuan || 'PCS',
        harga: item.harga,
        discount_percentage: item.potA,
        discount_rupiah: item.discountRupiah,
        dasar_pengenaan_pajak: item.total,
        total: item.total,
        PPN_pecentage: item.vatRate,
        ppnRupiah: item.ppnRupiah,
        potongan_a: item.potA,
        potongan_b: item.potB,
        harga_after_potongan_a: item.hargaPotA,
        harga_after_potongan_b: item.hargaPotB,
      })),
    };

    onSubmit(payload);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <section>
        {/* Header section */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Rincian Finansial
            </h3>
            <p className="text-sm text-gray-500">
              Pastikan nilai sesuai dengan dokumen dan perhitungan pajak.
            </p>
          </div>
          <button
            type="button"
            onClick={recalculateFinancials}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
            disabled={isSubmitting}
          >
            <ArrowPathIcon className="h-4 w-4" /> Hitung otomatis
          </button>
        </div>

        {/* 3 Summary Cards */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
              Grand Total
            </p>
            <p className="mt-2 text-xl font-bold text-blue-700">
              {formatCurrency(totals.grandTotal)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Total Harga (setelah diskon)
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-800">
              {formatCurrency(totals.totalPrice)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              PPN
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-800">
              {formatCurrency(totals.totalPpn)} ({totals.ppnPercentage}% )
            </p>
          </div>
        </div>

        {/* Editable Details Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] border border-gray-200 rounded bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-xs table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider w-24">
                  PLU
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider w-52">
                  Nama Barang
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-20">
                  QTY
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider w-16">
                  Satuan
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-28">
                  Harga
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-24">
                  Pot A
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-28">
                  Harga Pot A
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-24">
                  Pot B
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-28">
                  Harga Pot B
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-28">
                  Total
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-24">
                  PPN Rp
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider w-32">
                  Grand Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {calculatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="py-4 text-center text-xs text-gray-500"
                  >
                    Tidak ada detail barang
                  </td>
                </tr>
              ) : (
                calculatedItems.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    {/* PLU (Readonly) */}
                    <td className="px-2 py-1 whitespace-nowrap text-gray-900">
                      <span className="truncate block" title={item.plu}>
                        {item.plu || '-'}
                      </span>
                    </td>

                    {/* Nama Barang (Readonly) */}
                    <td className="px-2 py-1 text-gray-900">
                      <span
                        className="truncate block max-w-[200px]"
                        title={item.nama_barang}
                      >
                        {item.nama_barang || '-'}
                      </span>
                    </td>

                    {/* QTY (Editable) */}
                    <td className="px-1.5 py-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', e.target.value)
                        }
                        disabled={isSubmitting}
                        className="w-full text-right px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </td>

                    {/* Satuan (Readonly) */}
                    <td className="px-2 py-1 whitespace-nowrap text-gray-600">
                      {item.satuan || '-'}
                    </td>

                    {/* Harga (Editable) */}
                    <td className="px-1.5 py-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.harga}
                        onChange={(e) =>
                          handleItemChange(index, 'harga', e.target.value)
                        }
                        disabled={isSubmitting}
                        className="w-full text-right px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                      />
                    </td>

                    {/* Pot A (Editable) */}
                    <td className="px-1.5 py-1">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.potongan_a}
                          onChange={(e) =>
                            handleItemChange(index, 'potongan_a', e.target.value)
                          }
                          disabled={isSubmitting}
                          className="w-full text-right pr-4 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                        />
                        <span className="absolute right-1 top-1 text-xs text-gray-400 pointer-events-none">
                          %
                        </span>
                      </div>
                    </td>

                    {/* Harga Pot A (Readonly, Auto-calculate) */}
                    <td className="px-2 py-1 text-right text-gray-700 whitespace-nowrap font-mono bg-gray-50/50">
                      {formatNumber(item.hargaPotA)}
                    </td>

                    {/* Pot B (Editable) */}
                    <td className="px-1.5 py-1">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.potongan_b}
                          onChange={(e) =>
                            handleItemChange(index, 'potongan_b', e.target.value)
                          }
                          disabled={isSubmitting}
                          className="w-full text-right pr-4 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                        />
                        <span className="absolute right-1 top-1 text-xs text-gray-400 pointer-events-none">
                          %
                        </span>
                      </div>
                    </td>

                    {/* Harga Pot B (Readonly, Auto-calculate) */}
                    <td className="px-2 py-1 text-right text-gray-700 whitespace-nowrap font-mono bg-gray-50/50">
                      {formatNumber(item.hargaPotB)}
                    </td>

                    {/* Total / DPP (Readonly, Auto-calculate) */}
                    <td className="px-2 py-1 text-right text-gray-800 whitespace-nowrap font-mono bg-gray-50/50">
                      {formatNumber(item.total)}
                    </td>

                    {/* PPN Rp (Readonly, Auto-calculate) */}
                    <td className="px-2 py-1 text-right text-gray-800 whitespace-nowrap font-mono bg-gray-50/50">
                      {formatNumber(item.ppnRupiah)}
                    </td>

                    {/* Grand Total (Readonly, Auto-calculate) */}
                    <td className="px-2 py-1 text-right font-semibold text-gray-900 whitespace-nowrap font-mono bg-gray-50/50">
                      {formatNumber(item.grandTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {calculatedItems.length > 0 && (
              <tfoot className="bg-gray-100 font-bold sticky bottom-0 border-t border-gray-300 z-10">
                <tr>
                  <td colSpan={2} className="px-2 py-1 text-left text-xs">
                    Total
                  </td>
                  <td className="px-2 py-1 text-right text-xs font-mono">
                    {formatNumber(totals.totalQty)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs text-gray-400">
                    -
                  </td>
                  <td className="px-2 py-1 text-center text-xs text-gray-400">
                    -
                  </td>
                  <td className="px-2 py-1 text-center text-xs text-gray-400">
                    -
                  </td>
                  <td className="px-2 py-1 text-center text-xs text-gray-400">
                    -
                  </td>
                  <td className="px-2 py-1 text-center text-xs text-gray-400">
                    -
                  </td>
                  <td className="px-2 py-1 text-center text-xs text-gray-400">
                    -
                  </td>
                  <td className="px-2 py-1 text-right text-xs font-mono">
                    {formatNumber(totals.totalPrice)}
                  </td>
                  <td className="px-2 py-1 text-right text-xs font-mono">
                    {formatNumber(totals.totalPpn)}
                  </td>
                  <td className="px-2 py-1 text-right text-xs font-mono font-bold text-blue-700">
                    {formatNumber(totals.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </form>
  );
};

export default InvoicePengirimanForm;
