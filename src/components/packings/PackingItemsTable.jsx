import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StatusBadge, MixedBadge } from '../ui';
import { resolveStatusVariant } from '../../utils/modalUtils';

const PackingItemsTable = ({ packingBoxes, onItemClick }) => {
  // State to track which boxes are expanded (default: all collapsed)
  const [expandedBoxes, setExpandedBoxes] = useState(new Set());

  const toggleBox = (boxId) => {
    setExpandedBoxes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(boxId)) {
        newSet.delete(boxId);
      } else {
        newSet.add(boxId);
      }
      return newSet;
    });
  };

  if (!packingBoxes || packingBoxes.length === 0) {
    return <div className='py-2 text-center text-xs text-gray-500'>Tidak ada packing boxes.</div>;
  }

  return (
    <div className='space-y-2 max-h-[400px] overflow-y-auto'>
      {packingBoxes.map((box, boxIndex) => (
        <div key={box.id || boxIndex} className='border border-gray-200 rounded overflow-hidden'>
          <div className='px-2 py-1.5 bg-gray-100 border-b border-gray-200 cursor-pointer hover:bg-gray-200' onClick={() => toggleBox(box.id || boxIndex)}>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2'>
                {expandedBoxes.has(box.id || boxIndex) ? <ChevronDownIcon className='w-3 h-3 text-gray-600' /> : <ChevronRightIcon className='w-3 h-3 text-gray-600' />}
                <span className='text-xs font-semibold text-gray-900'>{box.no_box || `Box ${boxIndex + 1}`}</span>
                <StatusBadge status={box.status?.status_name || 'Unknown'} variant={resolveStatusVariant(box.status?.status_name)} size='xs' dot />
                {(() => {
                  const uniqueItemIds = new Set(box.packingBoxItems?.map(item => item.itemId).filter(Boolean) || []);
                  return uniqueItemIds.size > 1 ? <MixedBadge /> : null;
                })()}
              </div>
              <span className='text-xs text-gray-600'>Qty: <strong>{box.total_quantity_in_box || 0}</strong></span>
            </div>
          </div>

          {expandedBoxes.has(box.id || boxIndex) && (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 text-xs'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-2 py-1 text-xs font-medium text-left text-gray-500 uppercase'>Nama</th>
                    <th className='px-2 py-1 text-xs font-medium text-left text-gray-500 uppercase'>Qty</th>
                    <th className='px-2 py-1 text-xs font-medium text-left text-gray-500 uppercase'>Ket</th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-100'>
                  {box.packingBoxItems && box.packingBoxItems.length > 0 ? (
                    box.packingBoxItems.map((item, itemIndex) => (
                      <tr key={item.id || itemIndex} className='hover:bg-gray-50 cursor-pointer' onClick={() => onItemClick?.(item)}>
                        <td className='px-2 py-1 text-xs text-blue-600 hover:text-blue-800'>{item.nama_barang}</td>
                        <td className='px-2 py-1'><span className='px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800'>{item.quantity}</span></td>
                        <td className='px-2 py-1 text-xs text-gray-500'>{item.keterangan || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan='3' className='px-2 py-2 text-xs text-center text-gray-500'>Tidak ada items</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PackingItemsTable;
