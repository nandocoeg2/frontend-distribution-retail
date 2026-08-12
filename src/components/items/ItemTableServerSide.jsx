import React, { useMemo, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatUtils';
import { useItemsQuery } from '../../hooks/useItemsQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable } from '../table';
import { useConfirmationDialog } from '../ui';

import DateFilter from '../common/DateFilter';
import Pagination from '../common/Pagination';

import TextColumnFilter from '../common/TextColumnFilter';
import RangeColumnFilter from '../common/RangeColumnFilter';

const columnHelper = createColumnHelper();

const ItemTableServerSide = forwardRef(({
    onViewDetail,
    selectedItems = [],
    onSelectionChange,
    onBulkDelete,
    isDeleting = false,
    hasSelectedItems = false,
    selectedItemId = null,
    onRefresh,
}, ref) => {
    const getQueryParams = useMemo(
        () => ({ filters, ...rest }) => {
            const mappedFilters = { ...filters };

            // Map basePrice range filter
            if (mappedFilters.basePrice && typeof mappedFilters.basePrice === 'object') {
                if (mappedFilters.basePrice.min) {
                    mappedFilters.price_min = mappedFilters.basePrice.min;
                }
                if (mappedFilters.basePrice.max) {
                    mappedFilters.price_max = mappedFilters.basePrice.max;
                }
                delete mappedFilters.basePrice;
            }

            // Map stock range filter
            if (mappedFilters.stock && typeof mappedFilters.stock === 'object') {
                if (mappedFilters.stock.min) {
                    mappedFilters.stock_min = mappedFilters.stock.min;
                }
                if (mappedFilters.stock.max) {
                    mappedFilters.stock_max = mappedFilters.stock.max;
                }
                delete mappedFilters.stock;
            }

            // Map updatedAt date range filter
            if (mappedFilters.updatedAt && typeof mappedFilters.updatedAt === 'object') {
                if (mappedFilters.updatedAt.from) {
                    mappedFilters.updated_from = mappedFilters.updatedAt.from;
                }
                if (mappedFilters.updatedAt.to) {
                    mappedFilters.updated_to = mappedFilters.updatedAt.to;
                }
                delete mappedFilters.updatedAt;
            }

            return {
                ...rest,
                filters: mappedFilters,
            };
        },
        []
    );

    const {
        data: items,
        pagination,
        setPage,
        setLimit,
        hasActiveFilters,
        isLoading,
        isFetching,
        error,
        resetFilters,
        tableOptions,
        refetch,
    } = useServerSideTable({
        queryHook: useItemsQuery,
        selectData: (response) => response?.items ?? [],
        selectPagination: (response) => response?.pagination,
        initialPage: 1,
        initialLimit: 9999,
        columnFilterDebounceMs: 0,
        getQueryParams,
    });

    const handleSelectAllInternalToggle = useCallback(() => {
        const currentPageItemIds = items.map((item) => item.id).filter(Boolean);

        const allCurrentPageSelected = currentPageItemIds.every((id) =>
            selectedItems.includes(id)
        );

        if (allCurrentPageSelected) {
            currentPageItemIds.forEach((id) => {
                if (selectedItems.includes(id) && onSelectionChange) {
                    onSelectionChange(id, false);
                }
            });
        } else {
            currentPageItemIds.forEach((id) => {
                if (!selectedItems.includes(id) && onSelectionChange) {
                    onSelectionChange(id, true);
                }
            });
        }
    }, [items, selectedItems, onSelectionChange]);

    const formatCurrency = (value) => {
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return 'Rp 0';
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numericValue);
    };

    const formatNumber = (value) => {
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return '0';
        }
        return new Intl.NumberFormat('id-ID').format(numericValue);
    };

    const columns = useMemo(
        () => [
            columnHelper.display({
                id: 'select',
                size: 40,
                header: () => {
                    const currentPageItemIds = items.map((item) => item.id).filter(Boolean);

                    const isAllSelected =
                        items.length > 0 &&
                        currentPageItemIds.length > 0 &&
                        currentPageItemIds.every((id) => selectedItems.includes(id));

                    const isIndeterminate =
                        currentPageItemIds.some((id) => selectedItems.includes(id)) &&
                        !isAllSelected;

                     return (
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(input) => { if (input) input.indeterminate = isIndeterminate; }}
                            onChange={handleSelectAllInternalToggle}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    );
                },
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={selectedItems.includes(row.original.id)}
                        onChange={(e) => onSelectionChange?.(row.original.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                ),
                enableSorting: false,
                enableColumnFilter: false,
            }),
            columnHelper.accessor('nama_barang', {
                size: 140,
                header: ({ column }) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">Nama Barang</div>
                        <TextColumnFilter column={column} placeholder="Filter..." />
                    </div>
                ),
                cell: (info) => (
                    <span className="text-xs truncate" title={info.getValue()}>
                        {info.getValue() || '-'}
                    </span>
                ),
            }),

            columnHelper.accessor('plu', {
                size: 100,
                header: ({ column }) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">PLU</div>
                        <TextColumnFilter column={column} placeholder="Filter..." />
                    </div>
                ),
                cell: (info) => <span className="text-xs font-medium">{info.getValue() || '-'}</span>,
            }),
            columnHelper.accessor('item_code', {
                size: 100,
                header: ({ column }) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">Kode Barang</div>
                        <TextColumnFilter column={column} placeholder="Filter..." />
                    </div>
                ),
                cell: (info) => <span className="text-xs">{info.getValue() || '-'}</span>,
            }),
            columnHelper.accessor('eanBarcode', {
                size: 100,
                header: ({ column }) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">Barcode</div>
                        <TextColumnFilter column={column} placeholder="Filter..." />
                    </div>
                ),
                cell: (info) => <span className="text-xs">{info.getValue() || '-'}</span>,
            }),
            columnHelper.accessor('itemPrice.harga', {
                id: 'basePrice',
                size: 100,
                enableColumnFilter: true,
                filterFn: () => true, // Server-side filtering, always return true
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { min: '', max: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">Base price</div>
                            <div className="flex flex-col gap-0.5">
                                <RangeColumnFilter column={column} setPage={setPage} />
                            </div>
                        </div>
                    );
                },
                cell: (info) => (
                    <span className="text-xs text-right block">
                        {formatCurrency(info.row.original.itemPrice?.harga ?? 0)}
                    </span>
                ),
            }),
            columnHelper.accessor('itemPrice.pot1', {
                id: 'pot1',
                size: 80,
                enableColumnFilter: false,
                header: () => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">pot 1</div>
                        <div className="h-5"></div>
                    </div>
                ),
                cell: (info) => {
                    const val = info.row.original.itemPrice?.pot1;
                    return (
                        <span className="text-xs text-right block">
                            {val != null ? `${val}%` : '-'}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('itemPrice.harga1', {
                id: 'hargaSetelahPot1',
                size: 110,
                enableColumnFilter: false,
                header: () => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">harga setelah pot 1</div>
                        <div className="h-5"></div>
                    </div>
                ),
                cell: (info) => (
                    <span className="text-xs text-right block">
                        {formatCurrency(info.row.original.itemPrice?.harga1 ?? 0)}
                    </span>
                ),
            }),
            columnHelper.accessor('itemPrice.pot2', {
                id: 'pot2',
                size: 80,
                enableColumnFilter: false,
                header: () => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">pot 2</div>
                        <div className="h-5"></div>
                    </div>
                ),
                cell: (info) => {
                    const val = info.row.original.itemPrice?.pot2;
                    return (
                        <span className="text-xs text-right block">
                            {val != null ? `${val}%` : '-'}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('itemPrice.harga2', {
                id: 'hargaSetelahPot2',
                size: 110,
                enableColumnFilter: false,
                header: () => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">harga setelah pot 2</div>
                        <div className="h-5"></div>
                    </div>
                ),
                cell: (info) => (
                    <span className="text-xs text-right block">
                        {formatCurrency(info.row.original.itemPrice?.harga2 ?? 0)}
                    </span>
                ),
            }),
            columnHelper.accessor('itemPrice.ppn', {
                id: 'ppn',
                size: 80,
                enableColumnFilter: false,
                header: () => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">PPN</div>
                        <div className="h-5"></div>
                    </div>
                ),
                cell: (info) => {
                    const val = info.row.original.itemPrice?.ppn;
                    return (
                        <span className="text-xs text-right block">
                            {val != null ? `${val}%` : '-'}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('itemStock.stok_quantity', {
                id: 'stock',
                size: 100,
                enableColumnFilter: true,
                filterFn: () => true, // Server-side filtering, always return true
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { min: '', max: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">Stok</div>
                            <div className="flex flex-col gap-0.5">
                                <RangeColumnFilter column={column} setPage={setPage} />
                            </div>
                        </div>
                    );
                },
                cell: (info) => (
                    <span className="text-xs text-right block">
                        {formatNumber(info.row.original.itemStock?.stok_quantity ?? 0)}
                    </span>
                ),
            }),
            columnHelper.accessor('updatedAt', {
                size: 65,
                enableColumnFilter: true,
                filterFn: () => true, // Server-side filtering, always return true
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { from: '', to: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">last update</div>
                            <div className="flex flex-col gap-0.5">
                                <DateFilter
                                    value={filterValue.from ?? ''}
                                    onChange={(val) => { column.setFilterValue({ ...filterValue, from: val }); setPage(1); }}
                                    placeholder="Dari"
                                />
                                <DateFilter
                                    value={filterValue.to ?? ''}
                                    onChange={(val) => { column.setFilterValue({ ...filterValue, to: val }); setPage(1); }}
                                    placeholder="Sampai"
                                />
                            </div>
                        </div>
                    );
                },
                cell: (info) => (
                    <span className="text-xs text-gray-600">
                        {info.getValue() ? formatDate(info.getValue()) : '-'}
                    </span>
                ),
            }),
        ],
        [items, setPage, selectedItems, onSelectionChange]
    );

    const table = useReactTable({
        ...tableOptions,
        columns,
    });

    useImperativeHandle(ref, () => ({
        refetch: () => refetch?.(),
        getFilters: () => {
            const state = table.getState();
            const filters = {};
            state.columnFilters.forEach((filter) => {
                filters[filter.id] = filter.value;
            });
            return filters;
        },
    }));

    const loading = isLoading || isFetching;

    return (
        <div className="space-y-2">
            {(hasActiveFilters || hasSelectedItems) && (
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                    {hasSelectedItems ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-green-700">
                                {selectedItems.length} dipilih
                            </span>
                            {onBulkDelete && (
                                <button
                                    onClick={onBulkDelete}
                                    disabled={isDeleting}
                                    className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white rounded transition-colors ${isDeleting
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Menghapus...
                                        </>
                                    ) : (
                                        <>
                                            <TrashIcon className="h-3.5 w-3.5 mr-1" />
                                            Hapus
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ) : <div />}
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 bg-white"
                        >
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Reset Filter
                        </button>
                    )}
                </div>
            )}

            <DataTable
                table={table}
                isLoading={loading}
                error={error}
                hasActiveFilters={hasActiveFilters}
                loadingMessage="Memuat data..."
                emptyMessage="Tidak ada data."
                emptyFilteredMessage="Tidak ada data sesuai filter."
                wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)]"
                tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
                headerRowClassName="bg-gray-50"
                headerCellClassName="px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider"
                bodyClassName="bg-white divide-y divide-gray-100"
                rowClassName="hover:bg-gray-50 h-7"
                getRowClassName={({ row }) => {
                    if (selectedItemId === row.original.id) return 'bg-blue-50 border-l-2 border-blue-500';
                    if (selectedItems.includes(row.original.id)) return 'bg-green-50';
                    return undefined;
                }}
                cellClassName="px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900"
                emptyCellClassName="px-1.5 py-0.5 text-center text-gray-500"
                onRowClick={onViewDetail}
                selectedRowId={selectedItemId}
            />
        </div>
    );
});

ItemTableServerSide.displayName = 'ItemTableServerSide';

export default ItemTableServerSide;
