import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ArrowDownTrayIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getInventoryControl, exportInventoryControlExcel } from '../services/inventoryControlService';
import toastService from '../services/toastService';

/* ─── helpers ─── */
const fmt = (n) => {
  if (n == null || isNaN(Number(n))) return '0';
  return Number(n).toLocaleString('id-ID');
};

const formatDateForInput = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: formatDateForInput(firstDay),
    end: formatDateForInput(now),
  };
};

const formatDateRangeLabel = (startStr, endStr) => {
  if (!startStr || !endStr) return '01 - 31 JANUARI';
  const s = new Date(`${startStr}T00:00:00`);
  const e = new Date(`${endStr}T00:00:00`);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '01 - 31 JANUARI';

  const monthNames = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];
  const startDay = String(s.getDate()).padStart(2, '0');
  const endDay = String(e.getDate()).padStart(2, '0');
  const sMonth = monthNames[s.getMonth()];
  const eMonth = monthNames[e.getMonth()];
  const sYear = s.getFullYear();
  const eYear = e.getFullYear();

  if (sMonth === eMonth && sYear === eYear) {
    return `${startDay} - ${endDay} ${sMonth} ${sYear}`;
  } else if (sYear === eYear) {
    return `${startDay} ${sMonth} - ${endDay} ${eMonth} ${sYear}`;
  } else {
    return `${startDay} ${sMonth} ${sYear} - ${endDay} ${eMonth} ${eYear}`;
  }
};

/* ─── skeleton row ─── */
const SkeletonRow = ({ colCount }) => (
  <tr className="animate-pulse border-b border-gray-200">
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
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'monthly'

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Per-column header filter states ("DI BIKIN BISA FILTER")
  const [columnFilters, setColumnFilters] = useState({
    item: '',
    plu: '',
    stockAwal: '',
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [periodRange, setPeriodRange] = useState([]);
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
    if (new Date(endDate) < new Date(startDate)) {
      toastService.error('Tanggal Akhir tidak boleh sebelum Tanggal Awal');
      return;
    }
    setLoading(true);
    try {
      const res = await getInventoryControl(startDate, endDate, page, limit, debouncedSearch, viewMode);
      const rows = res?.data?.data ?? [];
      setData(rows);
      setPagination(res?.data?.pagination ?? null);

      if (rows.length > 0 && rows[0].months) {
        setPeriodRange(rows[0].months);
      } else {
        setPeriodRange([]);
      }
    } catch (err) {
      toastService.error(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, limit, debouncedSearch, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, debouncedSearch, viewMode]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportInventoryControlExcel(startDate, endDate, debouncedSearch, viewMode);
      toastService.success('Export berhasil');
    } catch (err) {
      toastService.error(err.message || 'Gagal export');
    } finally {
      setExporting(false);
    }
  };

  // Filter rows according to header inputs ("DI BIKIN BISA FILTER")
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (
        columnFilters.item &&
        !String(row.namaBarang || '')
          .toLowerCase()
          .includes(columnFilters.item.toLowerCase())
      ) {
        return false;
      }
      if (
        columnFilters.plu &&
        !String(row.plu || '')
          .toLowerCase()
          .includes(columnFilters.plu.toLowerCase())
      ) {
        return false;
      }
      if (
        columnFilters.stockAwal &&
        !String(row.stockAwal || '')
          .toLowerCase()
          .includes(columnFilters.stockAwal.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [data, columnFilters]);

  /* ─── computed totals ─── */
  const totalStockAwal = useMemo(
    () => filteredData.reduce((acc, row) => acc + (row.stockAwal || 0), 0),
    [filteredData]
  );

  const totalStockInPerPeriod = useMemo(() => {
    return periodRange.map((_, pIdx) =>
      filteredData.reduce((sum, row) => sum + (row.months?.[pIdx]?.stockIn || 0), 0)
    );
  }, [filteredData, periodRange]);

  const grandTotalStockIn = useMemo(
    () => totalStockInPerPeriod.reduce((acc, val) => acc + val, 0),
    [totalStockInPerPeriod]
  );

  const totalStockOutPerPeriod = useMemo(() => {
    return periodRange.map((_, pIdx) =>
      filteredData.reduce((sum, row) => sum + (row.months?.[pIdx]?.stockOut || 0), 0)
    );
  }, [filteredData, periodRange]);

  const grandTotalStockOut = useMemo(
    () => totalStockOutPerPeriod.reduce((acc, val) => acc + val, 0),
    [totalStockOutPerPeriod]
  );

  const grandTotalStockAkhir = useMemo(
    () => totalStockAwal + grandTotalStockIn - grandTotalStockOut,
    [totalStockAwal, grandTotalStockIn, grandTotalStockOut]
  );

  /* ─── column count for skeleton ─── */
  const subPeriodCount = periodRange.length;
  const colCount = 3 + (subPeriodCount + 1) + (subPeriodCount + 1) + 1;

  return (
    <div className="space-y-4">
      {/* ── Title ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-gray-900">
            Inventory Control
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Rekap stok per item dengan tampilan Weekly (W1, W2, W3, W4...) & Monthly.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {exporting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <ArrowDownTrayIcon className="h-4 w-4" />
          )}
          Export Excel
        </button>
      </div>

      {/* ── Top Control Bar (Startdate, Enddate, View Mode, Reload, Search) ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-gray-300 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          {/* Tampilan Periode Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Tampilan Periode
            </span>
            <div className="inline-flex rounded-md shadow-sm border border-gray-300 p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Weekly (W1, W2, W3...)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                  viewMode === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly (Bulanan)
              </button>
            </div>
          </div>

          {/* Date Pickers (Startdate & Enddate) */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Startdate
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <span className="mb-1 text-xs font-bold text-gray-400">—</span>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Enddate
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reload Button */}
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="flex flex-col gap-1 w-full sm:w-64">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Cari Item</span>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Nama / PLU..."
              className="h-8 w-full rounded-md border border-gray-300 bg-white pl-7 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Table Layout (Exact Match with Image Mockup) ── */}
      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-xs">
            <thead>
              {/* Row 1: Top Banner with Date Range (e.g. 01 - 15 JANUARI) */}
              <tr className="bg-slate-800 text-white font-bold text-xs uppercase">
                <th rowSpan={3} className="sticky left-0 z-20 min-w-[200px] bg-slate-800 border-r border-slate-700 px-3 py-2 text-left">
                  ITEM
                </th>
                <th rowSpan={3} className="min-w-[90px] border-r border-slate-700 px-3 py-2 text-left whitespace-nowrap">
                  PLU
                </th>
                <th rowSpan={3} className="min-w-[110px] border-r border-slate-700 px-3 py-2 text-right whitespace-nowrap bg-emerald-950/40">
                  STOCK AWAL
                </th>

                {/* Date Range Top Banner across all STOCK IN and STOCK OUT columns */}
                <th
                  colSpan={(subPeriodCount + 1) * 2}
                  className="border-r border-slate-700 px-3 py-1.5 text-center font-extrabold tracking-wider bg-slate-300 text-slate-900 border-b border-slate-400"
                >
                  {formatDateRangeLabel(startDate, endDate)}
                </th>

                <th rowSpan={3} className="min-w-[110px] bg-emerald-700 px-3 py-2 text-right font-extrabold uppercase whitespace-nowrap text-white">
                  STOCK AKHIR
                </th>
              </tr>

              {/* Row 2: STOCK IN & STOCK OUT headers */}
              <tr className="text-slate-900 font-bold text-xs">
                <th
                  colSpan={subPeriodCount + 1}
                  className="border-r border-slate-400 px-3 py-1.5 text-center uppercase tracking-wider bg-blue-200 text-blue-950 border-b border-slate-400"
                >
                  STOCK IN
                </th>
                <th
                  colSpan={subPeriodCount + 1}
                  className="border-r border-slate-400 px-3 py-1.5 text-center uppercase tracking-wider bg-amber-200 text-amber-950 border-b border-slate-400"
                >
                  STOCK OUT
                </th>
              </tr>

              {/* Row 3: Sub-Period Headers (W1, W2, W3, W4... TOTAL STOCK IN / TOTAL STOCK OUT) */}
              <tr className="bg-slate-100 text-slate-800 font-bold text-xs border-b border-slate-300">
                {/* Under STOCK IN */}
                {periodRange.map((p, idx) => (
                  <th key={`in_${p.periodKey || idx}`} className="border-r border-slate-300 px-2.5 py-1 text-center bg-blue-50 whitespace-nowrap">
                    {p.label}
                  </th>
                ))}
                <th className="border-r border-slate-400 px-3 py-1 text-right font-extrabold bg-blue-300 text-blue-950 whitespace-nowrap">
                  TOTAL STOCK IN
                </th>

                {/* Under STOCK OUT */}
                {periodRange.map((p, idx) => (
                  <th key={`out_${p.periodKey || idx}`} className="border-r border-slate-300 px-2.5 py-1 text-center bg-amber-50 whitespace-nowrap">
                    {p.label}
                  </th>
                ))}
                <th className="border-r border-slate-400 px-3 py-1 text-right font-extrabold bg-amber-300 text-amber-950 whitespace-nowrap">
                  TOTAL STOCK OUT
                </th>
              </tr>

              {/* Row 4: Column Filter Row ("DI BIKIN BISA FILTER") */}
              <tr className="bg-slate-50 border-b border-slate-300">
                <th className="sticky left-0 z-20 bg-slate-50 border-r border-slate-300 px-1 py-1">
                  <input
                    type="text"
                    value={columnFilters.item}
                    onChange={(e) => setColumnFilters((p) => ({ ...p, item: e.target.value }))}
                    placeholder="Filter Item..."
                    className="w-full rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                  />
                </th>
                <th className="border-r border-slate-300 px-1 py-1">
                  <input
                    type="text"
                    value={columnFilters.plu}
                    onChange={(e) => setColumnFilters((p) => ({ ...p, plu: e.target.value }))}
                    placeholder="Filter PLU..."
                    className="w-full rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                  />
                </th>
                <th className="border-r border-slate-300 px-1 py-1">
                  <input
                    type="text"
                    value={columnFilters.stockAwal}
                    onChange={(e) => setColumnFilters((p) => ({ ...p, stockAwal: e.target.value }))}
                    placeholder="Filter Stock Awal..."
                    className="w-full rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none text-right"
                  />
                </th>
                <th colSpan={(subPeriodCount + 1) * 2} className="border-r border-slate-300 bg-slate-100/50" />
                <th className="bg-emerald-50/50" />
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} colCount={colCount} />
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="py-12 text-center text-xs text-gray-500">
                    Tidak ada data Inventory Control ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr
                    key={row.itemId}
                    className={`transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    {/* Item name — sticky */}
                    <td className={`sticky left-0 z-10 border-r border-gray-200 px-3 py-2 font-medium text-gray-900 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      {row.namaBarang || '—'}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-gray-700 tabular-nums">{row.plu || '—'}</td>
                    <td className="border-r border-gray-200 px-3 py-2 text-right font-bold tabular-nums text-gray-900 bg-gray-50/30">
                      {fmt(row.stockAwal)}
                    </td>

                    {/* Stock In W1, W2, W3, W4... */}
                    {row.months?.map((m, pIdx) => (
                      <td key={`in_${m.periodKey || pIdx}`} className="border-r border-gray-200 px-2.5 py-2 text-right tabular-nums text-blue-700">
                        {m.stockIn > 0 ? fmt(m.stockIn) : <span className="text-gray-300">0</span>}
                      </td>
                    ))}
                    {/* Total Stock In */}
                    <td className="border-r border-gray-300 px-3 py-2 text-right font-extrabold tabular-nums text-blue-950 bg-blue-100/70">
                      {fmt(row.totalStockIn)}
                    </td>

                    {/* Stock Out W1, W2, W3, W4... */}
                    {row.months?.map((m, pIdx) => (
                      <td key={`out_${m.periodKey || pIdx}`} className="border-r border-gray-200 px-2.5 py-2 text-right tabular-nums text-amber-700">
                        {m.stockOut > 0 ? fmt(m.stockOut) : <span className="text-gray-300">0</span>}
                      </td>
                    ))}
                    {/* Total Stock Out */}
                    <td className="border-r border-gray-300 px-3 py-2 text-right font-extrabold tabular-nums text-amber-950 bg-amber-100/70">
                      {fmt(row.totalStockOut)}
                    </td>

                    {/* Stock Akhir */}
                    <td className="px-3 py-2 text-right font-extrabold tabular-nums text-emerald-950 bg-emerald-100/80">
                      {fmt(row.stockAkhir)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer Total Row */}
            <tfoot className="border-t-2 border-gray-400 bg-gray-100 font-bold text-xs text-gray-900">
              <tr>
                <td className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 px-3 py-2">TOTAL</td>
                <td className="border-r border-gray-300 px-3 py-2">—</td>
                <td className="border-r border-gray-300 px-3 py-2 text-right text-gray-900 font-bold">
                  {fmt(totalStockAwal)}
                </td>

                {/* Total Stock In per W1, W2... */}
                {totalStockInPerPeriod.map((val, pIdx) => (
                  <td key={`tot_in_${pIdx}`} className="border-r border-gray-300 px-2.5 py-2 text-right text-blue-800">
                    {fmt(val)}
                  </td>
                ))}
                <td className="border-r border-gray-300 px-3 py-2 text-right text-blue-950 font-extrabold bg-blue-200/80">
                  {fmt(grandTotalStockIn)}
                </td>

                {/* Total Stock Out per W1, W2... */}
                {totalStockOutPerPeriod.map((val, pIdx) => (
                  <td key={`tot_out_${pIdx}`} className="border-r border-gray-300 px-2.5 py-2 text-right text-amber-800">
                    {fmt(val)}
                  </td>
                ))}
                <td className="border-r border-gray-300 px-3 py-2 text-right text-amber-950 font-extrabold bg-amber-200/80">
                  {fmt(grandTotalStockOut)}
                </td>

                {/* Grand Total Stock Akhir */}
                <td className="px-3 py-2 text-right text-emerald-950 font-extrabold bg-emerald-200">
                  {fmt(grandTotalStockAkhir)}
                </td>
              </tr>
            </tfoot>
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
