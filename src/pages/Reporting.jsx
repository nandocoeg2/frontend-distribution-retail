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
  getItemReporting,
} from '../services/reportingService';
import OperationalDocumentModal from '../components/reporting/OperationalDocumentModal.jsx';
import OutstandingInvoicesModal from '../components/reporting/OutstandingInvoicesModal.jsx';
import StockStatusModal from '../components/reporting/StockStatusModal.jsx';
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
  ChevronRightIcon,
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
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
  custom: 'Custom',
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
    id: 'items',
    label: 'Items',
    description: 'Stok dan peringatan level stok',
  },
];

const periodOptions = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
  { value: 'custom', label: 'Custom' },
];
const Reporting = () => {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('operational');
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [operationalData, setOperationalData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [itemMetrics, setItemMetrics] = useState(null);
  const [loadingState, setLoadingState] = useState({
    operational: false,
    financial: false,
    items: false,
  });
  const [errorState, setErrorState] = useState({
    operational: '',
    financial: '',
    items: '',
  });

  // Modal states
  const [operationalModal, setOperationalModal] = useState({
    show: false,
    tab: 'purchaseOrders',
    statusFilter: '',
  });
  const [outstandingModalShow, setOutstandingModalShow] = useState(false);
  const [stockStatusModal, setStockStatusModal] = useState({
    show: false,
    statusKey: 'all',
  });

  const openStockStatusModal = (statusKey = 'all') => {
    setStockStatusModal({ show: true, statusKey });
  };
  const closeStockStatusModal = () => {
    setStockStatusModal({ show: false, statusKey: 'all' });
  };

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
      if (period === 'custom' && startDate && endDate && startDate > endDate) {
        const message = 'Tanggal mulai tidak boleh setelah tanggal akhir.';
        setErrorState((prev) => ({ ...prev, [scope]: message }));
        toastService.error(message);
        return false;
      }
      return true;
    },
    [period, startDate, endDate]
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
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
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
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
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

  const fetchItemMetrics = useCallback(async () => {
    setErrorState((prev) => ({ ...prev, items: '' }));
    setLoadingState((prev) => ({ ...prev, items: true }));

    try {
      const response = await getItemReporting();
      if (!response?.success) {
        throw new Error(
          response?.error?.message || 'Gagal memuat data laporan item.'
        );
      }

      setItemMetrics(response.data);
    } catch (error) {
      const message = error.message || 'Gagal memuat data laporan item.';
      setItemMetrics(null);
      setErrorState((prev) => ({ ...prev, items: message }));
      toastService.error(message);
    } finally {
      setLoadingState((prev) => ({ ...prev, items: false }));
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
    } else if (activeTab === 'items') {
      fetchItemMetrics();
    }
  }, [activeTab, fetchOperational, fetchFinancial, fetchItemMetrics, userData]);

  const handleResetFilters = () => {
    setPeriod('monthly');
    setStartDate('');
    setEndDate('');
  };

  const openOperationalModal = (tab = 'purchaseOrders', statusFilter = '') => {
    setOperationalModal({
      show: true,
      tab,
      statusFilter,
    });
  };

  const closeOperationalModal = () => {
    setOperationalModal((prev) => ({ ...prev, show: false }));
  };

  const renderStatusBreakdown = (
    title,
    typeKey,
    statuses = [],
    total = 0,
    accent = 'bg-blue-500'
  ) => (
    <Card padding='md' className='h-full flex flex-col justify-between'>
      <div>
        <div className='flex items-center justify-between pb-3 mb-3 border-b border-gray-100'>
          <div>
            <h3 className='text-base font-bold text-gray-900'>
              Status {title}
            </h3>
            <p className='text-xs text-gray-500'>
              Total {formatNumber(total)} dokumen
            </p>
          </div>
          <button
            type='button'
            onClick={() => openOperationalModal(typeKey, '')}
            className='text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center'
          >
            Lihat Semua
            <ChevronRightIcon className='w-3.5 h-3.5 ml-0.5' />
          </button>
        </div>

        <div className='space-y-3'>
          {Array.isArray(statuses) && statuses.length > 0 ? (
            statuses.map((status) => {
              const percentage = calculatePercentage(status.count, total);
              return (
                <div
                  key={status.statusCode || status.statusName}
                  onClick={() =>
                    openOperationalModal(typeKey, status.statusName)
                  }
                  className='p-2 -mx-2 rounded-xl transition-all hover:bg-gray-100/70 cursor-pointer group'
                  title={`Klik untuk melihat dokumen status ${status.statusName}`}
                >
                  <div className='flex items-center justify-between mb-1.5'>
                    <div>
                      <p className='text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors'>
                        {status.statusName}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {formatNumber(status.count)} dokumen
                      </p>
                    </div>
                    <span className='text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors'>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                      className={`h-2 rounded-full ${accent} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className='text-xs text-gray-500 py-4 text-center'>
              Belum ada data status untuk periode ini.
            </p>
          )}
        </div>
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
    } = metrics;

    const documentsData = {
      purchaseOrders: purchaseOrders.documents || [],
      packing: packing.documents || [],
      suratJalan: suratJalan.documents || [],
    };

    const totals = {
      purchaseOrders: purchaseOrders.total || 0,
      packing: packing.total || 0,
      suratJalan: suratJalan.total || 0,
    };

    return (
      <div className='space-y-6'>
        {/* Ringkasan Operasional */}
        <Card padding='lg'>
          <div className='flex items-center justify-between pb-3 mb-4 border-b border-gray-100'>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                Ringkasan Operasional
              </h2>
              <p className='text-xs text-gray-500'>
                {getPeriodLabel(responsePeriod || period)} •{' '}
                {formatDateRangeLabel(responseStartDate, responseEndDate)}
              </p>
            </div>
            <span className='text-xs text-gray-400 font-medium'>
              * Klik kartu untuk melihat daftar dokumen
            </span>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div
              onClick={() => openOperationalModal('purchaseOrders')}
              className='cursor-pointer group transition-transform duration-150 active:scale-95'
              title='Klik untuk melihat daftar Purchase Order'
            >
              <StatCard
                title='Total Purchase Order'
                value={formatNumber(purchaseOrders.total || 0)}
                icon={
                  <ChartBarIcon className='w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform' />
                }
                variant='primary'
                className='hover:border-blue-400 hover:shadow-md transition-all'
              />
            </div>
            <div
              onClick={() => openOperationalModal('packing')}
              className='cursor-pointer group transition-transform duration-150 active:scale-95'
              title='Klik untuk melihat daftar Packing'
            >
              <StatCard
                title='Total Packing'
                value={formatNumber(packing.total || 0)}
                icon={
                  <ClipboardDocumentListIcon className='w-8 h-8 text-green-600 group-hover:scale-110 transition-transform' />
                }
                variant='success'
                className='hover:border-green-400 hover:shadow-md transition-all'
              />
            </div>
            <div
              onClick={() => openOperationalModal('suratJalan')}
              className='cursor-pointer group transition-transform duration-150 active:scale-95'
              title='Klik untuk melihat daftar Surat Jalan'
            >
              <StatCard
                title='Total Surat Jalan'
                value={formatNumber(suratJalan.total || 0)}
                icon={
                  <TruckIcon className='w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform' />
                }
                variant='warning'
                className='hover:border-purple-400 hover:shadow-md transition-all'
              />
            </div>
          </div>
        </Card>

        {/* Status Breakdowns */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {renderStatusBreakdown(
            'Purchase Order',
            'purchaseOrders',
            purchaseOrders.byStatus,
            purchaseOrders.total,
            'bg-blue-500'
          )}
          {renderStatusBreakdown(
            'Packing',
            'packing',
            packing.byStatus,
            packing.total,
            'bg-green-500'
          )}
          {renderStatusBreakdown(
            'Surat Jalan',
            'suratJalan',
            suratJalan.byStatus,
            suratJalan.total,
            'bg-purple-500'
          )}
        </div>

        {/* Operational Document Modal */}
        <OperationalDocumentModal
          show={operationalModal.show}
          onClose={closeOperationalModal}
          initialTab={operationalModal.tab}
          initialStatusFilter={operationalModal.statusFilter}
          documentsData={documentsData}
          totals={totals}
        />
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
    const { overview = {}, outstandingPayments = {} } = metrics;

    return (
      <div className='space-y-6'>
        {/* Ringkasan Finansial */}
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

        {/* Outstanding Payments Section */}
        <div className='grid grid-cols-1 gap-6'>
          <Card padding='lg' className='h-full'>
            <div className='flex items-center justify-between pb-3 mb-4 border-b border-gray-100'>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>
                  Outstanding Payments
                </h3>
                <p className='text-xs text-gray-500'>
                  Tagihan invoice yang belum lunas
                </p>
              </div>
              <button
                type='button'
                onClick={() => setOutstandingModalShow(true)}
                className='text-xs font-semibold text-amber-700 bg-amber-100/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center'
              >
                Lihat Daftar Outstanding
                <ChevronRightIcon className='w-3.5 h-3.5 ml-1' />
              </button>
            </div>

            <div
              onClick={() => setOutstandingModalShow(true)}
              className='p-5 border-2 border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-2xl cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group'
              title='Klik untuk melihat siapa saja yang memiliki tagihan outstanding'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs font-bold tracking-wider uppercase text-amber-700'>
                    Total Outstanding
                  </p>
                  <p className='mt-1 text-3xl font-extrabold text-amber-800 tracking-tight'>
                    {formatCurrency(outstandingPayments.total)}
                  </p>
                  <p className='mt-1 text-sm font-medium text-amber-700'>
                    {formatNumber(outstandingPayments.count || 0)} invoice
                    menunggu pembayaran
                  </p>
                </div>
                <div className='p-3 bg-amber-100 rounded-xl text-amber-700 group-hover:scale-110 transition-transform'>
                  <BanknotesIcon className='w-8 h-8' />
                </div>
              </div>
              <div className='mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-800 font-medium'>
                <span>Klik untuk melihat rincian customer & invoice</span>
                <span className='font-bold group-hover:translate-x-1 transition-transform'>
                  Buka Rincian →
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Outstanding Invoices Modal */}
        <OutstandingInvoicesModal
          show={outstandingModalShow}
          onClose={() => setOutstandingModalShow(false)}
          invoices={outstandingPayments.invoices || []}
          totalAmount={outstandingPayments.total || 0}
          totalCount={outstandingPayments.count || 0}
        />
      </div>
    );
  };

  const renderItemSection = () => {
    if (loadingState.items) {
      return (
        <Card padding='lg'>
          <LoadingState message='Memuat metrik item...' />
        </Card>
      );
    }

    if (errorState.items) {
      return (
        <Card padding='lg' variant='warning'>
          <CardHeader
            title='Tidak dapat memuat data item'
            subtitle={errorState.items}
            action={
              <button
                type='button'
                onClick={fetchItemMetrics}
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

    if (!itemMetrics) {
      return (
        <Card padding='lg'>
          <CardHeader
            title='Data item belum tersedia'
            subtitle='Silakan muat ulang untuk mendapatkan data terbaru.'
            action={
              <button
                type='button'
                onClick={fetchItemMetrics}
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

    const { metrics = {} } = itemMetrics;
    const { overview = {}, stockStatus = {}, lowStockAlerts = [] } = metrics;

    const stockTotal =
      (stockStatus.zeroStock || 0) +
      (stockStatus.lowStock || 0) +
      (stockStatus.normalStock || 0);

    return (
      <div className='space-y-6'>
        <Card padding='lg'>
          <CardHeader
            title='Ringkasan Item'
            subtitle='Gambaran umum ketersediaan stok'
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
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
          </div>
        </Card>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Card padding='lg' className='h-full'>
            <div className='flex items-center justify-between pb-3 mb-4 border-b border-gray-100'>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>Status Stok</h3>
                <p className='text-xs text-gray-500'>
                  Distribusi stok saat ini
                </p>
              </div>
              <button
                type='button'
                onClick={() => openStockStatusModal('all')}
                className='text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors inline-flex items-center'
              >
                Lihat Detail
                <ChevronRightIcon className='w-3.5 h-3.5 ml-1' />
              </button>
            </div>
            <div className='space-y-3'>
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
                  <div
                    key={status.key}
                    onClick={() => openStockStatusModal(status.key)}
                    className='p-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer space-y-2'
                  >
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-semibold text-gray-800 flex items-center'>
                        {status.label}
                        <ChevronRightIcon className='w-3.5 h-3.5 ml-1 text-gray-400' />
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
              <p className='text-xs text-gray-500 pt-1'>
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

        {/* Stock Status Detail Modal */}
        <StockStatusModal
          show={stockStatusModal.show}
          onClose={closeStockStatusModal}
          initialStatusKey={stockStatusModal.statusKey}
          stockStatus={stockStatus}
        />
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

  const isDefaultFilter = period === 'monthly' && !startDate && !endDate;

  return (
    <>
      <div className='p-6 space-y-6'>
        {/* Compact Filter Container */}
        <div className='p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4'>
          {/* Top Row: Tabs navigation & Period Filter in a compact bar */}
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3'>
            {/* Tabs */}
            <div className='flex flex-wrap gap-1.5 p-1 bg-gray-100/80 rounded-xl'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type='button'
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Period selector & quick actions */}
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Periode:
              </span>
              <div className='inline-flex p-0.5 bg-gray-100/80 rounded-lg'>
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => {
                      setPeriod(option.value);
                      if (option.value !== 'custom') {
                        setStartDate('');
                        setEndDate('');
                      }
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      period === option.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {!isDefaultFilter && (
                <button
                  type='button'
                  onClick={handleResetFilters}
                  className='px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition border border-blue-200'
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Conditional Custom Date Inputs (only appears when period === 'custom') */}
          {period === 'custom' && (
            <div className='flex flex-wrap items-center gap-3 pt-1 animate-in fade-in duration-200 bg-blue-50/50 p-3 rounded-xl border border-blue-100'>
              <span className='text-xs font-bold text-blue-900'>
                Rentang Tanggal Kustom:
              </span>
              <div className='flex items-center gap-2'>
                <label className='text-xs text-gray-600 font-medium'>
                  Mulai:
                </label>
                <input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                  className='px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>

              <div className='flex items-center gap-2'>
                <label className='text-xs text-gray-600 font-medium'>
                  Selesai:
                </label>
                <input
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className='px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>

              <button
                type='button'
                onClick={() => {
                  if (activeTab === 'operational') fetchOperational();
                  else if (activeTab === 'financial') fetchFinancial();
                  else if (activeTab === 'items') fetchItemMetrics();
                }}
                className='px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition'
              >
                Terapkan
              </button>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        {activeTab === 'operational' && renderOperationalSection()}
        {activeTab === 'financial' && renderFinancialSection()}
        {activeTab === 'items' && renderItemSection()}
      </div>
    </>
  );
};

export default Reporting;
