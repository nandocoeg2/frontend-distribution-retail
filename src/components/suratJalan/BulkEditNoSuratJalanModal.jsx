import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDaysIcon,
  CheckIcon,
  PencilSquareIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export const ROMAN_MONTHS = [
  { value: 'I', label: 'I - Januari' },
  { value: 'II', label: 'II - Februari' },
  { value: 'III', label: 'III - Maret' },
  { value: 'IV', label: 'IV - April' },
  { value: 'V', label: 'V - Mei' },
  { value: 'VI', label: 'VI - Juni' },
  { value: 'VII', label: 'VII - Juli' },
  { value: 'VIII', label: 'VIII - Agustus' },
  { value: 'IX', label: 'IX - September' },
  { value: 'X', label: 'X - Oktober' },
  { value: 'XI', label: 'XI - November' },
  { value: 'XII', label: 'XII - Desember' },
];

/**
 * Replaces the roman month (and optional year) in standard surat jalan format:
 * [company]/[seq]/SJ/[group]/[romanMonth]/[year]
 */
export const replaceMonthInSuratJalan = (rawNo = '', targetMonth = '', targetYear = '') => {
  if (!rawNo) return '';
  const parts = rawNo.split('/');
  if (parts.length === 6) {
    const updated = [...parts];
    if (targetMonth) updated[4] = targetMonth;
    if (targetYear) updated[5] = targetYear;
    return updated.join('/');
  }

  // Fallback if format is different but contains month
  return rawNo;
};

const BulkEditNoSuratJalanModal = ({
  isOpen,
  onClose,
  items = [],
  onSubmit,
  isSubmitting = false,
}) => {
  // Global controls
  const [selectedMonth, setSelectedMonth] = useState('IX');
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()).slice(-2)
  );

  // Map of { [id]: new_no_surat_jalan }
  const [editedNumbers, setEditedNumbers] = useState({});

  // Initialize or reset when modal opens or items change
  useEffect(() => {
    if (isOpen && items.length > 0) {
      const initialMap = {};
      // Detect most common month from items if available
      let detectedMonth = 'I';
      let detectedYear = String(new Date().getFullYear()).slice(-2);

      const firstItemNo = items[0]?.no_surat_jalan || '';
      const firstParts = firstItemNo.split('/');
      if (firstParts.length === 6) {
        detectedMonth = firstParts[4] || 'I';
        detectedYear = firstParts[5] || detectedYear;
      }

      setSelectedMonth(detectedMonth);
      setSelectedYear(detectedYear);

      items.forEach((item) => {
        if (item?.id) {
          initialMap[item.id] = item.no_surat_jalan || '';
        }
      });
      setEditedNumbers(initialMap);
    }
  }, [isOpen, items]);

  const handleApplyToAll = () => {
    const updatedMap = {};
    items.forEach((item) => {
      if (item?.id) {
        const originalNo = item.no_surat_jalan || '';
        updatedMap[item.id] = replaceMonthInSuratJalan(
          originalNo,
          selectedMonth,
          selectedYear
        );
      }
    });
    setEditedNumbers(updatedMap);
  };

  const handleResetToOriginal = () => {
    const originalMap = {};
    items.forEach((item) => {
      if (item?.id) {
        originalMap[item.id] = item.no_surat_jalan || '';
      }
    });
    setEditedNumbers(originalMap);
  };

  const handleSingleNumberChange = (id, value) => {
    setEditedNumbers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const changedCount = useMemo(() => {
    let count = 0;
    items.forEach((item) => {
      if (item?.id && editedNumbers[item.id] !== item.no_surat_jalan) {
        count++;
      }
    });
    return count;
  }, [items, editedNumbers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payloadItems = items.map((item) => ({
      id: item.id,
      no_surat_jalan: (editedNumbers[item.id] || item.no_surat_jalan || '').trim(),
    }));
    onSubmit?.(payloadItems);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500/75 backdrop-blur-xs transition-opacity"
          onClick={!isSubmitting ? onClose : undefined}
          aria-hidden="true"
        />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block w-full max-w-4xl transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:align-middle">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-600 p-2 text-white shadow-xs">
                <PencilSquareIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Ganti Bulan / Edit Nomor Surat Jalan
                </h3>
                <p className="text-xs text-gray-500">
                  Ubah bulan romawi atau edit nomor surat jalan untuk {items.length} data yang dipilih
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Quick Bulk Change Month Bar */}
            <div className="border-b border-gray-200 bg-gray-50/80 px-6 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                    Ganti Bulan Massal:
                  </span>

                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {ROMAN_MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Tahun:</span>
                    <input
                      type="text"
                      maxLength={2}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value.replace(/[^0-9]/g, ''))}
                      disabled={isSubmitting}
                      placeholder="26"
                      className="w-12 rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-xs font-bold text-gray-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyToAll}
                    disabled={isSubmitting}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
                  >
                    <CheckIcon className="mr-1 h-3.5 w-3.5" />
                    Terapkan ke Semua ({items.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ArrowPathIcon className="mr-1 h-3 w-3" />
                  Reset
                </button>
              </div>
            </div>

            {/* Table of selected items */}
            <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg text-xs">
                <thead className="bg-gray-100/80 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-center font-semibold text-gray-600 uppercase w-10">
                      No
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">
                      Deliver To / Customer
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">
                      No. SJ Saat Ini
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-semibold text-blue-700 uppercase">
                      No. SJ Baru
                    </th>
                    <th scope="col" className="px-3 py-2 text-center font-semibold text-gray-600 uppercase w-20">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {items.map((item, index) => {
                    const currentVal = editedNumbers[item.id] ?? item.no_surat_jalan ?? '';
                    const isChanged = currentVal !== (item.no_surat_jalan || '');
                    const customerName =
                      item.deliver_to ||
                      item.deliverTo ||
                      item.purchaseOrder?.customer?.namaCustomer ||
                      '-';

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isChanged ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-2 text-center text-gray-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-gray-800 font-medium">
                          <div className="truncate max-w-[200px]" title={customerName}>
                            {customerName}
                          </div>
                          {item.purchaseOrder?.po_number && (
                            <div className="text-[10px] text-gray-500">
                              PO: {item.purchaseOrder.po_number}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-600">
                          {item.no_surat_jalan || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={currentVal}
                            onChange={(e) => handleSingleNumberChange(item.id, e.target.value)}
                            disabled={isSubmitting}
                            className={`w-full rounded border px-2.5 py-1 font-mono text-xs font-semibold focus:outline-none focus:ring-1 ${
                              isChanged
                                ? 'border-blue-500 bg-blue-50/60 text-blue-800 focus:ring-blue-500'
                                : 'border-gray-300 bg-white text-gray-800 focus:ring-gray-400'
                            }`}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {isChanged ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              Berubah
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                              Tetap
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3.5">
              <div className="text-xs text-gray-600">
                <span className="font-bold text-blue-700">{changedCount}</span> dari{' '}
                <span className="font-bold text-gray-800">{items.length}</span> nomor surat jalan akan diperbarui.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || changedCount === 0}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Menyimpan...
                    </>
                  ) : (
                    `Simpan Perubahan (${changedCount})`
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkEditNoSuratJalanModal;
