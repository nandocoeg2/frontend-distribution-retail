import React from 'react';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';

const TermOfPaymentTable = ({ termOfPayments, pagination, onPageChange, onLimitChange, onDelete, onViewDetail, selectedTermOfPaymentId, searchQuery }) => {
  return (
    <div className='space-y-2'>
      <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
        <div className='overflow-x-auto'>
          <table className='min-w-full w-full divide-y divide-gray-200 text-xs table-fixed'>
            <colgroup>
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '60px' }} />
            </colgroup>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Code
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Days Limit
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Created At
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Updated At
                </th>
                <th className='px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 bg-white'>
              {termOfPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className='px-3 py-6 text-center text-xs text-gray-500'>
                    {searchQuery ? 'No term of payments found matching your search.' : 'No term of payments available.'}
                  </td>
                </tr>
              ) : (
                termOfPayments.map((top) => (
                  <tr
                    key={top.id}
                    onClick={() => onViewDetail(top)}
                    className={`cursor-pointer transition-colors ${selectedTermOfPaymentId === top.id
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900'>
                      {top.kode_top}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900'>
                      {top.batas_hari} days
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-600'>
                      {new Date(top.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-600'>
                      {new Date(top.updatedAt).toLocaleDateString()}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-right text-xs'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(top.id);
                          }}
                          className='inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                          title='Delete'
                        >
                          <TrashIcon className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination compact pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
      </div>
    </div>
  );
};

export default TermOfPaymentTable;
