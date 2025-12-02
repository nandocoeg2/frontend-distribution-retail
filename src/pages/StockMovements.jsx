import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import useStockMovementsPage from '../hooks/useStockMovementsPage';
import StockMovementFilters from '../components/stockMovements/StockMovementFilters.jsx';
import StockMovementTable from '../components/stockMovements/StockMovementTable.jsx';
import { Spinner } from '../components/ui/Loading.jsx';
import { useConfirmationDialog } from '../components/ui';
import CreateStockInModal from '../components/stockMovements/CreateStockInModal.jsx';
import CreateStockOutModal from '../components/stockMovements/CreateStockOutModal.jsx';
import CreateReturnModal from '../components/stockMovements/CreateReturnModal.jsx';
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
    createReturnMovement,
    classifyReturnMovement,
  } = useStockMovementsPage();

  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [itemOptions, setItemOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [classifyLoadingId, setClassifyLoadingId] = useState(null);
  const [pendingClassification, setPendingClassification] = useState(null);

  const {
    showDialog,
    hideDialog,
    setLoading: setDialogLoading,
    ConfirmationDialog,
    dialogState,
  } = useConfirmationDialog();

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

  useEffect(() => {
    if (!dialogState.show) {
      setPendingClassification(null);
    }
  }, [dialogState.show]);

  const handleRetry = useCallback(() => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    const limit =
      pagination?.itemsPerPage || pagination?.limit || undefined;
    fetchMovements(currentPage, limit);
  }, [fetchMovements, pagination]);

  const handleClassifyRequest = useCallback(
    (movement, action) => {
      if (!movement?.id) {
        toastService.error('ID return tidak ditemukan.');
        return;
      }

      setPendingClassification({ movement, action });

      const actionLabel = action === 'restock' ? 'Restock' : 'Reject';
      const message =
        action === 'restock'
          ? `Return ${movement.movementNumber || movement.id} akan diklasifikasikan sebagai restock. Stok item akan bertambah.`
          : `Return ${movement.movementNumber || movement.id} akan ditolak. Stok item tidak berubah.`;

      showDialog({
        title: 'Konfirmasi Klasifikasi Return',
        message,
        confirmText: actionLabel,
        type: action === 'restock' ? 'success' : 'danger',
      });
    },
    [showDialog]
  );

  const handleConfirmClassify = useCallback(async () => {
    if (!pendingClassification?.movement?.id) {
      hideDialog();
      return;
    }

    const { movement, action } = pendingClassification;
    setDialogLoading(true);
    setClassifyLoadingId(movement.id);

    try {
      await classifyReturnMovement(movement.id, action);
      hideDialog();
    } catch (err) {
      // Error handling already managed in hook/toast
    } finally {
      setDialogLoading(false);
      setClassifyLoadingId(null);
    }
  }, [classifyReturnMovement, hideDialog, pendingClassification, setDialogLoading]);

  if (loading && !movements?.length && !searchLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Stock Movements
              </h1>
              <p className='mt-1 text-sm text-gray-600'>
                Pantau seluruh aktivitas perpindahan stok, mulai dari stock-in
                supplier hingga retur pelanggan.
              </p>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <button
                type='button'
                onClick={() => setShowReturnModal(true)}
                className='inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 transition-colors'
              >
                <ArrowUturnLeftIcon className='mr-2 h-5 w-5' aria-hidden='true' />
                Catat Return
              </button>
              <button
                type='button'
                onClick={() => setShowStockOutModal(true)}
                className='inline-flex items-center justify-center rounded-md border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors'
              >
                <ArrowUpTrayIcon className='mr-2 h-5 w-5' aria-hidden='true' />
                Catat Stock Out
              </button>
              <button
                type='button'
                onClick={() => setShowStockInModal(true)}
                className='inline-flex items-center justify-center rounded-md border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors'
              >
                <ArrowDownTrayIcon className='mr-2 h-5 w-5' aria-hidden='true' />
                Catat Stock In
              </button>
            </div>
          </div>

          <div className='mb-6'>
            <StockMovementFilters
              filters={filters}
              onChange={handleFiltersChange}
              onReset={handleResetFilters}
              isLoading={loading}
            />
          </div>

          {error && (
            <div className='mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800'>
              <p className='font-medium'>Gagal memuat data: {error}</p>
              <button
                type='button'
                onClick={handleRetry}
                className='mt-3 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
              >
                Coba lagi
              </button>
            </div>
          )}

          <StockMovementTable
            movements={movements}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            loading={loading}
            searchLoading={searchLoading}
            onClassify={handleClassifyRequest}
            classifyLoadingId={classifyLoadingId}
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

      <CreateReturnModal
        show={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSubmit={createReturnMovement}
        itemOptions={itemOptions}
        optionsLoading={optionsLoading}
      />

      <ConfirmationDialog onConfirm={handleConfirmClassify} />
    </div>
  );
};

export default StockMovements;
