import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Pagination from './Pagination';

const CustomerTable = ({ customers, pagination, onPageChange, onLimitChange, onEdit, onDelete, onView, searchQuery }) => {
  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Name
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Email
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Phone
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Address
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Description
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {customers.length === 0 ? (
            <tr>
              <td colSpan="6" className='px-6 py-4 text-center text-gray-500'>
                {searchQuery ? 'No customers found matching your search.' : 'No customers available.'}
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {customer.name}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {customer.email || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {customer.phoneNumber || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {customer.address || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {customer.description || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => onView(customer)}
                      className='text-indigo-600 hover:text-indigo-900 p-1'
                      title='View'
                    >
                      <EyeIcon className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => onEdit(customer)}
                      className='text-indigo-600 hover:text-indigo-900 p-1'
                      title='Edit'
                    >
                      <PencilIcon className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => onDelete(customer.id)}
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

export default CustomerTable;
