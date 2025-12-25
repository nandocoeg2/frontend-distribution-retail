import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import useStokGantungPage from '../hooks/useStokGantungPage';
import { StokGantungFilters, StokGantungTable, CreateReturnModal } from '../components/stokGantung';
import { useConfirmationDialog } from '../components/ui';
import { getItems } from '../services/itemService';
import toastService from '../services/toastService';

const StokGantung = () => {
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
        createReturnMovement,
        classifyReturnMovement,
        updateMovementNotes,
    } = useStokGantungPage();

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [itemOptions, setItemOptions] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [classifyLoadingId, setClassifyLoadingId] = useState(null);
    const [pendingClassification, setPendingClassification] = useState(null);
    const [editingMovement, setEditingMovement] = useState(null);
    const [editNotesValue, setEditNotesValue] = useState('');
    const [editNotesLoading, setEditNotesLoading] = useState(false);

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
            const itemResult = await getItems(1, 100);

            if (itemResult?.success === false) {
                toastService.error(
                    itemResult?.message || 'Gagal memuat daftar item.'
                );
            } else {
                const rawItems =
                    itemResult?.data?.data ||
                    itemResult?.data?.items ||
                    itemResult?.data ||
                    itemResult?.items ||
                    itemResult?.inventories ||
                    [];
                const itemsArray = Array.isArray(rawItems)
                    ? rawItems
                    : Array.isArray(rawItems?.data)
                        ? rawItems.data
                        : [];
                setItemOptions(itemsArray);
            }
        } catch (err) {
            toastService.error(
                err?.message || 'Gagal memuat daftar item.'
            );
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
                        <div>
                            <h1 className='text-sm font-semibold text-gray-900'>Stok Gantung</h1>
                            <p className='text-xs text-gray-500'>Daftar barang return yang menunggu klasifikasi</p>
                        </div>
                        <div className='flex gap-2'>
                            <button
                                type='button'
                                onClick={() => setShowReturnModal(true)}
                                className='inline-flex items-center rounded bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors'
                            >
                                <ArrowUturnLeftIcon className='mr-1.5 h-4 w-4' aria-hidden='true' />
                                Tambah Return
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <StokGantungFilters
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
                    <StokGantungTable
                        movements={movements}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                        loading={loading}
                        searchLoading={searchLoading}
                        onClassify={handleClassifyRequest}
                        classifyLoadingId={classifyLoadingId}
                        onEditNotes={handleEditNotes}
                    />
                </div>
            </div>

            <CreateReturnModal
                show={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                onSubmit={createReturnMovement}
                itemOptions={itemOptions}
                optionsLoading={optionsLoading}
            />

            <ConfirmationDialog onConfirm={handleConfirmClassify} />

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
                            className='w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500'
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
                                className='rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50'
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

export default StokGantung;
