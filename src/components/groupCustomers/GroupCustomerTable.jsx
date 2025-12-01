import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';

const GroupCustomerTable = ({ groupCustomers, pagination, onPageChange, onLimitChange, onDelete, onViewDetail, selectedGroupCustomerId, searchQuery }) => {
  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200 text-xs table-fixed'>
          <colgroup>
            <col style={{ width: '160px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '130px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '60px' }} />
          </colgroup>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Group Name
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Group Code
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Parent Group
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Address
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                NPWP
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Created At
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-100'>
            {groupCustomers.length === 0 ? (
              <tr>
                <td colSpan="7" className='px-2 py-1 text-center text-gray-500 text-xs'>
                  {searchQuery ? 'No group customers found matching your search.' : 'No group customers available.'}
                </td>
              </tr>
            ) : (
              groupCustomers.map((gc) => (
                <tr 
                  key={gc.id} 
                  onClick={() => onViewDetail(gc)}
                  className={`cursor-pointer transition-colors h-8 ${
                    selectedGroupCustomerId === gc.id 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate' title={gc.nama_group}>
                    {gc.nama_group}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900'>
                    {gc.kode_group}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-600 truncate' title={gc.parentGroupCustomer?.nama_parent}>
                    {gc.parentGroupCustomer ? (
                      <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                        {gc.parentGroupCustomer.kode_parent}
                      </span>
                    ) : (
                      <span className='text-gray-400'>-</span>
                    )}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate' title={gc.alamat}>
                    {gc.alamat || '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900'>
                    {gc.npwp || '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-600'>
                    {new Date(gc.createdAt).toLocaleDateString()}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs'>
                    <div className='flex space-x-1'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(gc.id);
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

export default GroupCustomerTable;

