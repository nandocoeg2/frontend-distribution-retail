import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Pagination from './Pagination';

const RegionTable = ({ regions, pagination, onPageChange, onLimitChange, onEdit, onDelete, onView, searchQuery }) => {
  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Region Code
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Region Name
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
          {regions.length === 0 ? (
            <tr>
              <td colSpan="5" className='px-6 py-4 text-center text-gray-500'>
                {searchQuery ? 'No regions found matching your search.' : 'No regions available.'}
              </td>
            </tr>
          ) : (
            regions.map((region) => (
              <tr key={region.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {region.kode_region}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {region.nama_region}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {new Date(region.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {new Date(region.updatedAt).toLocaleDateString()}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => onView(region)}
                      className='text-indigo-600 hover:text-indigo-900 p-1'
                      title='View'
                    >
                      <EyeIcon className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => onEdit(region)}
                      className='text-indigo-600 hover:text-indigo-900 p-1'
                      title='Edit'
                    >
                      <PencilIcon className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => onDelete(region.id)}
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

export default RegionTable;

