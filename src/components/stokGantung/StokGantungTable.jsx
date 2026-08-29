import React, { useMemo } from 'react';
import { TableLoading } from '../ui/Loading.jsx';
import { StatusBadge } from '../ui/Badge.jsx';
import { formatDate, formatDateTime } from '../../utils/formatUtils';

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
    loading = false,
    searchLoading = false,
    onClassify,
    classifyLoadingId = null,
    onEditNotes,
    onEdit,
}) => {
    const editHandler = onEdit || onEditNotes;
    const hasMovements = Array.isArray(movements) && movements.length > 0;

    const renderedMovements = useMemo(() => {
        if (!hasMovements) {
            return [];
        }

        return movements.map((movement) => {
            const items = Array.isArray(movement.items) ? movement.items : [];

            // Get unique product names and quantities
            const uniqueProducts = new Map();
            items.forEach((item) => {
                const itemId = item?.itemId || item?.item?.id;
                const productName =
                    item?.item?.nama_barang ||
                    item?.inventory?.nama_barang ||
                    item?.inventory?.name ||
                    item?.productName ||
                    '-';
                if (itemId && !uniqueProducts.has(itemId)) {
                    uniqueProducts.set(itemId, productName);
                }
            });

            // Items = jumlah jenis barang / karton
            const cartonCount = uniqueProducts.size;

            // Qty = total PCS
            const totalQuantity = items.reduce(
                (sum, item) => sum + Number(item?.quantity || 0),
                0
            );

            // Get all unique product names as array
            const productNames = Array.from(uniqueProducts.values());
            if (productNames.length === 0) {
                productNames.push('-');
            }

            // No PO
            const poNumber =
                movement.poNumber ||
                movement.purchaseOrder?.po_number ||
                movement.no_po ||
                '-';

            // Customer
            const customerName =
                movement.customerName ||
                movement.customer?.namaCustomer ||
                movement.purchaseOrder?.customer?.namaCustomer ||
                '-';

            // Tanggal LPB
            const lpb = movement.purchaseOrder?.laporanPenerimaanBarang || null;
            const tanggalLpbRaw = movement.tanggalLpb || lpb?.tanggal_po || lpb?.createdAt || null;
            const tanggalLpbFormatted = tanggalLpbRaw ? formatDate(tanggalLpbRaw) : '-';

            // Ekspedisi
            const checklist =
                movement.suratJalan?.checklistSuratJalan ||
                movement.purchaseOrder?.suratJalan?.checklistSuratJalan ||
                null;
            const expedisiFromNotes = movement.notes?.match(/\[EKSPEDISI:\s*([^\]]+)\]/i)?.[1]?.trim() || null;
            const expedisi = movement.expedisi || checklist?.ekspedisi || expedisiFromNotes || null;
            const mobil = movement.mobil || checklist?.mobil || null;
            const expedisiDriver =
                movement.expedisiDriver ||
                [expedisi, mobil].filter(Boolean).join(' - ') ||
                '-';

            const rawNotes = movement.notes || '';
            const cleanNotes = rawNotes.replace(/\[EKSPEDISI:[^\]]*\]/gi, '').trim();

            return {
                id: movement.id,
                movementNumber: movement.movementNumber || '-',
                poNumber,
                customerName,
                productNames,
                totalItems: cartonCount,
                totalQuantity,
                tanggalLpbFormatted,
                tanggalLpbRaw,
                notes: cleanNotes,
                rawNotes,
                expedisiDriver,
                status: movement.status || 'UNKNOWN',
                createdAt: movement.createdAt || movement.updatedAt || null,
                source: movement,
            };
        });
    }, [hasMovements, movements]);

    if (loading && !searchLoading) {
        return (
            <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
                <TableLoading rows={5} columns={9} className='p-6' />
            </div>
        );
    }

    return (
        <div className='flex-1 flex flex-col min-h-0 space-y-2'>
            <div className='flex-1 flex flex-col min-h-0 overflow-hidden rounded-md border border-gray-200 bg-white'>
                <div className='overflow-x-auto overflow-y-auto flex-1 min-h-[300px]'>
                    <table className='min-w-[1100px] w-full divide-y divide-gray-200 text-xs'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th
                                    scope='col'
                                    className='sticky top-0 z-10 bg-gray-50 px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    No PO
                                </th>
                                <th
                                    scope='col'
                                    className='sticky top-0 z-10 bg-gray-50 px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Customer
                                </th>
                                <th
                                    scope='col'
                                    className='sticky top-0 z-10 bg-gray-50 px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Product
                                </th>
                                <th
                                    scope='col'
                                    className='sticky top-0 z-10 bg-gray-50 px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                    title='Total kuantitas (PCS)'
                                >
                                    Quantity
                                </th>
                                <th
                                    scope='col'
                                    className='sticky top-0 z-10 bg-gray-50 px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Tanggal LPB
                                </th>
                                <th
                                    scope='col'
                                    className='sticky top-0 z-10 bg-gray-50 px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Notes
                                </th>
                                <th
                                    scope='col'
                                    className='sticky top-0 z-10 bg-gray-50 px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Ekspedisi
                                </th>
                                <th
                                    scope='col'
                                    className='sticky top-0 z-10 bg-gray-50 px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Status
                                </th>
                                <th
                                    scope='col'
                                    className='sticky top-0 z-10 bg-gray-50 px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500'
                                >
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100 bg-white'>
                            {renderedMovements.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
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
                                            {/* 1. No PO */}
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900'>
                                                <div title={movement.poNumber}>
                                                    {movement.poNumber}
                                                </div>
                                            </td>

                                            {/* 2. Customer */}
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900'>
                                                <div title={movement.customerName}>
                                                    {movement.customerName}
                                                </div>
                                            </td>

                                            {/* 3. Product */}
                                            <td className='px-2.5 py-1.5 text-xs text-gray-900'>
                                                <div className='max-w-[220px]'>
                                                    {movement.productNames.map((name, idx) => (
                                                        <div key={idx} title={name} className='truncate'>
                                                            {name}
                                                        </div>
                                                    ))}
                                                    {movement.totalItems > 1 && (
                                                        <span className='text-[10px] text-gray-400'>
                                                            ({movement.totalItems} items)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 4. Quantity */}
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-right text-xs font-semibold text-gray-700'>
                                                {movement.totalQuantity.toLocaleString('id-ID')} PCS
                                            </td>

                                            {/* 5. Tanggal LPB */}
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-500'>
                                                {movement.tanggalLpbFormatted}
                                            </td>

                                            {/* 6. Notes */}
                                            <td className='px-2.5 py-1.5 text-xs text-gray-500'>
                                                <div title={movement.notes} className='max-w-[180px] truncate'>
                                                    {movement.notes || '-'}
                                                </div>
                                            </td>

                                            {/* 7. Ekspedisi Driver */}
                                            <td className='px-2.5 py-1.5 text-xs text-gray-600'>
                                                <div title={movement.expedisiDriver} className='max-w-[150px] truncate'>
                                                    {movement.expedisiDriver}
                                                </div>
                                            </td>

                                            {/* 8. Status */}
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900'>
                                                {movement.notes?.includes('[SPLIT]') ? (
                                                    <div className='flex flex-col gap-0.5'>
                                                        <StatusBadge
                                                            status='SPLIT'
                                                            variant='warning'
                                                            size='xs'
                                                            dot
                                                        />
                                                        <span className='text-[10px] text-amber-700 font-medium'>
                                                            {movement.notes.match(/Restock:\s*\d+,\s*Reject:\s*\d+/i)?.[0] || 'Restock & Reject'}
                                                        </span>
                                                    </div>
                                                ) : movement.status === 'COMPLETED' ? (
                                                    <StatusBadge
                                                        status='RESTOCK'
                                                        variant='success'
                                                        size='xs'
                                                        dot
                                                    />
                                                ) : (
                                                    <StatusBadge
                                                        status={resolveTypeLabel(movement.status)}
                                                        variant={resolveStatusVariant(movement.status)}
                                                        size='xs'
                                                        dot
                                                    />
                                                )}
                                            </td>

                                            {/* 9. Action */}
                                            <td className='px-2.5 py-1.5 whitespace-nowrap text-right text-xs text-gray-500'>
                                                <div className='flex justify-end gap-1.5'>
                                                    {typeof onClassify === 'function' && (
                                                        <button
                                                            type='button'
                                                            onClick={() => onClassify(movement.source)}
                                                            disabled={isClassifying}
                                                            className='inline-flex h-7 items-center justify-center rounded border border-blue-200 bg-blue-50/50 px-2.5 text-xs font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-100/70 transition-colors disabled:opacity-50'
                                                        >
                                                            {isClassifying ? 'Memproses...' : movement.status === 'PENDING' ? 'Klasifikasi' : 'Ganti Status'}
                                                        </button>
                                                    )}
                                                    {editHandler && (
                                                        <button
                                                            type='button'
                                                            onClick={() => editHandler(movement.source)}
                                                            className='inline-flex h-7 items-center justify-center rounded border border-gray-200 px-2.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors'
                                                        >
                                                            Edit
                                                        </button>
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

            </div>
        </div>
    );
};

export default StokGantungTable;
