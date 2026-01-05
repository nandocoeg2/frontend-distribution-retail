import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Card from '../components/ui/Card.jsx';
import PurchaseOrderStatusTable from '../components/dashboard/PurchaseOrderStatusTable.jsx';
import PurchaseOrderFilters, { purchaseOrderFilterDefaults } from '../components/dashboard/PurchaseOrderFilters.jsx';
import Pagination from '../components/common/Pagination.jsx';
import dashboardService from '../services/dashboardService.js';
import authService from '../services/authService.js';

const normalize = (v) => (v == null ? '' : String(v).trim().toLowerCase());
const resolveStatusCodeString = (s) => !s ? '' : typeof s === 'string' ? normalize(s) : normalize(s.status_code || s.status_name);

const initialFiltersState = { ...purchaseOrderFilterDefaults };

const addStatusToMap = (map, status) => {
  if (!status) return;
  const code = (status.status_code || status.status_name || '').trim();
  if (!code) return;
  const normalizedCode = code.toUpperCase();
  if (!map.has(normalizedCode)) {
    map.set(normalizedCode, { code: normalizedCode, label: status.status_name || code });
  }
};

const mapToOptions = (map) => Array.from(map.values())
  .sort((a, b) => a.label.localeCompare(b.label, 'id-ID', { sensitivity: 'base' }))
  .map(({ code, label }) => ({ value: code, label }));

const Dashboard = () => {
  const [filters, setFilters] = useState(initialFiltersState);
  const [onlyPending, setOnlyPending] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({ totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: 10 });
  const statusMapsRef = useRef({ shipping: new Map(), billing: new Map(), payment: new Map() });
  const [statusOptions, setStatusOptions] = useState({ shippingStatus: [], billingStatus: [], paymentStatus: [] });

  const hasActiveFilters = useMemo(() =>
    Boolean(filters.search?.trim()) || filters.shippingStatus !== 'all' ||
    filters.billingStatus !== 'all' || filters.paymentStatus !== 'all' || onlyPending
    , [filters, onlyPending]);

  const updateStatusOptions = useCallback((rows = []) => {
    const { shipping, billing, payment } = statusMapsRef.current;
    rows.forEach((r) => {
      addStatusToMap(shipping, r?.status_pengiriman);
      addStatusToMap(billing, r?.status_tagihan);
      addStatusToMap(payment, r?.status_pembayaran);
    });
    setStatusOptions({ shippingStatus: mapToOptions(shipping), billingStatus: mapToOptions(billing), paymentStatus: mapToOptions(payment) });
  }, []);

  const buildQueryParams = useCallback(() => {
    const params = { page, limit };
    const companyId = authService.getCompanyData()?.id;
    if (companyId) params.companyId = companyId;
    if (filters.search?.trim()) params.po_number = filters.search.trim();
    if (filters.shippingStatus !== 'all') params.status_pengiriman = filters.shippingStatus;
    if (filters.billingStatus !== 'all') params.status_tagihan = filters.billingStatus;
    if (filters.paymentStatus !== 'all') params.status_pembayaran = filters.paymentStatus;
    return params;
  }, [filters, limit, page]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getPurchaseOrderSummary(buildQueryParams());
      if (!response?.success) throw new Error(response?.error?.message || 'Gagal memuat data dashboard.');
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      const p = response?.data?.pagination || {};
      setPurchaseOrders(rows);
      updateStatusOptions(rows);
      const totalItems = Number(p.totalItems ?? p.total ?? rows.length) || 0;
      const totalPages = Number(p.totalPages ?? p.total_pages ?? 0) || 0;
      const currentPage = Number(p.currentPage ?? p.page ?? page) || page;
      const itemsPerPage = Number(p.itemsPerPage ?? p.limit ?? limit) || limit;
      setPaginationInfo({ totalItems, totalPages, currentPage, itemsPerPage });
      if (itemsPerPage !== limit) setLimit(itemsPerPage);
      if (currentPage !== page) setPage(currentPage);
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
      setError(err.message || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, limit, page, updateStatusOptions]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const isOrderPending = useCallback((o) => {
    const b = resolveStatusCodeString(o?.status_tagihan);
    const p = resolveStatusCodeString(o?.status_pembayaran);
    return !(b === 'paid' && p === 'paid');
  }, []);

  const visibleOrders = useMemo(() => {
    let result = Array.isArray(purchaseOrders) ? [...purchaseOrders] : [];
    if (onlyPending) result = result.filter(isOrderPending);
    return result.sort((a, b) => String(a?.po_number || '').localeCompare(String(b?.po_number || ''), 'id-ID', { numeric: true, sensitivity: 'base' }));
  }, [isOrderPending, onlyPending, purchaseOrders]);

  const combinedFilters = useMemo(() => ({ ...filters, onlyPending }), [filters, onlyPending]);

  const handleFiltersChange = useCallback((f) => {
    setFilters({ search: f.search ?? '', shippingStatus: f.shippingStatus ?? 'all', billingStatus: f.billingStatus ?? 'all', paymentStatus: f.paymentStatus ?? 'all' });
    setOnlyPending(Boolean(f.onlyPending));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback((f = purchaseOrderFilterDefaults) => {
    setFilters({ search: f.search ?? '', shippingStatus: f.shippingStatus ?? 'all', billingStatus: f.billingStatus ?? 'all', paymentStatus: f.paymentStatus ?? 'all' });
    setOnlyPending(Boolean(f.onlyPending));
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p) => { setPage(p); setPaginationInfo((prev) => ({ ...prev, currentPage: p })); }, []);
  const handleLimitChange = useCallback((l) => { setLimit(l); setPaginationInfo((prev) => ({ ...prev, itemsPerPage: l })); setPage(1); }, []);
  const handleRetryFetch = useCallback(() => { fetchSummary(); }, [fetchSummary]);

  const totalItems = onlyPending ? visibleOrders.length : paginationInfo.totalItems || visibleOrders.length;
  const visibleCount = visibleOrders.length;
  const tableEmptyMessage = hasActiveFilters ? 'Tidak ada PO yang cocok dengan filter.' : 'Belum ada data PO.';

  return (
    <Card padding='md' className='shadow-sm'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-lg font-semibold text-gray-900'>Dashboard PO Tracking</h1>
        </div>
        <span className='text-xs text-gray-500'>
          <span className='font-semibold text-gray-700'>{visibleCount}</span>/{totalItems} PO
          {hasActiveFilters && <span className='ml-2 text-indigo-600'>• Filter aktif</span>}
        </span>
      </header>

      <div className='my-2 h-px bg-gray-200' />

      <PurchaseOrderFilters filters={combinedFilters} onChange={handleFiltersChange} onReset={handleResetFilters} options={statusOptions} />

      {error && (
        <div className='mt-2 flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800'>
          <span>Error: {error}</span>
          <button type='button' onClick={handleRetryFetch} className='rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700'>Muat ulang</button>
        </div>
      )}

      <div className='mt-3'>
        <PurchaseOrderStatusTable orders={visibleOrders} emptyMessage={tableEmptyMessage} loading={loading} />
        <Pagination
          pagination={{ currentPage: paginationInfo.currentPage || page, totalPages: paginationInfo.totalPages || 0, totalItems: paginationInfo.totalItems || 0, itemsPerPage: paginationInfo.itemsPerPage || limit }}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>
    </Card>
  );
};

export default Dashboard;
