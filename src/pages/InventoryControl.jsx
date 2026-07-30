import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowDownTrayIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getInventoryControl, exportInventoryControlExcel } from '../services/inventoryControlService';
import toastService from '../services/toastService';

/* ─── helpers ─── */
const fmt = (n) => {
  if (n == null || isNaN(Number(n))) return '0';
  return Number(n).toLocaleString('id-ID');
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // 1-12

const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const MONTHS = MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }));

/* ─── sub-components ─── */
const MonthSelect = ({ label, year, setYear, month, setMonth }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
    <div className="flex gap-1">
      <select
        value={month}
        onChange={(e) => setMonth(Number(e.target.value))}
        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  </div>
);

/* ─── skeleton row ─── */
const SkeletonRow = ({ colCount }) => (
  <tr className="animate-pulse border-b border-gray-100">
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-3 py-2">
        <div className="h-3 rounded bg-gray-200" />
      </td>
    ))}
  </tr>
);

/* ════════════════════════════════════════
   InventoryControl Page
   ════════════════════════════════════════ */
const InventoryControl = () => {
  const [fromYear, setFromYear] = useState(currentYear);
  const [fromMonth, setFromMonth] = useState(1);
  const [toYear, setToYear] = useState(currentYear);
  const [toMonth, setToMonth] = useState(currentMonth);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [monthRange, setMonthRange] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const searchTimer = useRef(null);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const fetchData = useCallback(async () => {
    // Guard: toYear/toMonth must be >= fromYear/fromMonth
    if (toYear < fromYear || (toYear === fromYear && toMonth < fromMonth)) {
      toastService.error('Bulan/Tahun Akhir tidak boleh sebelum Bulan/Tahun Awal');
      return;
    }
    setLoading(true);
    try {
      const res = await getInventoryControl(fromYear, fromMonth, toYear, toMonth, page, limit, debouncedSearch);
      const rows = res?.data?.data ?? [];
      setData(rows);
      setPagination(res?.data?.pagination ?? null);
      // Derive monthRange from first row (all rows have same months)
      if (rows.length > 0) {
        setMonthRange(rows[0].months.map((m) => ({ year: m.year, month: m.month })));
      } else {
        // Generate client-side month range for empty state
        const range = [];
        let y = fromYear; let m = fromMonth;
        while (y < toYear || (y === toYear && m <= toMonth)) {
          range.push({ year: y, month: m });
          m++; if (m > 12) { m = 1; y++; }
        }
        setMonthRange(range);
      }
    } catch (err) {
      toastService.error(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [fromYear, fromMonth, toYear, toMonth, page, limit, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [fromYear, fromMonth, toYear, toMonth, debouncedSearch]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportInventoryControlExcel(fromYear, fromMonth, toYear, toMonth, debouncedSearch);
      toastService.success('Export berhasil');
    } catch (err) {
      toastService.error(err.message || 'Gagal export');
    } finally {
      setExporting(false);
    }
  };

  /* ─── computed totals per month ─── */
  const totals = monthRange.map(({ year, month }) => {
    const key = `${year}_${month}`;
    let stockIn = 0, stockOut = 0;
    data.forEach((row) => {
      const m = row.months?.find((x) => x.year === year && x.month === month);
      if (m) { stockIn += m.stockIn; stockOut += m.stockOut; }
    });
    return { key, stockIn, stockOut };
  });

  /* ─── column count for skeleton ─── */
  const colCount = 3 + monthRange.length * 3;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Inventory Control</h1>
          <p className="text-xs text-gray-500 mt-0.5">Rekap stok per item berdasarkan data Stock In & Stock Out</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {exporting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <ArrowDownTrayIcon className="h-4 w-4" />
          )}
          Export Excel
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <MonthSelect label="Dari" year={fromYear} setYear={setFromYear} month={fromMonth} setMonth={setFromMonth} />
        <span className="mb-1 text-sm text-gray-400">—</span>
        <MonthSelect label="Sampai" year={toYear} setYear={setToYear} month={toMonth} setMonth={setToMonth} />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Cari Item</span>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nama / PLU / kode..."
              className="h-8 w-56 rounded-md border border-gray-300 bg-white pl-7 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="mb-0 flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              {/* Row 1: top-level headers */}
              <tr className="bg-gray-800 text-white">
                <th rowSpan={2} className="sticky left-0 z-20 min-w-[200px] bg-gray-800 px-3 py-2 text-left font-bold uppercase tracking-wider">
                  Item
                </th>
                <th rowSpan={2} className="min-w-[80px] px-3 py-2 text-left font-bold uppercase tracking-wider whitespace-nowrap">
                  PLU
                </th>
                <th rowSpan={2} className="min-w-[90px] px-3 py-2 text-right font-bold uppercase tracking-wider whitespace-nowrap">
                  Stock Awal
                </th>
                {monthRange.map(({ year, month }) => (
                  <th
                    key={`${year}_${month}`}
                    colSpan={3}
                    className="border-l border-gray-600 px-3 py-2 text-center font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{ minWidth: 270 }}
                  >
                    {MONTH_NAMES[month - 1]} {year}
                  </th>
                ))}
              </tr>
              {/* Row 2: Stock In / Stock Out / Stock Akhir per month */}
              <tr className="bg-gray-700 text-white">
                {monthRange.map(({ year, month }) => (
                  <React.Fragment key={`${year}_${month}_sub`}>
                    <th className="border-l border-gray-600 px-3 py-1.5 text-right font-semibold text-emerald-300 whitespace-nowrap">
                      Stock In
                    </th>
                    <th className="px-3 py-1.5 text-right font-semibold text-red-300 whitespace-nowrap">
                      Stock Out
                    </th>
                    <th className="px-3 py-1.5 text-right font-semibold text-sky-300 whitespace-nowrap">
                      Stock Akhir
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} colCount={colCount} />
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="py-16 text-center text-sm text-gray-400">
                    Tidak ada data untuk periode yang dipilih.
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((row, idx) => (
                    <tr
                      key={row.itemId}
                      className={`transition-colors hover:bg-indigo-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      {/* Item name — sticky */}
                      <td className={`sticky left-0 z-10 px-3 py-2 font-medium text-gray-900 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        {row.namaBarang || '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600 tabular-nums">{row.plu || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-800">
                        {fmt(row.stockAwal)}
                      </td>
                      {row.months?.map((m) => (
                        <React.Fragment key={`${m.year}_${m.month}`}>
                          <td className="border-l border-gray-100 px-3 py-2 text-right tabular-nums text-emerald-700">
                            {m.stockIn > 0 ? fmt(m.stockIn) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-red-600">
                            {m.stockOut > 0 ? fmt(m.stockOut) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-bold tabular-nums text-sky-700">
                            {fmt(m.stockAkhir)}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}

                  {/* ─── Total Row ─── */}
                  <tr className="border-t-2 border-gray-400 bg-gray-100 font-bold text-gray-800">
                    <td className="sticky left-0 z-10 bg-gray-100 px-3 py-2">TOTAL</td>
                    <td />
                    <td />
                    {totals.map(({ key, stockIn, stockOut }) => (
                      <React.Fragment key={key}>
                        <td className="border-l border-gray-200 px-3 py-2 text-right tabular-nums text-emerald-700">
                          {fmt(stockIn)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-red-600">{fmt(stockOut)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-sky-700">—</td>
                      </React.Fragment>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 shadow-sm">
          <span>
            Halaman {pagination.currentPage} dari {pagination.totalPages} ({pagination.totalItems} item)
          </span>
          <div className="flex gap-1">
            <button
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-gray-300 px-2.5 py-1 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹ Prev
            </button>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-gray-300 px-2.5 py-1 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryControl;
