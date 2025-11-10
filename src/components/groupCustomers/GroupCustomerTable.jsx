import React from 'react';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';

const GroupCustomerTable = ({ groupCustomers, pagination, onPageChange, onLimitChange, onDelete, onViewDetail, selectedGroupCustomerId, searchQuery }) => {
  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Group Code
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Kode Surat
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Group Name
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Address
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              NPWP
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Created At
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {groupCustomers.length === 0 ? (
            <tr>
              <td colSpan="7" className='px-6 py-4 text-center text-gray-500'>
                {searchQuery ? 'No group customers found matching your search.' : 'No group customers available.'}
              </td>
            </tr>
          ) : (
            groupCustomers.map((gc) => (
              <tr 
                key={gc.id} 
                onClick={() => onViewDetail(gc)}
                className={`cursor-pointer transition-colors ${
                  selectedGroupCustomerId === gc.id 
                    ? 'bg-blue-50 hover:bg-blue-100' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {gc.kode_group}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded'>
                    {gc.kode_group_surat || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {gc.nama_group}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {gc.alamat}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {gc.npwp}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {new Date(gc.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <div className='flex space-x-2'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(gc.id);
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

export default GroupCustomerTable;

