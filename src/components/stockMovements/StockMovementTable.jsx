import React, { useMemo } from 'react';
import Pagination from '../common/Pagination.jsx';
import { TableLoading } from '../ui/Loading.jsx';
import { StatusBadge } from '../ui/Badge.jsx';
import { formatDateTime } from '../../utils/formatUtils';

const resolveTypeLabel = (type) => {
  if (!type) {
    return '-';
  }

  return type
    .toString()
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const resolveTypeVariant = (type) => {
  switch (type) {
    case 'STOCK_IN':
      return 'primary';
    case 'STOCK_OUT':
      return 'warning';
    case 'RETURN':
      return 'info';
    default:
      return 'secondary';
  }
};

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

const StockMovementTable = ({
  movements = [],
  pagination,
  onPageChange,
  onLimitChange,
  loading = false,
  searchLoading = false,
  onClassify,
  classifyLoadingId = null,
}) => {
  const hasMovements = Array.isArray(movements) && movements.length > 0;

  const renderedMovements = useMemo(() => {
    if (!hasMovements) {
      return [];
    }

    return movements.map((movement) => {
      const items = Array.isArray(movement.items) ? movement.items : [];
      const totalItems = typeof movement.totalItems === 'number'
        ? movement.totalItems
        : items.length;
      
      // Extract product names
      let productDisplay = '-';
      if (items.length > 0) {
        const firstProduct = items[0]?.inventory?.nama_barang || 
                            items[0]?.inventory?.name || 
                            items[0]?.productName || '-';
        if (items.length === 1) {
          productDisplay = firstProduct;
        } else {
          productDisplay = `${firstProduct} (+${items.length - 1} more)`;
        }
      }

      return {
        id: movement.id,
        movementNumber: movement.movementNumber || '-',
        type: movement.type || 'UNKNOWN',
        status: movement.status || 'UNKNOWN',
        supplierName: movement.supplierName || '-',
        productDisplay,
        totalItems,
        totalQuantity:
          typeof movement.totalQuantity === 'number'
            ? movement.totalQuantity
            : items.reduce(
                (sum, item) => sum + Number(item?.quantity || 0),
                0
              ),
        createdAt: movement.createdAt || movement.updatedAt || null,
        notes: movement.notes || '',
        source: movement,
      };
    });
  }, [hasMovements, movements]);

  if (loading && !searchLoading) {
    return (
      <div className='bg-white rounded-lg shadow divide-y divide-gray-200'>
        <TableLoading rows={5} columns={9} className='p-6' />
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200 text-xs table-fixed'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Movement
              </th>
              <th
                scope='col'
                className='px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Type
              </th>
              <th
                scope='col'
                className='px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Status
              </th>
              <th
                scope='col'
                className='px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Supplier
              </th>
              <th
                scope='col'
                className='px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Product
              </th>
              <th
                scope='col'
                className='px-2 py-1.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Items
              </th>
              <th
                scope='col'
                className='px-2 py-1.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Qty
              </th>
              <th
                scope='col'
                className='px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Created
              </th>
              <th
                scope='col'
                className='px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Notes
              </th>
              {onClassify && (
                <th
                  scope='col'
                  className='px-2 py-1.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100 bg-white'>
            {renderedMovements.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className='px-2 py-4 text-center text-xs text-gray-500'
                >
                  {searchLoading
                    ? 'Searching stock movements...'
                    : 'No stock movements found. Try adjusting the filters.'}
                </td>
              </tr>
            ) : (
              renderedMovements.map((movement) => {
                const classificationEnabled =
                  typeof onClassify === 'function' &&
                  movement.type === 'RETURN' &&
                  movement.status === 'PENDING';

                const isClassifying = classifyLoadingId === movement.id;

                return (
                  <tr key={movement.id || movement.movementNumber} className='h-8 hover:bg-gray-50'>
                    <td className='px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900'>
                      {movement.movementNumber}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900'>
                      <StatusBadge
                        status={resolveTypeLabel(movement.type)}
                        variant={resolveTypeVariant(movement.type)}
                        size='sm'
                        dot
                      />
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900'>
                      <StatusBadge
                        status={resolveTypeLabel(movement.status)}
                        variant={resolveStatusVariant(movement.status)}
                        size='sm'
                        dot
                      />
                    </td>
                    <td className='px-2 py-1 text-xs text-gray-500'>
                      <div className='max-w-xs truncate' title={movement.supplierName || '-'}>
                        {movement.supplierName || '-'}
                      </div>
                    </td>
                    <td className='px-2 py-1 text-xs text-gray-900'>
                      <div className='max-w-xs truncate' title={movement.productDisplay}>
                        {movement.productDisplay}
                      </div>
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-500 text-right'>
                      {movement.totalItems}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-500 text-right'>
                      {movement.totalQuantity}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-500'>
                      {formatDateTime(movement.createdAt)}
                    </td>
                    <td className='px-2 py-1 text-xs text-gray-500'>
                      {movement.notes || '-'}
                    </td>
                    {onClassify && (
                      <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-500 text-right'>
                        {classificationEnabled ? (
                          <div className='flex justify-end space-x-2'>
                            <button
                              type='button'
                              onClick={() =>
                                onClassify(movement.source, 'restock')
                              }
                              disabled={isClassifying}
                              className='inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60'
                            >
                              {isClassifying ? 'Memproses...' : 'Restock'}
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                onClassify(movement.source, 'reject')
                              }
                              disabled={isClassifying}
                              className='inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60'
                            >
                              {isClassifying ? 'Memproses...' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className='text-xs text-gray-400'>
                            {movement.type === 'RETURN'
                              ? 'Sudah diproses'
                              : 'Tidak ada aksi'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </div>
  );
};

export default StockMovementTable;
