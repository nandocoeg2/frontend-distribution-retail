import React from 'react';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';

const SupplierTable = ({ suppliers = [], pagination, onPageChange, onLimitChange, onDelete, onViewDetail, selectedSupplierId, searchQuery }) => {
  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200 text-xs table-fixed'>
          <colgroup>
            <col style={{ width: '40px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '50px' }} />
          </colgroup>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Logo
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Nama Supplier
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Kode
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Kode Surat
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Alamat
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Email
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Telepon
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Bank
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Dibuat
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-100'>
            {!suppliers || suppliers.length === 0 ? (
              <tr>
                <td colSpan="10" className='px-2 py-1 text-center text-gray-500 text-xs'>
                  {searchQuery ? 'Tidak ada supplier yang ditemukan sesuai pencarian.' : 'Belum ada supplier tersedia.'}
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr 
                  key={supplier.id} 
                  onClick={() => onViewDetail(supplier)}
                  className={`cursor-pointer transition-colors h-8 ${
                    selectedSupplierId === supplier.id 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className='px-2 py-1 whitespace-nowrap'>
                    {supplier.logo ? (
                      <img
                        src={supplier.logo}
                        alt='Logo'
                        className='h-6 w-6 object-contain rounded border border-gray-200'
                      />
                    ) : (
                      <div className='h-6 w-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center'>
                        <span className='text-xs text-gray-400'>-</span>
                      </div>
                    )}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate' title={supplier.name || '-'}>
                    {supplier.name || '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900'>
                    {supplier.code || '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900'>
                    {supplier.supplier_code_letter || '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate' title={supplier.address || '-'}>
                    {supplier.address || '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate' title={supplier.email || '-'}>
                    {supplier.email || '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900'>
                    {supplier.phoneNumber || '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate' title={supplier.bank ? `${supplier.bank.name} - ${supplier.bank.account}` : '-'}>
                    {supplier.bank ? supplier.bank.name : '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-600'>
                    {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className='px-2 py-1 whitespace-nowrap text-xs'>
                    <div className='flex space-x-1'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(supplier.id);
                        }}
                        className='p-0.5 text-red-600 hover:text-red-900'
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
      </div>
      <Pagination 
        pagination={pagination} 
        onPageChange={onPageChange} 
        onLimitChange={onLimitChange} 
      />
    </div>
  );
};

export default SupplierTable;
