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

    return movements.map((movement) => ({
      id: movement.id,
      movementNumber: movement.movementNumber || '-',
      type: movement.type || 'UNKNOWN',
      status: movement.status || 'UNKNOWN',
      supplierName: movement.supplierName || '-',
      totalItems:
        typeof movement.totalItems === 'number'
          ? movement.totalItems
          : Array.isArray(movement.items)
          ? movement.items.length
          : 0,
      totalQuantity:
        typeof movement.totalQuantity === 'number'
          ? movement.totalQuantity
          : Array.isArray(movement.items)
          ? movement.items.reduce(
              (sum, item) => sum + Number(item?.quantity || 0),
              0
            )
          : 0,
      createdAt: movement.createdAt || movement.updatedAt || null,
      notes: movement.notes || '',
      source: movement,
    }));
  }, [hasMovements, movements]);

  if (loading && !searchLoading) {
    return (
      <div className='bg-white rounded-lg shadow divide-y divide-gray-200'>
        <TableLoading rows={5} columns={6} className='p-6' />
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Movement
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Type
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Status
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Supplier
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Items
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Quantity
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Created At
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
              >
                Notes
              </th>
              {onClassify && (
                <th
                  scope='col'
                  className='px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {renderedMovements.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className='px-6 py-10 text-center text-sm text-gray-500'
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
                  <tr key={movement.id || movement.movementNumber}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {movement.movementNumber}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      <StatusBadge
                        status={resolveTypeLabel(movement.type)}
                        variant={resolveTypeVariant(movement.type)}
                        size='sm'
                        dot
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      <StatusBadge
                        status={resolveTypeLabel(movement.status)}
                        variant={resolveStatusVariant(movement.status)}
                        size='sm'
                        dot
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {movement.supplierName || '-'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right'>
                      {movement.totalItems}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right'>
                      {movement.totalQuantity}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {formatDateTime(movement.createdAt)}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {movement.notes || '-'}
                    </td>
                    {onClassify && (
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right'>
                        {classificationEnabled ? (
                          <div className='flex justify-end space-x-2'>
                            <button
                              type='button'
                              onClick={() =>
                                onClassify(movement.source, 'restock')
                              }
                              disabled={isClassifying}
                              className='inline-flex items-center rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60 transition-colors'
                            >
                              {isClassifying ? 'Memproses...' : 'Restock'}
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                onClassify(movement.source, 'reject')
                              }
                              disabled={isClassifying}
                              className='inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 transition-colors'
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
