import React, { useMemo } from 'react';
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

      // Determine party info based on movement type
      const partyInfoLines = [];
      const movementType = movement.type || 'UNKNOWN';

      if (movementType === 'STOCK_IN') {
        const companyName = movement.companyName || movement.company?.nama_perusahaan || '-';
        const supplierName = movement.supplierName || movement.supplier?.name || '-';
        partyInfoLines.push(companyName);
        partyInfoLines.push(`← ${supplierName}`);
      } else if (movementType === 'STOCK_OUT') {
        const companyName = movement.companyName || movement.company?.nama_perusahaan || '-';
        const customerName = movement.customerName || movement.customer?.namaCustomer || '-';
        partyInfoLines.push(companyName);
        partyInfoLines.push(`→ ${customerName}`);
      } else if (movementType === 'RETURN') {
        partyInfoLines.push(movement.notes || 'Return');
      }

      if (partyInfoLines.length === 0) {
        partyInfoLines.push('-');
      }

      return {
        id: movement.id,
        movementNumber: movement.movementNumber || '-',
        type: movementType,
        status: movement.status || 'UNKNOWN',
        partyInfoLines, // array of party info for new line display
        productNames, // array of product names for new line display
        totalItems: cartonCount, // jumlah karton (unique items)
        totalQuantity, // total PCS
        createdAt: movement.createdAt || movement.updatedAt || null,
        notes: movement.notes || '',
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
          <table className='min-w-[980px] w-full divide-y divide-gray-200 text-xs table-auto'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
                >
                  Type
                </th>
                <th
                  scope='col'
                  className='sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
                >
                  Status
                </th>
                <th
                  scope='col'
                  className='sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
                >
                  Info
                </th>
                <th
                  scope='col'
                  className='sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
                >
                  Product
                </th>
                <th
                  scope='col'
                  className='sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
                  title='Jumlah jenis barang (karton)'
                >
                  Items
                </th>
                <th
                  scope='col'
                  className='sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
                  title='Total kuantitas (PCS)'
                >
                  Qty
                </th>
                <th
                  scope='col'
                  className='sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
                >
                  Tanggal Surat Jalan
                </th>
                <th
                  scope='col'
                  className='sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
                >
                  Notes
                </th>
                <th
                  scope='col'
                  className='sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
                >
                  Actions
                </th>
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
                    <td className='px-2 py-1 text-xs text-gray-500 whitespace-normal'>
                      <div>
                        {movement.partyInfoLines.map((line, idx) => (
                          <div key={idx} title={line}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className='px-2 py-1 text-xs text-gray-900 whitespace-normal'>
                      <div>
                        {movement.productNames.map((name, idx) => (
                          <div key={idx} title={name}>
                            {name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-500 text-right'>
                      {movement.totalItems.toLocaleString('id-ID')}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-500 text-right'>
                      {movement.totalQuantity.toLocaleString('id-ID')}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-500'>
                      {formatDateTime(movement.createdAt)}
                    </td>
                    <td className='px-2 py-1 text-xs text-gray-500 whitespace-normal'>
                      {movement.notes || '-'}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-500 text-right'>
                      <div className='flex justify-end space-x-2'>
                        {onEditNotes && (
                          <button
                            type='button'
                            onClick={() => onEditNotes(movement.source)}
                            className='inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100'
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
      </div>
    </div>
  );
};

export default StockMovementTable;
