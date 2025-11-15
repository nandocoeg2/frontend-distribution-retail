import React from 'react';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';

const TermOfPaymentTable = ({ termOfPayments, pagination, onPageChange, onLimitChange, onDelete, onViewDetail, selectedTermOfPaymentId, searchQuery }) => {
  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Code
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Days Limit
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Created At
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Updated At
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {termOfPayments.length === 0 ? (
            <tr>
              <td colSpan="5" className='px-6 py-4 text-center text-gray-500'>
                {searchQuery ? 'No term of payments found matching your search.' : 'No term of payments available.'}
              </td>
            </tr>
          ) : (
            termOfPayments.map((top) => (
              <tr 
                key={top.id} 
                onClick={() => onViewDetail(top)}
                className={`cursor-pointer transition-colors ${
                  selectedTermOfPaymentId === top.id 
                    ? 'bg-blue-50 hover:bg-blue-100' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded'>
                    {top.kode_top}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {top.batas_hari} days
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {new Date(top.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {new Date(top.updatedAt).toLocaleDateString()}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <div className='flex space-x-2'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(top.id);
                      }}
                      className='text-red-600 hover:text-red-900 p-1'
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
      <Pagination pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
    </div>
  );
};

export default TermOfPaymentTable;
