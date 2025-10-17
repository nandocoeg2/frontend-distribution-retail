import React, { useState } from 'react';
import { StatusBadge } from '../ui';
import { formatDateTime } from '../../utils/formatUtils';
import { resolveStatusVariant } from '../../utils/modalUtils';

const PackingItemsTable = ({ packingItems, onItemClick }) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const resolveStatusVariant = (status) => {
    const value = typeof status === 'string' ? status.toLowerCase() : '';

    if (!value) {
      return 'secondary';
    }

    // Complete = Hijau
    if (value.includes('completed') || value.includes('complete')) {
      return 'success';
    }

    // Failed = Merah
    if (
      value.includes('cancelled') ||
      value.includes('failed') ||
      value.includes('error')
    ) {
      return 'danger';
    }

    // Processed = Biru
    if (value.includes('processed') && !value.includes('processing')) {
      return 'primary';
    }

    // Processing/In Progress = Kuning
    if (
      value.includes('processing') ||
      value.includes('in_progress') ||
      value.includes('in progress')
    ) {
      return 'warning';
    }

    // Pending/Draft = Netral/Abu-abu
    if (value.includes('pending') || value.includes('draft')) {
      return 'secondary';
    }

    return 'default';
  };

  if (!packingItems || packingItems.length === 0) {
    return (
      <div className='py-8 text-center text-gray-500'>
        <div className='mb-2 text-4xl'>📦</div>
        <p>Tidak ada packing items</p>
      </div>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full bg-white border border-gray-200 rounded-lg'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b'>
              No
            </th>
            <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b'>
              Nama Barang
            </th>
            <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b'>
              Total Qty
            </th>
            <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b'>
              Jumlah Carton
            </th>
            <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b'>
              Isi per Carton
            </th>
            <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b'>
              Status Code
            </th>
            <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b'>
              Updated At
            </th>
            <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b'>
              Created By
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {packingItems.map((item, index) => (
            <tr
              key={item.id}
              className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                hoveredRow === index ? 'bg-blue-50' : ''
              }`}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                {index + 1}
              </td>
              <td
                className='px-4 py-4 text-sm font-medium text-blue-600 border-b whitespace-nowrap hover:text-blue-800'
                onClick={() => onItemClick(item)}
              >
                <div className='flex items-center space-x-2'>
                  <span>📦</span>
                  <span className='hover:underline'>{item.nama_barang}</span>
                </div>
              </td>
              <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                  {item.total_qty}
                </span>
              </td>
              <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                  {item.jumlah_carton}
                </span>
              </td>
              <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                {item.isi_per_carton}
              </td>
              <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                <StatusBadge
                  status={
                    item.status?.status_name ||
                    item.status?.status_code ||
                    'N/A'
                  }
                  variant={resolveStatusVariant(
                    item.status?.status_name || item.status?.status_code
                  )}
                  size='sm'
                  dot
                />
              </td>
              <td className='px-4 py-4 text-sm text-gray-500 border-b whitespace-nowrap'>
                {formatDateTime(item.updatedAt)}
              </td>
              <td className='px-4 py-4 text-sm text-gray-500 border-b whitespace-nowrap'>
                <span className='inline-flex items-center px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded'>
                  {item.createdBy || 'N/A'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PackingItemsTable;
