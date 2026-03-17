import React, { useMemo } from 'react';
import Pagination from '../common/Pagination.jsx';
import { TableLoading } from '../ui/Loading.jsx';
import { StatusBadge } from '../ui/Badge.jsx';
import { formatDateTime } from '../../utils/formatUtils';

const resolveStatusVariant = (status) => {
    switch (status) {
        case 'COMPLETED':
            return 'success';
        case 'PENDING':
            return 'warning';
        case 'REJECTED':
            return 'danger';
        default:
            return 'secondary';
    }
};

const resolveTypeLabel = (type) => {
    if (!type) {
        return '-';
    }

    return type
        .toString()
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const StokGantungTable = ({
    movements = [],
    pagination,
    onPageChange,
    onLimitChange,
    loading = false,
    searchLoading = false,
    onClassify,
    classifyLoadingId = null,
    onEditNotes,
}) => {
    const hasMovements = Array.isArray(movements) && movements.length > 0;

    const renderedMovements = useMemo(() => {
        if (!hasMovements) {
            return [];
        }

        return movements.map((movement) => {
            const items = Array.isArray(movement.items) ? movement.items : [];

            // Get unique product names from items
            const uniqueProducts = new Map();
            items.forEach((item) => {
                const itemId = item?.itemId || item?.item?.id;
                const productName = item?.item?.nama_barang ||
                    item?.inventory?.nama_barang ||
                    item?.inventory?.name ||
                    item?.productName || '-';
                if (itemId && !uniqueProducts.has(itemId)) {
                    uniqueProducts.set(itemId, productName);
                }
            });

            // Items = jumlah karton (unique items count)
            const cartonCount = uniqueProducts.size;

            // Qty = total PCS (sum of all quantities)
            const totalQuantity = items.reduce(
                (sum, item) => sum + Number(item?.quantity || 0),
                0
            );

            // Get all unique product names as array
            const productNames = Array.from(uniqueProducts.values());
            if (productNames.length === 0) {
                productNames.push('-');
            }

            return {
                id: movement.id,
                movementNumber: movement.movementNumber || '-',
                status: movement.status || 'UNKNOWN',
                notes: movement.notes || '',
                productNames,
                totalItems: cartonCount,
                totalQuantity,
                createdAt: movement.createdAt || movement.updatedAt || null,
                source: movement,
            };
        });
    }, [hasMovements, movements]);

    if (loading && !searchLoading) {
        return (
            <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
                <TableLoading rows={5} columns={8} className='p-6' />
            </div>
        );
    }

    return (
        <div className='space-y-2'>
            <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
                <div className='overflow-x-auto'>
                    <table className='min-w-[980px] w-full divide-y divide-gray-200 text-xs table-fixed'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th
                                    scope='col'
                                    className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    No. Retur
                                </th>
                                <th
                                    scope='col'
                                    className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Status
                                </th>
                                <th
                                    scope='col'
                                    className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Produk
                                </th>
                                <th
                                    scope='col'
                                    className='px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                    title='Jumlah jenis barang'
                                >
                                    Items
                                </th>
                                <th
                                    scope='col'
                                    className='px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                    title='Total kuantitas (PCS)'
                                >
                                    Qty
                                </th>
                                <th
                                    scope='col'
                                    className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Tanggal
                                </th>
                                <th
                                    scope='col'
                                    className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Notes
                                </th>
                                <th
                                    scope='col'
                                    className='px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100 bg-white'>
                            {renderedMovements.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className='px-3 py-6 text-center text-xs text-gray-500'
                                    >
                                        {searchLoading
                                            ? 'Mencari stok gantung...'
                                            : 'Tidak ada stok gantung ditemukan.'}
                                    </td>
                                </tr>
                            ) : (
                                renderedMovements.map((movement) => {
                                    const classificationEnabled =
                                        typeof onClassify === 'function' &&
                                        movement.status === 'PENDING';

                                    const isClassifying = classifyLoadingId === movement.id;

                                    return (
                                        <tr key={movement.id || movement.movementNumber} className='transition-colors hover:bg-gray-50'>
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900'>
                                                {movement.movementNumber}
                                            </td>
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900'>
                                                <StatusBadge
                                                    status={resolveTypeLabel(movement.status)}
                                                    variant={resolveStatusVariant(movement.status)}
                                                    size='xs'
                                                    dot
                                                />
                                            </td>
                                            <td className='px-2.5 py-1.5 text-xs text-gray-900'>
                                                <div className='max-w-[250px]'>
                                                    {movement.productNames.map((name, idx) => (
                                                        <div key={idx} className='truncate' title={name}>
                                                            {name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-right text-xs text-gray-500'>
                                                {movement.totalItems.toLocaleString('id-ID')}
                                            </td>
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-right text-xs text-gray-500'>
                                                {movement.totalQuantity.toLocaleString('id-ID')}
                                            </td>
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-500'>
                                                {formatDateTime(movement.createdAt)}
                                            </td>
                                            <td className='px-2.5 py-1.5 text-xs text-gray-500'>
                                                <div className='max-w-[200px] truncate' title={movement.notes}>
                                                    {movement.notes || '-'}
                                                </div>
                                            </td>
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-right text-xs text-gray-500'>
                                                <div className='flex justify-end gap-1'>
                                                    {onEditNotes && (
                                                        <button
                                                            type='button'
                                                            onClick={() => onEditNotes(movement.source)}
                                                            className='inline-flex h-7 items-center justify-center rounded border border-gray-200 px-2 text-xs text-gray-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {classificationEnabled && (
                                                        <>
                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    onClassify(movement.source, 'restock')
                                                                }
                                                                disabled={isClassifying}
                                                                className='inline-flex h-7 items-center justify-center rounded border border-gray-200 px-2 text-xs text-gray-500 hover:border-green-200 hover:bg-green-50 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-60'
                                                            >
                                                                {isClassifying ? 'Memproses...' : 'Restock'}
                                                            </button>
                                                            <button
                                                                type='button'
                                                                onClick={() =>
                                                                    onClassify(movement.source, 'reject')
                                                                }
                                                                disabled={isClassifying}
                                                                className='inline-flex h-7 items-center justify-center rounded border border-gray-200 px-2 text-xs text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60'
                                                            >
                                                                {isClassifying ? 'Memproses...' : 'Reject'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    compact
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onLimitChange={onLimitChange}
                />
            </div>
        </div>
    );
};

export default StokGantungTable;
