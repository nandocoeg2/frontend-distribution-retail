import React, { useMemo, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatUtils';
import { useItemsQuery } from '../../hooks/useItemsQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import { useConfirmationDialog } from '../ui';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import { getCompanies } from '../../services/companyService';
import DateFilter from '../common/DateFilter';

const columnHelper = createColumnHelper();

const ItemTableServerSide = forwardRef(({
    onViewDetail,
    onDelete,
    deleteLoading = false,
    selectedItemId = null,
    onRefresh,
}, ref) => {
    const [deleteId, setDeleteId] = useState(null);
    const [companies, setCompanies] = useState([]);
    const { showDialog, hideDialog, ConfirmationDialog } = useConfirmationDialog();

    // Fetch companies for filter dropdown
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await getCompanies(1, 100);
                const data = response?.data?.data || response?.data || [];
                setCompanies(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch companies:', error);
                setCompanies([]);
            }
        };
        fetchCompanies();
    }, []);

    const getQueryParams = useMemo(
        () => ({ filters, ...rest }) => {
            const mappedFilters = { ...filters };

            // Map company filter to companyIds array
            if (mappedFilters.company) {
                if (Array.isArray(mappedFilters.company) && mappedFilters.company.length > 0) {
                    mappedFilters.companyIds = mappedFilters.company;
                }
                delete mappedFilters.company;
            }

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
        initialLimit: 10,
        getQueryParams,
    });

    const formatCurrency = (value) => {
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return 'Rp 0';
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
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
            columnHelper.accessor('company.kode_company', {
                id: 'company',
                size: 70,
                header: ({ column }) => (
                    <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                        <div className="font-medium text-xs">Company</div>
                        <AutocompleteCheckboxLimitTag
                            options={companies}
                            value={column.getFilterValue() ?? []}
                            onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
                            placeholder="All"
                            displayKey="kode_company"
                            valueKey="id"
                            limitTags={1}
                            size="small"
                            fetchOnClose
                        />
                    </div>
                ),
                cell: (info) => (
                    <span className="text-xs font-medium">{info.row.original.company?.kode_company || '-'}</span>
                ),
            }),
            columnHelper.accessor('nama_barang', {
                size: 220,
                header: ({ column }) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">Nama Barang</div>
                        <input
                            type="text"
                            value={column.getFilterValue() ?? ''}
                            onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
                            placeholder="Filter..."
                            className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ),
                cell: (info) => (
                    <span className="text-xs truncate" title={info.getValue()}>
                        {info.getValue() || '-'}
                    </span>
                ),
            }),
            columnHelper.accessor('plu', {
                size: 65,
                header: ({ column }) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">PLU</div>
                        <input
                            type="text"
                            value={column.getFilterValue() ?? ''}
                            onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
                            placeholder="Filter..."
                            className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ),
                cell: (info) => <span className="text-xs font-medium">{info.getValue() || '-'}</span>,
            }),
            columnHelper.accessor('item_code', {
                size: 105,
                header: ({ column }) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">Kode Barang</div>
                        <input
                            type="text"
                            value={column.getFilterValue() ?? ''}
                            onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
                            placeholder="Filter..."
                            className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ),
                cell: (info) => <span className="text-xs">{info.getValue() || '-'}</span>,
            }),
            columnHelper.accessor('eanBarcode', {
                size: 105,
                header: ({ column }) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">Barcode</div>
                        <input
                            type="text"
                            value={column.getFilterValue() ?? ''}
                            onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
                            placeholder="Filter..."
                            className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ),
                cell: (info) => <span className="text-xs">{info.getValue() || '-'}</span>,
            }),
            columnHelper.accessor('itemPrice.harga', {
                id: 'basePrice',
                size: 75,
                enableColumnFilter: true,
                filterFn: () => true, // Server-side filtering, always return true
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { min: '', max: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">Base Price</div>
                            <div className="flex flex-col gap-0.5">
                                <input
                                    type="number"
                                    value={filterValue.min ?? ''}
                                    onChange={(e) => {
                                        column.setFilterValue({ ...filterValue, min: e.target.value });
                                        setPage(1);
                                    }}
                                    placeholder="Min"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                />
                                <input
                                    type="number"
                                    value={filterValue.max ?? ''}
                                    onChange={(e) => {
                                        column.setFilterValue({ ...filterValue, max: e.target.value });
                                        setPage(1);
                                    }}
                                    placeholder="Max"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                />
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
            columnHelper.accessor('itemStock.stok_quantity', {
                id: 'stock',
                size: 70,
                enableColumnFilter: true,
                filterFn: () => true, // Server-side filtering, always return true
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { min: '', max: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">Stock</div>
                            <div className="flex flex-col gap-0.5">
                                <input
                                    type="number"
                                    value={filterValue.min ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                                    placeholder="Min"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                />
                                <input
                                    type="number"
                                    value={filterValue.max ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                                    placeholder="Max"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                />
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
                size: 100,
                enableColumnFilter: true,
                filterFn: () => true, // Server-side filtering, always return true
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { from: '', to: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">Last Update</div>
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
            columnHelper.display({
                id: 'actions',
                size: 40,
                header: () => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">Action</div>
                        <div className="h-5"></div>
                    </div>
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex gap-0.5">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                }}
                                disabled={deleteLoading}
                                className="p-0.5 text-red-600 hover:text-red-900 disabled:opacity-50"
                                title="Delete"
                            >
                                <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    );
                },
                enableSorting: false,
                enableColumnFilter: false,
            }),
        ],
        [items, setPage, deleteLoading]
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

    const handleDelete = useCallback((itemId) => {
        setDeleteId(itemId);
        showDialog({
            title: 'Hapus Item',
            message: 'Apakah Anda yakin ingin menghapus item ini?',
            type: 'danger',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
    }, [showDialog]);

    const handleConfirmDelete = useCallback(async () => {
        if (deleteId && onDelete) {
            await onDelete(deleteId);
            setDeleteId(null);
            refetch?.();
        }
        hideDialog();
    }, [deleteId, onDelete, hideDialog, refetch]);

    const loading = isLoading || isFetching;

    return (
        <div className="space-y-2">
            {hasActiveFilters && (
                <div className="flex justify-end">
                    <button
                        onClick={resetFilters}
                        className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        <XMarkIcon className="h-3 w-3 mr-1" />
                        Reset Filter
                    </button>
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
                    return undefined;
                }}
                cellClassName="px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900"
                emptyCellClassName="px-1.5 py-0.5 text-center text-gray-500"
                onRowClick={onViewDetail}
            />

            {!loading && !error && (
                <DataTablePagination
                    table={table}
                    pagination={pagination}
                    itemLabel="item"
                    pageSizeOptions={[5, 10, 20, 50, 100]}
                />
            )}

            <ConfirmationDialog onConfirm={handleConfirmDelete} />
        </div>
    );
});

ItemTableServerSide.displayName = 'ItemTableServerSide';

export default ItemTableServerSide;
