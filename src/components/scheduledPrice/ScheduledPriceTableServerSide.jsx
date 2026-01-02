import React, { useMemo, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { PencilIcon, EyeIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '../../utils/formatUtils';
import { useScheduledPricesQuery } from '../../hooks/useScheduledPricesQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import { useConfirmationDialog } from '../ui';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import customerService from '../../services/customerService';

const columnHelper = createColumnHelper();

const STATUS_OPTIONS = [
    { id: 'PENDING', label: 'Pending' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'EXPIRED', label: 'Expired' },
    { id: 'CANCELLED', label: 'Cancelled' },
];

const ScheduledPriceTableServerSide = forwardRef(({
    onView,
    onEdit,
    onCancel,
    onDelete,
    deleteLoading = false,
    companyId,
}, ref) => {
    const [deleteId, setDeleteId] = useState(null);
    const { showDialog, hideDialog, ConfirmationDialog } = useConfirmationDialog();

    // Fetch all customers upfront like PurchaseOrderTableServerSide
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await customerService.getAllCustomers(1, 9999);
                const data = response?.data?.data || response?.data || [];
                setCustomers(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch customers:', error);
                setCustomers([]);
            }
        };
        fetchCustomers();
    }, []);

    // Add "Semua" option for null customerId
    const customerOptions = useMemo(() => {
        const list = Array.isArray(customers) ? customers : [];
        return [{ id: 'null', namaCustomer: 'Semua (Tanpa Customer)' }, ...list];
    }, [customers]);

    // Map frontend filter names to backend parameter names
    const getQueryParams = useMemo(
        () => ({ filters, ...rest }) => {
            const mappedFilters = { ...filters };

            // Map range filters
            ['harga', 'newPrice', 'pot1', 'pot2', 'ppn'].forEach(field => {
                if (mappedFilters[field] && typeof mappedFilters[field] === 'object') {
                    const paramName = field === 'newPrice' ? 'new_price' : field;
                    if (mappedFilters[field].min) {
                        mappedFilters[`${paramName}_min`] = mappedFilters[field].min;
                    }
                    if (mappedFilters[field].max) {
                        mappedFilters[`${paramName}_max`] = mappedFilters[field].max;
                    }
                    delete mappedFilters[field];
                }
            });

            // Map date range filter
            if (mappedFilters.effectiveDate && typeof mappedFilters.effectiveDate === 'object') {
                if (mappedFilters.effectiveDate.from) {
                    mappedFilters.effectiveDateFrom = mappedFilters.effectiveDate.from;
                }
                if (mappedFilters.effectiveDate.to) {
                    mappedFilters.effectiveDateTo = mappedFilters.effectiveDate.to;
                }
                delete mappedFilters.effectiveDate;
            }

            // Map customer filter array to customerIds
            if (mappedFilters.customer) {
                if (Array.isArray(mappedFilters.customer) && mappedFilters.customer.length > 0) {
                    mappedFilters.customerIds = mappedFilters.customer;
                }
                delete mappedFilters.customer;
            }

            // Map status filter array to statuses
            if (mappedFilters.status) {
                if (Array.isArray(mappedFilters.status) && mappedFilters.status.length > 0) {
                    mappedFilters.statuses = mappedFilters.status;
                }
                delete mappedFilters.status;
            }

            // Add locked company filter
            if (companyId) {
                mappedFilters.companyId = companyId;
            }

            return {
                ...rest,
                filters: mappedFilters,
            };
        },
        [companyId]
    );

    const {
        data: schedules,
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
        queryHook: useScheduledPricesQuery,
        selectData: (response) => response?.schedules ?? [],
        selectPagination: (response) => response?.pagination,
        initialPage: 1,
        initialLimit: 10,
        initialSorting: [{ id: 'effectiveDate', desc: true }],
        getQueryParams,
    });

    useImperativeHandle(ref, () => ({
        refresh: refetch,
    }));

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
            ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800' },
            EXPIRED: { label: 'Expired', className: 'bg-gray-100 text-gray-800' },
            CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        return (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const handleDeleteClick = (schedule) => {
        setDeleteId(schedule.id);
        showDialog({
            title: 'Hapus Schedule',
            message: `Apakah anda yakin ingin menghapus schedule untuk "${schedule.itemPrice?.item?.nama_barang}"?`,
            confirmText: 'Hapus',
            onConfirm: async () => {
                if (onDelete) {
                    await onDelete(schedule.id);
                }
                setDeleteId(null);
                hideDialog();
                refetch();
            },
            onCancel: () => {
                setDeleteId(null);
                hideDialog();
            },
        });
    };

    const columns = useMemo(
        () => [
            // Item Name
            columnHelper.accessor('itemPrice.item.nama_barang', {
                id: 'nama_barang',
                size: 180,
                minSize: 180,
                header: ({ column }) => (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs">Item Name</div>
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
            // PLU
            columnHelper.accessor('itemPrice.item.plu', {
                id: 'plu',
                size: 70,
                minSize: 70,
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
            // Customer
            columnHelper.accessor('customer.namaCustomer', {
                id: 'customer',
                size: 100,
                minSize: 100,
                enableColumnFilter: true,
                filterFn: () => true,
                header: ({ column }) => (
                    <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                        <div className="font-medium text-xs">Customer</div>
                        <AutocompleteCheckboxLimitTag
                            options={customerOptions}
                            value={column.getFilterValue() ?? []}
                            onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
                            placeholder="All"
                            displayKey="namaCustomer"
                            valueKey="id"
                            limitTags={1}
                            size="small"
                            fetchOnClose
                        />
                    </div>
                ),
                cell: (info) => (
                    <span className="text-xs">{info.row.original.customer?.namaCustomer || 'Semua'}</span>
                ),
            }),
            // Base Price (from itemPrice.harga)
            columnHelper.accessor('itemPrice.harga', {
                id: 'harga',
                size: 80,
                minSize: 80,
                enableColumnFilter: true,
                filterFn: () => true,
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { min: '', max: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">Base Price</div>
                            <div className="flex flex-col gap-0.5">
                                <input
                                    type="number"
                                    value={filterValue.min ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                                    placeholder="Min"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <input
                                    type="number"
                                    value={filterValue.max ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                                    placeholder="Max"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    );
                },
                cell: (info) => (
                    <span className="text-xs text-right block">{formatCurrency(info.getValue() ?? 0)}</span>
                ),
            }),
            // New Price (from schedule.harga)
            columnHelper.accessor('harga', {
                id: 'newPrice',
                size: 80,
                minSize: 80,
                enableColumnFilter: true,
                filterFn: () => true,
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { min: '', max: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">New Price</div>
                            <div className="flex flex-col gap-0.5">
                                <input
                                    type="number"
                                    value={filterValue.min ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                                    placeholder="Min"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <input
                                    type="number"
                                    value={filterValue.max ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                                    placeholder="Max"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    );
                },
                cell: (info) => (
                    <span className="text-xs text-right block text-green-600 font-medium">{formatCurrency(info.getValue() ?? 0)}</span>
                ),
            }),
            // POT A
            columnHelper.accessor('pot1', {
                id: 'pot1',
                size: 85,
                minSize: 85,
                enableColumnFilter: true,
                filterFn: () => true,
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { min: '', max: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">POT A</div>
                            <div className="flex flex-col gap-0.5">
                                <input
                                    type="number"
                                    value={filterValue.min ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                                    placeholder="Min"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <input
                                    type="number"
                                    value={filterValue.max ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                                    placeholder="Max"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    );
                },
                cell: (info) => <span className="text-xs text-center block">{info.getValue() ?? 0}%</span>,
            }),
            // POT B
            columnHelper.accessor('pot2', {
                id: 'pot2',
                size: 85,
                minSize: 85,
                enableColumnFilter: true,
                filterFn: () => true,
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { min: '', max: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">POT B</div>
                            <div className="flex flex-col gap-0.5">
                                <input
                                    type="number"
                                    value={filterValue.min ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                                    placeholder="Min"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <input
                                    type="number"
                                    value={filterValue.max ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                                    placeholder="Max"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    );
                },
                cell: (info) => <span className="text-xs text-center block">{info.getValue() ?? 0}%</span>,
            }),
            // PPN
            columnHelper.accessor('ppn', {
                id: 'ppn',
                size: 85,
                minSize: 85,
                enableColumnFilter: true,
                filterFn: () => true,
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { min: '', max: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">PPN</div>
                            <div className="flex flex-col gap-0.5">
                                <input
                                    type="number"
                                    value={filterValue.min ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                                    placeholder="Min"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <input
                                    type="number"
                                    value={filterValue.max ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                                    placeholder="Max"
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    );
                },
                cell: (info) => <span className="text-xs text-center block">{info.getValue() ?? 0}%</span>,
            }),
            // Effective Date
            columnHelper.accessor('effectiveDate', {
                id: 'effectiveDate',
                size: 95,
                minSize: 95,
                enableColumnFilter: true,
                filterFn: () => true,
                header: ({ column }) => {
                    const filterValue = column.getFilterValue() || { from: '', to: '' };
                    return (
                        <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            <div className="font-medium text-xs">Effective</div>
                            <div className="flex flex-col gap-0.5">
                                <input
                                    type="date"
                                    value={filterValue.from ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, from: e.target.value }); setPage(1); }}
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <input
                                    type="date"
                                    value={filterValue.to ?? ''}
                                    onChange={(e) => { column.setFilterValue({ ...filterValue, to: e.target.value }); setPage(1); }}
                                    className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    );
                },
                cell: (info) => <span className="text-xs">{formatDate(info.getValue())}</span>,
            }),
            // Status
            columnHelper.accessor('status', {
                id: 'status',
                size: 70,
                minSize: 70,
                enableColumnFilter: true,
                filterFn: () => true,
                header: ({ column }) => (
                    <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                        <div className="font-medium text-xs">Status</div>
                        <AutocompleteCheckboxLimitTag
                            options={STATUS_OPTIONS}
                            value={column.getFilterValue() ?? []}
                            onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
                            placeholder="All"
                            displayKey="label"
                            valueKey="id"
                            limitTags={1}
                            size="small"
                            fetchOnClose
                        />
                    </div>
                ),
                cell: (info) => getStatusBadge(info.getValue()),
            }),
            // Actions
            columnHelper.display({
                id: 'actions',
                size: 70,
                minSize: 70,
                header: () => <div className="font-medium text-xs">Actions</div>,
                cell: ({ row }) => {
                    const schedule = row.original;
                    const canEdit = schedule.status === 'PENDING';
                    const canCancel = schedule.status === 'PENDING' || schedule.status === 'ACTIVE';
                    const canDelete = schedule.status === 'PENDING' || schedule.status === 'CANCELLED';

                    return (
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={() => onView && onView(schedule)}
                                className="p-0.5 text-blue-600 hover:text-blue-800"
                                title="View"
                            >
                                <EyeIcon className="h-4 w-4" />
                            </button>
                            {canEdit && (
                                <button
                                    onClick={() => onEdit && onEdit(schedule)}
                                    className="p-0.5 text-yellow-600 hover:text-yellow-800"
                                    title="Edit"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                            )}
                            {canCancel && (
                                <button
                                    onClick={() => onCancel && onCancel(schedule)}
                                    className="p-0.5 text-orange-600 hover:text-orange-800"
                                    title="Cancel"
                                >
                                    <XCircleIcon className="h-4 w-4" />
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => handleDeleteClick(schedule)}
                                    className="p-0.5 text-red-600 hover:text-red-800"
                                    title="Delete"
                                    disabled={deleteLoading && deleteId === schedule.id}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    );
                },
            }),
        ],
        [customerOptions, setPage, onView, onEdit, onCancel, deleteLoading, deleteId]
    );

    const table = useReactTable({
        ...tableOptions,
        columns,
    });

    if (error) {
        return (
            <div className="text-red-500 py-4 text-center">
                Error loading schedules: {error.message}
            </div>
        );
    }

    return (
        <div className="space-y-2">

            {/* Table */}
            <DataTable
                table={table}
                isLoading={isLoading || isFetching}
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
                cellClassName="px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900"
                emptyCellClassName="px-1.5 py-0.5 text-center text-gray-500"
            />

            {/* Pagination */}
            {!isLoading && !isFetching && !error && (
                <DataTablePagination
                    table={table}
                    pagination={pagination}
                    itemLabel="schedule"
                    pageSizeOptions={[5, 10, 20, 50, 100]}
                />
            )}

            <ConfirmationDialog />
        </div>
    );
});

ScheduledPriceTableServerSide.displayName = 'ScheduledPriceTableServerSide';

export default ScheduledPriceTableServerSide;
