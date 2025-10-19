import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Card from '../components/ui/Card.jsx';
import PurchaseOrderStatusTable from '../components/dashboard/PurchaseOrderStatusTable.jsx';
import PurchaseOrderFilters, {
  purchaseOrderFilterDefaults,
} from '../components/dashboard/PurchaseOrderFilters.jsx';
import Pagination from '../components/common/Pagination.jsx';
import dashboardService from '../services/dashboardService.js';

const normalizeString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().toLowerCase();
};

const resolveStatusCodeString = (status) => {
  if (!status) {
    return '';
  }

  if (typeof status === 'string') {
    return normalizeString(status);
  }

  return normalizeString(status.status_code || status.status_name);
};

const initialFiltersState = {
  search: purchaseOrderFilterDefaults.search,
  shippingStatus: purchaseOrderFilterDefaults.shippingStatus,
  billingStatus: purchaseOrderFilterDefaults.billingStatus,
  paymentStatus: purchaseOrderFilterDefaults.paymentStatus,
};

const addStatusToMap = (map, status) => {
  if (!status) {
    return;
  }

  const code = (status.status_code || status.status_name || '').trim();
  if (!code) {
    return;
  }

  const normalizedCode = code.toUpperCase();
  const label = status.status_name || status.status_code || code;

  if (!map.has(normalizedCode)) {
    map.set(normalizedCode, { code: normalizedCode, label });
  }
};

const mapToOptions = (map) =>
  Array.from(map.values())
    .sort((first, second) =>
      first.label.localeCompare(second.label, 'id-ID', {
        sensitivity: 'base',
      }),
    )
    .map(({ code, label }) => ({
      value: code,
      label,
    }));

const Dashboard = () => {
  const [filters, setFilters] = useState(initialFiltersState);
  const [onlyPending, setOnlyPending] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10,
  });

  const statusMapsRef = useRef({
    shipping: new Map(),
    billing: new Map(),
    payment: new Map(),
  });

  const [statusOptions, setStatusOptions] = useState({
    shippingStatus: [],
    billingStatus: [],
    paymentStatus: [],
  });

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(filters.search && filters.search.trim()) ||
      filters.shippingStatus !== 'all' ||
      filters.billingStatus !== 'all' ||
      filters.paymentStatus !== 'all' ||
      onlyPending
    );
  }, [filters, onlyPending]);

  const updateStatusOptions = useCallback((rows = []) => {
    const { shipping, billing, payment } = statusMapsRef.current;

    rows.forEach((row) => {
      addStatusToMap(shipping, row?.status_pengiriman);
      addStatusToMap(billing, row?.status_tagihan);
      addStatusToMap(payment, row?.status_pembayaran);
    });

    setStatusOptions({
      shippingStatus: mapToOptions(shipping),
      billingStatus: mapToOptions(billing),
      paymentStatus: mapToOptions(payment),
    });
  }, []);

  const buildQueryParams = useCallback(() => {
    const params = {
      page,
      limit,
    };

    const trimmedSearch = filters.search?.trim();
    if (trimmedSearch) {
      params.po_number = trimmedSearch;
    }

    if (filters.shippingStatus && filters.shippingStatus !== 'all') {
      params.status_pengiriman = filters.shippingStatus;
    }

    if (filters.billingStatus && filters.billingStatus !== 'all') {
      params.status_tagihan = filters.billingStatus;
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      params.status_pembayaran = filters.paymentStatus;
    }

    return params;
  }, [filters, limit, page]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = buildQueryParams();
      const response = await dashboardService.getPurchaseOrderSummary(params);

      if (!response?.success) {
        throw new Error(
          response?.error?.message || 'Gagal memuat data dashboard.',
        );
      }

      const rows = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      const pagination = response?.data?.pagination || {};

      setPurchaseOrders(rows);
      updateStatusOptions(rows);

      const totalItems =
        Number(pagination.totalItems ?? pagination.total ?? rows.length) || 0;
      const totalPages =
        Number(pagination.totalPages ?? pagination.total_pages ?? 0) || 0;
      const currentPage =
        Number(pagination.currentPage ?? pagination.page ?? page) || page;
      const itemsPerPage =
        Number(pagination.itemsPerPage ?? pagination.limit ?? limit) || limit;

      setPaginationInfo({
        totalItems,
        totalPages,
        currentPage,
        itemsPerPage,
      });

      if (itemsPerPage !== limit) {
        setLimit(itemsPerPage);
      }

      if (currentPage !== page) {
        setPage(currentPage);
      }
    } catch (fetchError) {
      console.error('Failed to fetch dashboard summary:', fetchError);
      setError(fetchError.message || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, limit, page, updateStatusOptions]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const isOrderPending = useCallback((order) => {
    const billingStatus = resolveStatusCodeString(order?.status_tagihan);
    const paymentStatus = resolveStatusCodeString(order?.status_pembayaran);

    return !(billingStatus === 'paid' && paymentStatus === 'paid');
  }, []);

  const visibleOrders = useMemo(() => {
    let result = Array.isArray(purchaseOrders)
      ? [...purchaseOrders]
      : [];

    if (onlyPending) {
      result = result.filter(isOrderPending);
    }

    result.sort((first, second) =>
      String(first?.po_number || '').localeCompare(
        String(second?.po_number || ''),
        'id-ID',
        { numeric: true, sensitivity: 'base' },
      ),
    );

    return result;
  }, [isOrderPending, onlyPending, purchaseOrders]);

  const combinedFilters = useMemo(
    () => ({
      ...filters,
      onlyPending,
    }),
    [filters, onlyPending],
  );

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters({
      search: nextFilters.search ?? '',
      shippingStatus: nextFilters.shippingStatus ?? 'all',
      billingStatus: nextFilters.billingStatus ?? 'all',
      paymentStatus: nextFilters.paymentStatus ?? 'all',
    });
    setOnlyPending(Boolean(nextFilters.onlyPending));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(
    (nextFilters = purchaseOrderFilterDefaults) => {
      setFilters({
        search: nextFilters.search ?? '',
        shippingStatus: nextFilters.shippingStatus ?? 'all',
        billingStatus: nextFilters.billingStatus ?? 'all',
        paymentStatus: nextFilters.paymentStatus ?? 'all',
      });
      setOnlyPending(Boolean(nextFilters.onlyPending));
      setPage(1);
    },
    [],
  );

  const handlePageChange = useCallback((nextPage) => {
    setPage(nextPage);
    setPaginationInfo((prev) => ({
      ...prev,
      currentPage: nextPage,
    }));
  }, []);

  const handleLimitChange = useCallback((nextLimit) => {
    setLimit(nextLimit);
    setPaginationInfo((prev) => ({
      ...prev,
      itemsPerPage: nextLimit,
    }));
    setPage(1);
  }, []);

  const handleRetryFetch = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  const totalItems = onlyPending
    ? visibleOrders.length
    : paginationInfo.totalItems || visibleOrders.length;
  const visibleCount = visibleOrders.length;

  const tableEmptyMessage = hasActiveFilters
    ? 'Tidak ada purchase order yang cocok dengan filter yang dipilih.'
    : 'Belum ada data purchase order untuk ditampilkan.';

  return (
    <Card padding='lg' className='shadow-sm'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold text-gray-900'>
          Dashboard PO Tracking
        </h1>
        <p className='text-sm text-gray-600'>
          Pantau progres purchase order mulai dari pengiriman sampai pembayaran
          dengan tampilan yang ringkas.
        </p>
      </header>

      <div className='my-4 h-px bg-gray-200' />

      <section className='space-y-3'>
        <PurchaseOrderFilters
          filters={combinedFilters}
          onChange={handleFiltersChange}
          onReset={handleResetFilters}
          options={statusOptions}
        />
        <div className='flex items-center justify-between px-1 text-xs text-gray-500'>
          <span>
            Menampilkan{' '}
            <span className='font-semibold text-gray-700'>{visibleCount}</span>{' '}
            dari{' '}
            <span className='font-semibold text-gray-700'>{totalItems}</span>{' '}
            purchase order.
          </span>
          {hasActiveFilters && (
            <span className='font-medium text-indigo-600'>
              Filter aktif diterapkan
            </span>
          )}
        </div>

        {error && (
          <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800'>
            <p className='mb-3 font-medium'>
              Terjadi kesalahan saat memuat data dashboard: {error}
            </p>
            <button
              type='button'
              onClick={handleRetryFetch}
              className='inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
            >
              Muat ulang
            </button>
          </div>
        )}
      </section>

      <div className='my-4 h-px bg-gray-200' />

      <div className='space-y-4'>
        <PurchaseOrderStatusTable
          orders={visibleOrders}
          emptyMessage={tableEmptyMessage}
          loading={loading}
        />
        <Pagination
          pagination={{
            currentPage: paginationInfo.currentPage || page,
            totalPages: paginationInfo.totalPages || 0,
            totalItems: paginationInfo.totalItems || 0,
            itemsPerPage: paginationInfo.itemsPerPage || limit,
          }}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>
    </Card>
  );
};

export default Dashboard;
