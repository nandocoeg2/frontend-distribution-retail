import React, { useCallback, useEffect, useState } from 'react';
import { ArrowPathIcon, ClipboardDocumentIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import logService from '../services/logService';
import toastService from '../services/toastService';
import { formatDateTime } from '../utils/formatUtils';

const LEVEL_OPTIONS = ['', 'error', 'warn', 'info', 'debug'];
const LEVEL_STYLES = {
  error: 'bg-red-100 text-red-800',
  warn: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
  debug: 'bg-gray-100 text-gray-800',
};
const PAGE_SIZE = 50;

const defaultFilters = {
  file: 'error',
  level: '',
  q: '',
  startDate: '',
  endDate: '',
};

// Input type="date" menghasilkan yyyy-mm-dd dalam waktu lokal; kirim sebagai ISO agar tidak bergeser zona waktu
const toStartIso = (value) => (value ? new Date(`${value}T00:00:00`).toISOString() : '');
const toEndIso = (value) => (value ? new Date(`${value}T23:59:59.999`).toISOString() : '');

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const LogError = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await logService.getLogs({
        file: applied.file,
        level: applied.level,
        q: applied.q,
        startDate: toStartIso(applied.startDate),
        endDate: toEndIso(applied.endDate),
        page,
        limit: PAGE_SIZE,
      });
      setResult(data);
      setExpanded({});
    } catch (err) {
      const status = err?.response?.status;
      const message =
        status === 403
          ? 'Anda tidak memiliki akses ke log aplikasi. Minta admin memberikan menu "Log Error" pada role Anda.'
          : err?.response?.data?.error?.message || err?.message || 'Gagal memuat log';
      setResult(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setApplied(filters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setApplied(defaultFilters);
    setPage(1);
  };

  const toggleRow = (index) => setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));

  const copyEntry = async (entry) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
      toastService.success('Log disalin ke clipboard');
    } catch (err) {
      toastService.error('Gagal menyalin log');
    }
  };

  const entries = result?.data || [];
  const hasNext = Boolean(result?.pagination?.hasNextPage);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Log Error</h1>
          <p className="text-xs text-gray-500">
            Log aplikasi backend, terbaru lebih dulu.
            {result ? ` Ukuran file: ${formatBytes(result.fileSizeBytes)}.` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-white border border-gray-200 rounded-lg">
        <select name="file" value={filters.file} onChange={handleChange} className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg">
          <option value="error">error.log (hanya error)</option>
          <option value="combined">combined.log (semua level)</option>
        </select>
        <select name="level" value={filters.level} onChange={handleChange} className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg">
          {LEVEL_OPTIONS.map((level) => (
            <option key={level || 'all'} value={level}>
              {level ? level : 'Semua level'}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleChange}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
          aria-label="Dari tanggal"
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleChange}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
          aria-label="Sampai tanggal"
        />
        <div className="relative md:col-span-1">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="q"
            value={filters.q}
            onChange={handleChange}
            placeholder="Cari (no LPB, PO, user...)"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Cari
          </button>
          <button type="button" onClick={handleReset} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            Reset
          </button>
        </div>
      </form>

      {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

      {result?.scanLimited && (
        <div className="p-2 text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg">
          Pencarian dibatasi pada 128 MB terakhir dari file log. Persempit dengan filter tanggal atau kata kunci.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-xs divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Waktu</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Level</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Pesan</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Endpoint</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Memuat log...</td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {error ? '-' : 'Tidak ada log yang cocok.'}
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => {
                const meta = entry.meta || {};
                const isOpen = Boolean(expanded[index]);
                return (
                  <React.Fragment key={`${entry.timestamp}-${index}`}>
                    <tr onClick={() => toggleRow(index)} className="cursor-pointer hover:bg-gray-50 align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                        {entry.timestamp ? formatDateTime(entry.timestamp) : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${LEVEL_STYLES[entry.level] || 'bg-gray-100 text-gray-800'}`}>
                          {entry.level}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-900 break-words max-w-xl">{entry.message}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {meta.method ? `${meta.method} ${meta.url || ''}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          title="Salin"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyEntry(entry);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-3 py-2">
                          <pre className="p-2 overflow-auto text-[11px] leading-snug bg-gray-900 text-gray-100 rounded max-h-96 whitespace-pre-wrap break-words">
                            {JSON.stringify(meta, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Halaman {page}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || loading}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogError;
