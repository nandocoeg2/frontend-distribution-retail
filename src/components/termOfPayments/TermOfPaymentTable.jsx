import React from 'react';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';

const TermOfPaymentTable = ({ termOfPayments, pagination, onPageChange, onLimitChange, onDelete, onViewDetail, selectedTermOfPaymentId, searchQuery }) => {
  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200 text-xs table-fixed'>
          <colgroup>
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '60px' }} />
          </colgroup>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Code
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Days Limit
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Created At
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Updated At
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-100'>
            {termOfPayments.length === 0 ? (
              <tr>
                <td colSpan="5" className='px-2 py-1 text-center text-gray-500 text-xs'>
                  {searchQuery ? 'No term of payments found matching your search.' : 'No term of payments available.'}
                </td>
              </tr>
            ) : (
              termOfPayments.map((top) => (
                <tr 
                  key={top.id} 
                  onClick={() => onViewDetail(top)}
                  className={`cursor-pointer transition-colors h-8 ${
                    selectedTermOfPaymentId === top.id 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className='px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900'>
                    {top.kode_top}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900'>
                    {top.batas_hari} days
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-600'>
                    {new Date(top.createdAt).toLocaleDateString()}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-600'>
                    {new Date(top.updatedAt).toLocaleDateString()}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs'>
                    <div className='flex space-x-1'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(top.id);
                        }}
                        className='p-0.5 text-red-600 hover:text-red-900'
                        title='Delete'
                      >
                        <TrashIcon className='h-4 w-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
    </div>
  );
};

export default TermOfPaymentTable;
