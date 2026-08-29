import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import useStokGantungPage from '../hooks/useStokGantungPage';
import {
    StokGantungFilters,
    StokGantungTable,
    CreateReturnModal,
    ClassifyReturnModal,
    EditStokGantungModal,
} from '../components/stokGantung';
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
        updateMovementDetails,
    } = useStokGantungPage();

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [itemOptions, setItemOptions] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [classifyLoadingId, setClassifyLoadingId] = useState(null);
    const [selectedMovementForClassify, setSelectedMovementForClassify] = useState(null);
    const [classifyModalOpen, setClassifyModalOpen] = useState(false);
    const [editingMovement, setEditingMovement] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

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

    const handleRetry = useCallback(() => {
        const currentPage = pagination?.currentPage || pagination?.page || 1;
        const limit =
            pagination?.itemsPerPage || pagination?.limit || undefined;
        fetchMovements(currentPage, limit);
    }, [fetchMovements, pagination]);

    const handleOpenClassifyModal = useCallback((movement) => {
        setSelectedMovementForClassify(movement);
        setClassifyModalOpen(true);
    }, []);

    const handleCloseClassifyModal = useCallback(() => {
        setSelectedMovementForClassify(null);
        setClassifyModalOpen(false);
    }, []);

    const handleConfirmClassifyPayload = useCallback(
        async (payload) => {
            if (!payload?.movementId) return;
            setClassifyLoadingId(payload.movementId);
            try {
                await classifyReturnMovement(payload.movementId, payload);
                handleCloseClassifyModal();
            } catch (err) {
                // handled in hook/toast
            } finally {
                setClassifyLoadingId(null);
            }
        },
        [classifyReturnMovement, handleCloseClassifyModal]
    );

    const handleOpenEditModal = useCallback((movement) => {
        setEditingMovement(movement);
        setEditModalOpen(true);
    }, []);

    const handleCloseEditModal = useCallback(() => {
        setEditingMovement(null);
        setEditModalOpen(false);
    }, []);

    const handleSaveEdit = useCallback(async (payload) => {
        if (!payload?.movementId) return;

        setEditLoading(true);
        try {
            await updateMovementDetails(payload.movementId, {
                customerId: payload.customerId,
                ekspedisi: payload.ekspedisi,
                notes: payload.notes,
            });
            handleCloseEditModal();
        } catch (err) {
            // Error handling already managed in hook/toast
        } finally {
            setEditLoading(false);
        }
    }, [updateMovementDetails, handleCloseEditModal]);

    return (
        <div className='h-full flex flex-col p-3'>
            <div className='rounded-lg bg-white p-3 shadow flex-1 flex flex-col min-h-0'>
                <div className='space-y-3 flex-1 flex flex-col min-h-0'>
                    {/* Header */}
                    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-shrink-0'>
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
                        <div className='flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 flex-shrink-0'>
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
                    <div className='flex-1 flex flex-col min-h-0'>
                        <StokGantungTable
                            movements={movements}
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                            loading={loading}
                            searchLoading={searchLoading}
                            onClassify={handleOpenClassifyModal}
                            classifyLoadingId={classifyLoadingId}
                            onEdit={handleOpenEditModal}
                        />
                    </div>
                </div>
            </div>

            <CreateReturnModal
                show={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                onSubmit={createReturnMovement}
                itemOptions={itemOptions}
                optionsLoading={optionsLoading}
            />

            <ClassifyReturnModal
                isOpen={classifyModalOpen}
                onClose={handleCloseClassifyModal}
                movement={selectedMovementForClassify}
                onConfirm={handleConfirmClassifyPayload}
                isLoading={Boolean(classifyLoadingId)}
            />

            {/* Edit Stok Gantung Modal */}
            <EditStokGantungModal
                isOpen={editModalOpen}
                onClose={handleCloseEditModal}
                movement={editingMovement}
                onSave={handleSaveEdit}
                isLoading={editLoading}
            />
        </div>
    );
};

export default StokGantung;
