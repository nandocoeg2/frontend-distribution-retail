import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Pagination from './Pagination';

const SupplierTable = ({ suppliers = [], pagination, onPageChange, onLimitChange, onEdit, onDelete, onView, searchQuery }) => {
  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Nama Supplier
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Kode
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Alamat
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Telepon
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Bank
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Dibuat
            </th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {!suppliers || suppliers.length === 0 ? (
            <tr>
              <td colSpan="7" className='px-6 py-4 text-center text-gray-500'>
                {searchQuery ? 'Tidak ada supplier yang ditemukan sesuai pencarian.' : 'Belum ada supplier tersedia.'}
              </td>
            </tr>
          ) : (
            suppliers.map((supplier) => (
              <tr key={supplier.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {supplier.name || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded'>
                    {supplier.code || '-'}
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <div className='text-sm text-gray-900 max-w-xs truncate' title={supplier.address}>
                    {supplier.address || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {supplier.phoneNumber || '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  {supplier.bank ? (
                    <div className='text-sm text-gray-900'>
                      <div className='font-medium'>{supplier.bank.name}</div>
                      <div className='text-xs text-gray-500'>{supplier.bank.account}</div>
                      <div className='text-xs text-gray-500'>{supplier.bank.holder}</div>
                    </div>
                  ) : (
                    <span className='text-sm text-gray-400'>-</span>
                  )}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString('id-ID') : '-'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <div className='flex space-x-2 justify-end'>
                    <button
                      onClick={() => onView(supplier)}
                      className='text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50'
                      title='Lihat Detail'
                    >
                      <EyeIcon className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => onEdit(supplier)}
                      className='text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50'
                      title='Edit'
                    >
                      <PencilIcon className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => onDelete(supplier.id)}
                      className='text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50'
                      title='Hapus'
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
      <Pagination 
        pagination={pagination} 
        onPageChange={onPageChange} 
        onLimitChange={onLimitChange} 
      />
    </div>
  );
};

export default SupplierTable;
