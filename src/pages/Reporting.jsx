import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import toastService from '../services/toastService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import Card, { StatCard, CardHeader } from '../components/ui/Card.jsx';
import { LoadingState } from '../components/ui/Loading.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../utils/formatUtils';
import {
  getOperationalReporting,
  getFinancialReporting,
  getInventoryReporting,
} from '../services/reportingService';
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  CurrencyDollarIcon,
  TagIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CubeIcon,
  Squares2X2Icon,
  SquaresPlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const numberFormatter = new Intl.NumberFormat('id-ID');

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return '0';
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return '0';
  }

  return numberFormatter.format(numericValue);
};

const calculatePercentage = (value, total) => {
  const numericValue = Number(value || 0);
  const numericTotal = Number(total || 0);

  if (!numericTotal || Number.isNaN(numericTotal) || numericTotal <= 0) {
    return 0;
  }

  const percentage = (numericValue / numericTotal) * 100;
  if (!Number.isFinite(percentage)) {
    return 0;
  }

  return Math.max(0, Math.min(100, percentage));
};

const periodLabels = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
};

const getPeriodLabel = (period) => {
  if (!period) {
    return 'Kustom';
  }
  return periodLabels[period] || period.toUpperCase();
};

const formatDateRangeLabel = (start, end) => {
  if (start && end) {
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  if (start) {
    return `Mulai ${formatDate(start)}`;
  }

  if (end) {
    return `Hingga ${formatDate(end)}`;
  }

  return 'Menggunakan periode default dari sistem';
};

const getStatusVariant = (statusCode = '') => {
  const normalized = statusCode.toUpperCase();

  if (
    normalized.includes('DELIVERED') ||
    normalized.includes('PAID') ||
    normalized.includes('COMPLETE')
  ) {
    return 'success';
  }

  if (normalized.includes('PENDING') || normalized.includes('WAITING')) {
    return 'warning';
  }

  if (normalized.includes('DRAFT')) {
    return 'secondary';
  }

  if (normalized.includes('CANCEL') || normalized.includes('REJECT')) {
    return 'danger';
  }

  if (
    normalized.includes('ON') ||
    normalized.includes('PROCESS') ||
    normalized.includes('SHIPPING') ||
    normalized.includes('DELIVERY')
  ) {
    return 'info';
  }

  return 'primary';
};

const tabs = [
  {
    id: 'operational',
    label: 'Operasional',
    description: 'PO, Packing, dan Surat Jalan',
  },
  {
    id: 'financial',
    label: 'Finansial',
    description: 'Revenue, PPN, dan Outstanding',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    description: 'Stok, peringatan, dan pergerakan',
  },
];

const periodOptions = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
];
const Reporting = () => {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('operational');
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [operationalData, setOperationalData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loadingState, setLoadingState] = useState({
    operational: false,
    financial: false,
    inventory: false,
  });
  const [errorState, setErrorState] = useState({
    operational: '',
    financial: '',
    inventory: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getUserData();
    if (!user) {
      navigate('/login');
      return;
    }
    setUserData(user);
  }, [navigate]);

  const ensureValidDateRange = useCallback(
    (scope) => {
      if (startDate && endDate && startDate > endDate) {
        const message = 'Tanggal mulai tidak boleh setelah tanggal akhir.';
        setErrorState((prev) => ({ ...prev, [scope]: message }));
        toastService.error(message);
        return false;
      }
      return true;
    },
    [startDate, endDate]
  );

  const fetchOperational = useCallback(async () => {
    setErrorState((prev) => ({ ...prev, operational: '' }));

    if (!ensureValidDateRange('operational')) {
      return;
    }

    setLoadingState((prev) => ({ ...prev, operational: true }));

    try {
      const response = await getOperationalReporting({
        period,
        startDate,
        endDate,
      });
      if (!response?.success) {
        throw new Error(
          response?.error?.message || 'Gagal memuat data laporan operasional.'
        );
      }

      setOperationalData(response.data);
    } catch (error) {
      const message =
        error.message || 'Gagal memuat data laporan operasional.';
      setOperationalData(null);
      setErrorState((prev) => ({ ...prev, operational: message }));
      toastService.error(message);
    } finally {
      setLoadingState((prev) => ({ ...prev, operational: false }));
    }
  }, [period, startDate, endDate, ensureValidDateRange]);

  const fetchFinancial = useCallback(async () => {
    setErrorState((prev) => ({ ...prev, financial: '' }));

    if (!ensureValidDateRange('financial')) {
      return;
    }

    setLoadingState((prev) => ({ ...prev, financial: true }));

    try {
      const response = await getFinancialReporting({
        period,
        startDate,
        endDate,
      });
      if (!response?.success) {
        throw new Error(
          response?.error?.message || 'Gagal memuat data laporan finansial.'
        );
      }

      setFinancialData(response.data);
    } catch (error) {
      const message = error.message || 'Gagal memuat data laporan finansial.';
      setFinancialData(null);
      setErrorState((prev) => ({ ...prev, financial: message }));
      toastService.error(message);
    } finally {
      setLoadingState((prev) => ({ ...prev, financial: false }));
    }
  }, [period, startDate, endDate, ensureValidDateRange]);

  const fetchInventory = useCallback(async () => {
    setErrorState((prev) => ({ ...prev, inventory: '' }));
    setLoadingState((prev) => ({ ...prev, inventory: true }));

    try {
      const response = await getInventoryReporting();
      if (!response?.success) {
        throw new Error(
          response?.error?.message || 'Gagal memuat data laporan inventory.'
        );
      }

      setInventoryData(response.data);
    } catch (error) {
      const message = error.message || 'Gagal memuat data laporan inventory.';
      setInventoryData(null);
      setErrorState((prev) => ({ ...prev, inventory: message }));
      toastService.error(message);
    } finally {
      setLoadingState((prev) => ({ ...prev, inventory: false }));
    }
  }, []);

  useEffect(() => {
    if (!userData) {
      return;
    }

    if (activeTab === 'operational') {
      fetchOperational();
    } else if (activeTab === 'financial') {
      fetchFinancial();
    } else if (activeTab === 'inventory') {
      fetchInventory();
    }
  }, [activeTab, fetchOperational, fetchFinancial, fetchInventory, userData]);

  const handleResetFilters = () => {
    setPeriod('monthly');
    setStartDate('');
    setEndDate('');
  };

  const renderStatusBreakdown = (
    title,
    statuses = [],
    total = 0,
    accent = 'bg-blue-500'
  ) => (
    <Card padding='lg' className='h-full'>
      <CardHeader
        title={`Status ${title}`}
        subtitle={`Total ${formatNumber(total)}`}
      />
      <div className='space-y-4'>
        {Array.isArray(statuses) && statuses.length > 0 ? (
          statuses.map((status) => {
            const percentage = calculatePercentage(status.count, total);
            return (
              <div key={status.statusCode} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-semibold text-gray-800'>
                      {status.statusName}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {formatNumber(status.count)} dokumen
                    </p>
                  </div>
                  <span className='text-sm font-semibold text-gray-700'>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className='w-full h-2 bg-gray-200 rounded-full'>
                  <div
                    className={`h-2 rounded-full ${accent}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className='text-sm text-gray-500'>
            Belum ada data status untuk periode ini.
          </p>
        )}
      </div>
    </Card>
  );
  const renderOperationalSection = () => {
    if (loadingState.operational) {
      return (
        <Card padding='lg'>
          <LoadingState message='Memuat metrik operasional...' />
        </Card>
      );
    }

    if (errorState.operational) {
      return (
        <Card padding='lg' variant='warning'>
          <CardHeader
            title='Tidak dapat memuat data operasional'
            subtitle={errorState.operational}
            action={
              <button
                type='button'
                onClick={fetchOperational}
                className='inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 transition border border-blue-500 rounded-lg hover:bg-blue-50'
              >
                <ArrowPathIcon className='w-4 h-4 mr-2' />
                Coba lagi
              </button>
            }
          />
        </Card>
      );
    }

    if (!operationalData) {
      return (
        <Card padding='lg'>
          <CardHeader
            title='Data operasional belum tersedia'
            subtitle='Silakan perbarui filter atau muat ulang halaman.'
            action={
              <button
                type='button'
                onClick={fetchOperational}
                className='inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 transition border border-blue-500 rounded-lg hover:bg-blue-50'
              >
                <ArrowPathIcon className='w-4 h-4 mr-2' />
                Muat ulang
              </button>
            }
          />
        </Card>
      );
    }

    const {
      metrics = {},
      period: responsePeriod,
      startDate: responseStartDate,
      endDate: responseEndDate,
    } = operationalData;
    const {
      purchaseOrders = {},
      packing = {},
      suratJalan = {},
      deliveryStatus = {},
      documentTracking = {},
    } = metrics;

    const trackingItems = [
      { key: 'packing', label: 'Packing', metrics: documentTracking.packing },
      {
        key: 'invoicePengiriman',
        label: 'Invoice Pengiriman',
        metrics: documentTracking.invoicePengiriman,
      },
      {
        key: 'suratJalan',
        label: 'Surat Jalan',
        metrics: documentTracking.suratJalan,
      },
    ].filter((item) => item.metrics);

    const latestDeliveries = deliveryStatus.latestDeliveries || [];

    return (
      <div className='space-y-6'>
        <Card padding='lg'>
          <CardHeader
            title='Ringkasan Operasional'
            subtitle={`${getPeriodLabel(responsePeriod || period)} • ${formatDateRangeLabel(responseStartDate, responseEndDate)}`}
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <StatCard
              title='Total Purchase Order'
              value={formatNumber(purchaseOrders.total || 0)}
              icon={<ChartBarIcon className='w-8 h-8 text-blue-600' />}
              variant='primary'
            />
            <StatCard
              title='Total Packing'
              value={formatNumber(packing.total || 0)}
              icon={
                <ClipboardDocumentListIcon className='w-8 h-8 text-green-600' />
              }
              variant='success'
            />
            <StatCard
              title='Total Surat Jalan'
              value={formatNumber(suratJalan.total || 0)}
              icon={<TruckIcon className='w-8 h-8 text-purple-600' />}
              variant='warning'
            />
          </div>
        </Card>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {renderStatusBreakdown(
            'Purchase Order',
            purchaseOrders.byStatus,
            purchaseOrders.total,
            'bg-blue-500'
          )}
          {renderStatusBreakdown(
            'Packing',
            packing.byStatus,
            packing.total,
            'bg-green-500'
          )}
          {renderStatusBreakdown(
            'Surat Jalan',
            suratJalan.byStatus,
            suratJalan.total,
            'bg-purple-500'
          )}
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <Card padding='lg' className='h-full'>
            <CardHeader
              title='Pengiriman Terbaru'
              subtitle='10 update terbaru'
            />
            <div className='space-y-4'>
              {latestDeliveries.length > 0 ? (
                latestDeliveries.map((delivery) => (
                  <div
                    key={delivery.id || delivery.suratJalanNumber}
                    className='p-4 transition border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/40'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-semibold text-gray-900'>
                          {delivery.suratJalanNumber}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {delivery.deliverTo}
                        </p>
                      </div>
                      <StatusBadge
                        status={delivery.statusName || delivery.statusCode}
                        variant={getStatusVariant(delivery.statusCode)}
                        size='sm'
                      />
                    </div>
                    <p className='mt-2 text-xs text-gray-500'>
                      Pembaruan terakhir:{' '}
                      {formatDateTime(delivery.deliveryDate)}
                    </p>
                  </div>
                ))
              ) : (
                <p className='text-sm text-gray-500'>
                  Belum ada aktivitas pengiriman pada periode ini.
                </p>
              )}
            </div>
          </Card>

          <Card padding='lg' className='h-full'>
            <CardHeader
              title='Document Tracking'
              subtitle='Perbandingan cetak dokumen'
            />
            <div className='space-y-5'>
              {trackingItems.length > 0 ? (
                trackingItems.map(
                  ({ key, label, metrics: trackingMetrics }) => {
                    const printed = trackingMetrics.totalPrinted || 0;
                    const total = trackingMetrics.totalPrintCount || 0;
                    const percentage = calculatePercentage(printed, total);

                    return (
                      <div key={key} className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <p className='text-sm font-semibold text-gray-800'>
                            {label}
                          </p>
                          <span className='text-xs text-gray-500'>
                            {formatNumber(printed)} / {formatNumber(total)}{' '}
                            cetak
                          </span>
                        </div>
                        <div className='w-full h-2 bg-gray-200 rounded-full'>
                          <div
                            className='h-2 transition-all bg-blue-500 rounded-full'
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className='text-xs font-medium text-gray-500'>
                          {percentage.toFixed(1)}% dokumen berhasil dicetak
                        </p>
                      </div>
                    );
                  }
                )
              ) : (
                <p className='text-sm text-gray-500'>
                  Belum ada data pencetakan dokumen.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  };
  const renderFinancialSection = () => {
    if (loadingState.financial) {
      return (
        <Card padding='lg'>
          <LoadingState message='Memuat metrik finansial...' />
        </Card>
      );
    }

    if (errorState.financial) {
      return (
        <Card padding='lg' variant='warning'>
          <CardHeader
            title='Tidak dapat memuat data finansial'
            subtitle={errorState.financial}
            action={
              <button
                type='button'
                onClick={fetchFinancial}
                className='inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 transition border border-blue-500 rounded-lg hover:bg-blue-50'
              >
                <ArrowPathIcon className='w-4 h-4 mr-2' />
                Coba lagi
              </button>
            }
          />
        </Card>
      );
    }

    if (!financialData) {
      return (
        <Card padding='lg'>
          <CardHeader
            title='Data finansial belum tersedia'
            subtitle='Silakan perbarui filter atau muat ulang halaman.'
            action={
              <button
                type='button'
                onClick={fetchFinancial}
                className='inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 transition border border-blue-500 rounded-lg hover:bg-blue-50'
              >
                <ArrowPathIcon className='w-4 h-4 mr-2' />
                Muat ulang
              </button>
            }
          />
        </Card>
      );
    }

    const {
      metrics = {},
      period: responsePeriod,
      startDate: responseStartDate,
      endDate: responseEndDate,
    } = financialData;
    const {
      overview = {},
      outstandingPayments = {},
      revenueByCustomer = [],
      revenueBySupplier = [],
    } = metrics;

    const topCustomers = revenueByCustomer.slice(0, 5);
    const topSuppliers = revenueBySupplier.slice(0, 5);

    return (
      <div className='space-y-6'>
        <Card padding='lg'>
          <CardHeader
            title='Ringkasan Finansial'
            subtitle={`${getPeriodLabel(responsePeriod || period)} • ${formatDateRangeLabel(responseStartDate, responseEndDate)}`}
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <StatCard
              title='Total Revenue'
              value={formatCurrency(overview.totalRevenue)}
              icon={<CurrencyDollarIcon className='w-8 h-8 text-emerald-600' />}
              variant='success'
            />
            <StatCard
              title='Total Discount'
              value={formatCurrency(overview.totalDiscount)}
              icon={<TagIcon className='w-8 h-8 text-orange-500' />}
              variant='warning'
            />
            <StatCard
              title='Total PPN'
              value={formatCurrency(overview.totalPPN)}
              icon={<BanknotesIcon className='w-8 h-8 text-blue-600' />}
              variant='primary'
            />
            <StatCard
              title='Total Invoice'
              value={formatNumber(overview.totalInvoices || 0)}
              icon={<DocumentTextIcon className='w-8 h-8 text-purple-600' />}
            />
          </div>
        </Card>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <Card padding='lg' className='h-full'>
            <CardHeader
              title='Outstanding Payments'
              subtitle='Invoice yang belum lunas'
            />
            <div className='space-y-4'>
              <div className='p-4 border rounded-lg border-amber-200 bg-amber-50'>
                <p className='text-xs font-semibold tracking-wide uppercase text-amber-600'>
                  Total Outstanding
                </p>
                <p className='mt-1 text-2xl font-bold text-amber-700'>
                  {formatCurrency(outstandingPayments.total)}
                </p>
                <p className='mt-1 text-sm text-amber-700'>
                  {formatNumber(outstandingPayments.count || 0)} invoice
                  menunggu pembayaran
                </p>
              </div>
              <p className='text-xs text-gray-500'>
                Gunakan data ini untuk memprioritaskan penagihan dan menjaga
                arus kas tetap sehat.
              </p>
            </div>
          </Card>

          <div className='space-y-6'>
            <Card padding='lg'>
              <CardHeader
                title='Top Customer'
                subtitle='Kontributor revenue terbesar'
              />
              <div className='space-y-3'>
                {topCustomers.length > 0 ? (
                  topCustomers.map((customer, index) => (
                    <div
                      key={
                        customer.customerId ||
                        `${customer.customerName}-${index}`
                      }
                      className='flex items-center justify-between p-3 transition border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/40'
                    >
                      <div>
                        <p className='text-sm font-semibold text-gray-900'>
                          {customer.customerName}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Peringkat #{index + 1}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-semibold text-gray-900'>
                          {formatCurrency(customer.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-sm text-gray-500'>
                    Belum ada data revenue per customer.
                  </p>
                )}
              </div>
            </Card>

            <Card padding='lg'>
              <CardHeader
                title='Top Supplier'
                subtitle='Supplier dengan nilai transaksi terbesar'
              />
              <div className='space-y-3'>
                {topSuppliers.length > 0 ? (
                  topSuppliers.map((supplier, index) => (
                    <div
                      key={
                        supplier.supplierId ||
                        `${supplier.supplierName}-${index}`
                      }
                      className='flex items-center justify-between p-3 transition border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/40'
                    >
                      <div>
                        <p className='text-sm font-semibold text-gray-900'>
                          {supplier.supplierName}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Peringkat #{index + 1}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-semibold text-gray-900'>
                          {formatCurrency(supplier.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-sm text-gray-500'>
                    Belum ada data revenue per supplier.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };
  const renderInventorySection = () => {
    if (loadingState.inventory) {
      return (
        <Card padding='lg'>
          <LoadingState message='Memuat metrik inventory...' />
        </Card>
      );
    }

    if (errorState.inventory) {
      return (
        <Card padding='lg' variant='warning'>
          <CardHeader
            title='Tidak dapat memuat data inventory'
            subtitle={errorState.inventory}
            action={
              <button
                type='button'
                onClick={fetchInventory}
                className='inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 transition border border-blue-500 rounded-lg hover:bg-blue-50'
              >
                <ArrowPathIcon className='w-4 h-4 mr-2' />
                Coba lagi
              </button>
            }
          />
        </Card>
      );
    }

    if (!inventoryData) {
      return (
        <Card padding='lg'>
          <CardHeader
            title='Data inventory belum tersedia'
            subtitle='Silakan muat ulang untuk mendapatkan data terbaru.'
            action={
              <button
                type='button'
                onClick={fetchInventory}
                className='inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 transition border border-blue-500 rounded-lg hover:bg-blue-50'
              >
                <ArrowPathIcon className='w-4 h-4 mr-2' />
                Muat ulang
              </button>
            }
          />
        </Card>
      );
    }

    const { metrics = {} } = inventoryData;
    const {
      overview = {},
      stockStatus = {},
      lowStockAlerts = [],
      recentMovements = [],
    } = metrics;

    const stockTotal =
      (stockStatus.zeroStock || 0) +
      (stockStatus.lowStock || 0) +
      (stockStatus.normalStock || 0);

    return (
      <div className='space-y-6'>
        <Card padding='lg'>
          <CardHeader
            title='Ringkasan Inventory'
            subtitle='Gambaran umum stok dan nilai aset'
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <StatCard
              title='Total Item'
              value={formatNumber(overview.totalItems || 0)}
              icon={<CubeIcon className='w-8 h-8 text-blue-600' />}
              variant='primary'
            />
            <StatCard
              title='Stok Karton'
              value={formatNumber(overview.totalStockCartons || 0)}
              icon={<Squares2X2Icon className='w-8 h-8 text-purple-600' />}
              variant='warning'
            />
            <StatCard
              title='Stok Pieces'
              value={formatNumber(overview.totalStockPieces || 0)}
              icon={<SquaresPlusIcon className='w-8 h-8 text-green-600' />}
              variant='success'
            />
            <StatCard
              title='Nilai Inventory'
              value={formatCurrency(overview.totalInventoryValue)}
              icon={<CurrencyDollarIcon className='w-8 h-8 text-emerald-600' />}
            />
          </div>
        </Card>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Card padding='lg' className='h-full'>
            <CardHeader
              title='Status Stok'
              subtitle='Distribusi stok saat ini'
            />
            <div className='space-y-4'>
              {[
                {
                  key: 'normalStock',
                  label: 'Normal',
                  color: 'bg-green-500',
                  value: stockStatus.normalStock,
                },
                {
                  key: 'lowStock',
                  label: 'Low Stock',
                  color: 'bg-amber-500',
                  value: stockStatus.lowStock,
                },
                {
                  key: 'zeroStock',
                  label: 'Habis',
                  color: 'bg-red-500',
                  value: stockStatus.zeroStock,
                },
              ].map((status) => {
                const percentage = calculatePercentage(
                  status.value,
                  stockTotal
                );
                return (
                  <div key={status.key} className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-semibold text-gray-800'>
                        {status.label}
                      </p>
                      <span className='text-xs text-gray-500'>
                        {formatNumber(status.value || 0)} item ·{' '}
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className='w-full h-2 bg-gray-200 rounded-full'>
                      <div
                        className={`h-2 rounded-full ${status.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className='text-xs text-gray-500'>
                Total item yang dipantau: {formatNumber(stockTotal)}.
              </p>
            </div>
          </Card>

          <Card padding='lg' className='h-full lg:col-span-2'>
            <CardHeader
              title='Peringatan Stok Rendah'
              subtitle='Prioritaskan restock untuk item berikut'
            />

            {lowStockAlerts.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm divide-y divide-gray-200'>
                  <thead className='text-xs tracking-wide text-gray-500 uppercase bg-gray-50'>
                    <tr>
                      <th className='px-4 py-2 text-left'>PLU</th>
                      <th className='px-4 py-2 text-left'>Nama Produk</th>
                      <th className='px-4 py-2 text-left'>Stok Saat Ini</th>
                      <th className='px-4 py-2 text-left'>Minimum</th>
                      <th className='px-4 py-2 text-left'>Harga / Unit</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {lowStockAlerts.map((item) => (
                      <tr
                        key={item.id || item.plu}
                        className='hover:bg-red-50/40'
                      >
                        <td className='px-4 py-2 font-medium text-gray-900'>
                          {item.plu}
                        </td>
                        <td className='px-4 py-2 text-gray-700'>{item.name}</td>
                        <td className='px-4 py-2 text-gray-700'>
                          {formatNumber(item.currentStockCartons)} karton /{' '}
                          {formatNumber(item.currentStockPieces)} pcs
                        </td>
                        <td className='px-4 py-2 text-gray-700'>
                          {formatNumber(item.minimumStock)}
                        </td>
                        <td className='px-4 py-2 text-gray-700'>
                          {formatCurrency(item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='text-sm text-gray-500'>
                Tidak ada item dengan stok rendah dalam 20 besar.
              </p>
            )}
          </Card>
        </div>

        <Card padding='lg'>
          <CardHeader
            title='Pergerakan Stok Terbaru'
            subtitle='Aktivitas stok dalam 30 hari terakhir'
          />

          {recentMovements.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-sm divide-y divide-gray-200'>
                <thead className='text-xs tracking-wide text-gray-500 uppercase bg-gray-50'>
                  <tr>
                    <th className='px-4 py-2 text-left'>PLU</th>
                    <th className='px-4 py-2 text-left'>Nama Produk</th>
                    <th className='px-4 py-2 text-left'>Stok (Karton)</th>
                    <th className='px-4 py-2 text-left'>Stok (Pieces)</th>
                    <th className='px-4 py-2 text-left'>Harga / Unit</th>
                    <th className='px-4 py-2 text-left'>Terakhir diperbarui</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {recentMovements.map((movement) => (
                    <tr
                      key={movement.id || movement.plu}
                      className='hover:bg-blue-50/40'
                    >
                      <td className='px-4 py-2 font-medium text-gray-900'>
                        {movement.plu}
                      </td>
                      <td className='px-4 py-2 text-gray-700'>
                        {movement.name}
                      </td>
                      <td className='px-4 py-2 text-gray-700'>
                        {formatNumber(movement.currentStockCartons)}
                      </td>
                      <td className='px-4 py-2 text-gray-700'>
                        {formatNumber(movement.currentStockPieces)}
                      </td>
                      <td className='px-4 py-2 text-gray-700'>
                        {formatCurrency(movement.unitPrice)}
                      </td>
                      <td className='px-4 py-2 text-gray-700'>
                        {formatDateTime(movement.lastUpdated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className='text-sm text-gray-500'>
              Belum ada pergerakan stok dalam 30 hari terakhir.
            </p>
          )}
        </Card>
      </div>
    );
  };

  if (!userData) {
    return (
      <div className='flex items-center justify-center flex-1'>
        <LoadingState message='Menyiapkan laporan Anda...' />
      </div>
    );
  }

  const displayName = userData.firstName || userData.name || 'Pengguna';
  const isDefaultFilter = period === 'monthly' && !startDate && !endDate;

  return (
    <>
      <div className='p-6 space-y-6'>
        <Card padding='lg' className='bg-white/70 backdrop-blur'>
          <CardHeader
            title='Filter Laporan'
            subtitle='Pilih periode analitik dan rentang tanggal yang relevan'
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <div className='space-y-2'>
              <label className='text-xs font-semibold tracking-wide text-gray-600 uppercase'>
                Periode
              </label>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs font-semibold tracking-wide text-gray-600 uppercase'>
                Tanggal Mulai
              </label>
              <input
                type='date'
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                max={endDate || undefined}
              />
            </div>

            <div className='space-y-2'>
              <label className='text-xs font-semibold tracking-wide text-gray-600 uppercase'>
                Tanggal Selesai
              </label>
              <input
                type='date'
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                min={startDate || undefined}
              />
            </div>

            <div className='flex items-end'>
              <button
                type='button'
                onClick={handleResetFilters}
                disabled={isDefaultFilter}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  isDefaultFilter
                    ? 'cursor-not-allowed border-gray-200 text-gray-400'
                    : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                }`}
              >
                Atur ulang filter
              </button>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 mt-6 md:grid-cols-3'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:text-blue-700'
                }`}
              >
                <p className='text-sm font-semibold'>{tab.label}</p>
                <p className='mt-1 text-xs text-gray-500'>{tab.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {activeTab === 'operational' && renderOperationalSection()}
        {activeTab === 'financial' && renderFinancialSection()}
        {activeTab === 'inventory' && renderInventorySection()}
      </div>
    </>
  );
};

export default Reporting;


