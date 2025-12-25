import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import useStockMovementsPage from '../hooks/useStockMovementsPage';
import StockMovementFilters from '../components/stockMovements/StockMovementFilters.jsx';
import StockMovementTable from '../components/stockMovements/StockMovementTable.jsx';
import CreateStockInModal from '../components/stockMovements/CreateStockInModal.jsx';
import CreateStockOutModal from '../components/stockMovements/CreateStockOutModal.jsx';
import { getItems } from '../services/itemService';
import supplierService from '../services/supplierService';
import toastService from '../services/toastService';

const StockMovements = () => {
  const {
    filters,
    movements,
    pagination,
    loading,
    searchLoading,
    error,
    handleFiltersChange,
    handleResetFilters,
    handlePageChange,
    handleLimitChange,
    fetchMovements,
    createStockInMovement,
    createStockOutMovement,
    updateMovementNotes,
  } = useStockMovementsPage();

  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [itemOptions, setItemOptions] = useState([]);
  const [editingMovement, setEditingMovement] = useState(null);
  const [editNotesValue, setEditNotesValue] = useState('');
  const [editNotesLoading, setEditNotesLoading] = useState(false);

  const [supplierOptions, setSupplierOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const loadReferenceData = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const [itemResult, supplierResult] = await Promise.allSettled([
        getItems(1, 100),
        supplierService.getAllSuppliers(1, 100),
      ]);

      if (itemResult.status === 'fulfilled') {
        const payload = itemResult.value;
        if (payload?.success === false) {
          toastService.error(
            payload?.message || 'Gagal memuat daftar item.'
          );
        } else {
          const rawItems =
            payload?.data?.data ||
            payload?.data?.items ||
            payload?.data ||
            payload?.items ||
            payload?.inventories ||
            [];
          const itemsArray = Array.isArray(rawItems)
            ? rawItems
            : Array.isArray(rawItems?.data)
              ? rawItems.data
              : [];
          setItemOptions(itemsArray);
        }
      } else {
        toastService.error(
          itemResult.reason?.message || 'Gagal memuat daftar item.'
        );
      }

      if (supplierResult.status === 'fulfilled') {
        const payload = supplierResult.value;
        if (payload?.success === false) {
          toastService.error(
            payload?.message || 'Gagal memuat daftar supplier.'
          );
        } else {
          const rawSuppliers =
            payload?.data?.data ||
            payload?.data?.items ||
            payload?.data ||
            payload?.items ||
            payload?.suppliers ||
            [];
          const suppliersArray = Array.isArray(rawSuppliers)
            ? rawSuppliers
            : Array.isArray(rawSuppliers?.data)
              ? rawSuppliers.data
              : [];
          setSupplierOptions(suppliersArray);
        }
      } else {
        toastService.error(
          supplierResult.reason?.message || 'Gagal memuat daftar supplier.'
        );
      }
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const handleRetry = useCallback(() => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    const limit =
      pagination?.itemsPerPage || pagination?.limit || undefined;
    fetchMovements(currentPage, limit);
  }, [fetchMovements, pagination]);

  const handleEditNotes = useCallback((movement) => {
    setEditingMovement(movement);
    setEditNotesValue(movement.notes || '');
  }, []);

  const handleCloseEditNotes = useCallback(() => {
    setEditingMovement(null);
    setEditNotesValue('');
  }, []);

  const handleSaveNotes = useCallback(async () => {
    if (!editingMovement?.id) return;

    setEditNotesLoading(true);
    try {
      await updateMovementNotes(editingMovement.id, editNotesValue);
      handleCloseEditNotes();
    } catch (err) {
      // Error handling already managed in hook/toast
    } finally {
      setEditNotesLoading(false);
    }
  }, [editingMovement, editNotesValue, updateMovementNotes, handleCloseEditNotes]);



  return (
    <div className='p-3 space-y-3'>
      <div className='rounded-lg bg-white p-3 shadow'>
        <div className='space-y-3'>
          {/* Header */}
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h1 className='text-sm font-semibold text-gray-900'>Inventory</h1>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setShowStockOutModal(true)}
                className='inline-flex items-center rounded bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors'
              >
                <ArrowUpTrayIcon className='mr-1.5 h-4 w-4' aria-hidden='true' />
                Stock Out
              </button>
              <button
                type='button'
                onClick={() => setShowStockInModal(true)}
                className='inline-flex items-center rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors'
              >
                <ArrowDownTrayIcon className='mr-1.5 h-4 w-4' aria-hidden='true' />
                Stock In
              </button>
            </div>
          </div>

          {/* Filters */}
          <StockMovementFilters
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
            isLoading={loading}
            itemOptions={itemOptions}
          />

          {/* Error */}
          {error && (
            <div className='flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800'>
              <span>Gagal memuat data: {error}</span>
              <button
                type='button'
                onClick={handleRetry}
                className='rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700'
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Table */}
          <StockMovementTable
            movements={movements}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            loading={loading}
            searchLoading={searchLoading}
            onEditNotes={handleEditNotes}
          />
        </div>
      </div>

      <CreateStockInModal
        show={showStockInModal}
        onClose={() => setShowStockInModal(false)}
        onSubmit={createStockInMovement}
        itemOptions={itemOptions}
        suppliers={supplierOptions}
        optionsLoading={optionsLoading}
      />

      <CreateStockOutModal
        show={showStockOutModal}
        onClose={() => setShowStockOutModal(false)}
        onSubmit={createStockOutMovement}
        itemOptions={itemOptions}
        optionsLoading={optionsLoading}
      />

      {/* Edit Notes Modal */}
      {editingMovement && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
            <h3 className='mb-4 text-lg font-semibold text-gray-900'>
              Edit Notes
            </h3>
            <p className='mb-2 text-sm text-gray-500'>
              Movement: {editingMovement.movementNumber || editingMovement.id}
            </p>
            <textarea
              value={editNotesValue}
              onChange={(e) => setEditNotesValue(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
              rows={4}
              placeholder='Masukkan catatan...'
              maxLength={255}
            />
            <p className='mt-1 text-xs text-gray-400'>
              {editNotesValue.length}/255 karakter
            </p>
            <div className='mt-4 flex justify-end gap-3'>
              <button
                type='button'
                onClick={handleCloseEditNotes}
                disabled={editNotesLoading}
                className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                Batal
              </button>
              <button
                type='button'
                onClick={handleSaveNotes}
                disabled={editNotesLoading}
                className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50'
              >
                {editNotesLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMovements;
