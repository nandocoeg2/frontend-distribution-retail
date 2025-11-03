import React from 'react';
import { StatusBadge } from '../ui';
import { resolveStatusVariant } from '../../utils/modalUtils';

const PackingItemsTable = ({ packingBoxes, onItemClick }) => {
  if (!packingBoxes || packingBoxes.length === 0) {
    return (
      <div className='p-8 text-center text-gray-500 bg-gray-50 rounded-lg'>
        <p className='text-sm'>Tidak ada data packing boxes.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {packingBoxes.map((box, boxIndex) => (
        <div
          key={box.id || boxIndex}
          className='border border-gray-200 rounded-lg overflow-hidden'
        >
          {/* Box Header */}
          <div className='px-4 py-3 bg-gray-100 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-3'>
                <span className='text-sm font-semibold text-gray-900'>
                  {box.no_box || `Box ${boxIndex + 1}`}
                </span>
                <StatusBadge
                  status={box.status?.status_name || 'Unknown'}
                  variant={resolveStatusVariant(box.status?.status_name)}
                  size='sm'
                  dot
                />
              </div>
              <div className='text-xs text-gray-600'>
                Total Qty:{' '}
                <span className='font-medium'>
                  {box.total_quantity_in_box || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Box Items Table */}
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                    Nama Barang
                  </th>
                  <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                    Quantity
                  </th>
                  <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                    Keterangan
                  </th>
                  <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {box.packingBoxItems && box.packingBoxItems.length > 0 ? (
                  box.packingBoxItems.map((item, itemIndex) => (
                    <tr
                      key={item.id || itemIndex}
                      className='transition-colors hover:bg-gray-50'
                    >
                      <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                        <div
                          onClick={() => onItemClick?.(item)}
                          className='font-medium cursor-pointer text-blue-600 hover:text-blue-800'
                        >
                          <span className='hover:underline'>
                            {item.nama_barang}
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                          {item.quantity}
                        </span>
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-500 border-b'>
                        {item.keterangan || '-'}
                      </td>
                      <td className='px-4 py-4 text-sm border-b whitespace-nowrap'>
                        <button
                          onClick={() => onItemClick?.(item)}
                          className='text-blue-600 hover:text-blue-900'
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan='4'
                      className='px-4 py-8 text-sm text-center text-gray-500'
                    >
                      Tidak ada items dalam box ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PackingItemsTable;
