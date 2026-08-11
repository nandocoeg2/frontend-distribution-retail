import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  PlusIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import useStockMovementsPage from '../hooks/useStockMovementsPage';
import StockInTable from '../components/stockMovements/StockInTable.jsx';
import CreateStockInModal from '../components/stockMovements/CreateStockInModal.jsx';
import toastService from '../services/toastService';
import { exportExcel } from '../services/stockMovementService';

const StockIn = () => {
  const {
    filters,
    movements,
    pagination,
    loading,
    searchLoading,
    handleFiltersChange,
    handlePageChange,
    handleLimitChange,
    fetchMovements,
    createStockInMovement,
  } = useStockMovementsPage();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Set default filter type to STOCK_IN on mount
  useEffect(() => {
    handleFiltersChange({ type: 'STOCK_IN' });
  }, [handleFiltersChange]);

  // Date range state
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');

  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      handleFiltersChange({
        dateFilterType: 'custom',
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
    } else {
      handleFiltersChange({
        dateFilterType: '',
        startDate: '',
        endDate: '',
      });
    }
  };

  const handleReload = () => {
    handleApplyDateRange();
    fetchMovements();
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      await exportExcel();
      toastService.success('Excel berhasil di-export.');
    } catch (err) {
      toastService.error(err?.message || 'Gagal mengexport Excel.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 space-y-6'>
      {/* Top Header & Actions */}
      <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900 uppercase'>
            Stock In
          </h1>
          <p className='text-xs text-gray-500 mt-1'>
            Kelola dan pantau seluruh transaksi penerimaan stok barang (Stock In).
          </p>
        </div>

        <div className='flex items-center gap-3 w-full md:w-auto justify-end'>
          <button
            type='button'
            onClick={handleExportExcel}
            disabled={exportLoading}
            className='inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50'
          >
            <ArrowDownTrayIcon className='h-4 w-4 text-gray-500' />
            {exportLoading ? 'Exporting...' : 'Export Excel'}
          </button>

          <button
            type='button'
            onClick={() => setShowCreateModal(true)}
            className='inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
          >
            <PlusIcon className='h-4 w-4' />
            Stock In Baru
          </button>
        </div>
      </div>

      {/* Date Range & Reload Controls Header (Matching Image 1 UI) */}
      <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Startdate:
            </label>
            <input
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            />
          </div>

          <div className='flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Enddate:
            </label>
            <input
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            />
          </div>

          <button
            type='button'
            onClick={handleReload}
            className='inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none'
          >
            <ArrowPathIcon className='h-4 w-4' />
            Reload
          </button>
        </div>

        {/* Global Search Bar */}
        <div className='w-full sm:w-64'>
          <input
            type='text'
            value={filters.search || ''}
            onChange={(e) => handleFiltersChange({ search: e.target.value })}
            placeholder='Cari nomor movement / supplier...'
            className='w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none'
          />
        </div>
      </div>

      {/* Stock In Table */}
      <StockInTable
        movements={movements}
        loading={loading}
        searchLoading={searchLoading}
      />

      {/* Pagination Controls */}
      <div className='bg-white px-4 py-3 rounded-xl border border-gray-200 flex items-center justify-between sm:px-6'>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-gray-700'>Tampilkan per halaman:</span>
          <select
            value={pagination.itemsPerPage}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className='rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none'
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-xs text-gray-700'>
            Halaman {pagination.currentPage} dari {pagination.totalPages || 1} ({pagination.totalItems} total data)
          </span>
          <div className='flex gap-1'>
            <button
              type='button'
              disabled={pagination.currentPage <= 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className='rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
            >
              Sebelumnya
            </button>
            <button
              type='button'
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className='rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Create Stock In Modal */}
      {showCreateModal && (
        <CreateStockInModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchMovements();
            toastService.success('Stock In berhasil dibuat.');
          }}
        />
      )}
    </div>
  );
};

export default StockIn;
