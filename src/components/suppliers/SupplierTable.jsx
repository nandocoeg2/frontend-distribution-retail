import React from 'react';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';

const SupplierTable = ({ suppliers = [], pagination, onPageChange, onLimitChange, onDelete, onViewDetail, selectedSupplierId, searchQuery }) => {
  return (
    <div className='space-y-2'>
      <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
        <div className='overflow-x-auto'>
          <table className='min-w-full w-full divide-y divide-gray-200 text-xs table-fixed'>
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
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Logo
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Nama Supplier
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Kode
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Kode Surat
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Alamat
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Email
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Telepon
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Bank
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Dibuat
                </th>
                <th className='px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 bg-white'>
              {!suppliers || suppliers.length === 0 ? (
                <tr>
                  <td colSpan="10" className='px-3 py-6 text-center text-xs text-gray-500'>
                    {searchQuery ? 'Tidak ada supplier yang ditemukan sesuai pencarian.' : 'Belum ada supplier tersedia.'}
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    onClick={() => onViewDetail(supplier)}
                    className={`cursor-pointer transition-colors ${selectedSupplierId === supplier.id
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <td className='px-2.5 py-1.5 whitespace-nowrap'>
                      {supplier.logo ? (
                        <img
                          src={supplier.logo}
                          alt='Logo'
                          className='h-6 w-6 object-contain rounded border border-gray-200'
                        />
                      ) : (
                        <div className='flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-gray-100'>
                          <span className='text-xs text-gray-400'>-</span>
                        </div>
                      )}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate' title={supplier.name || '-'}>
                      {supplier.name || '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900'>
                      {supplier.code || '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900'>
                      {supplier.supplier_code_letter || '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate' title={supplier.address || '-'}>
                      {supplier.address || '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate' title={supplier.email || '-'}>
                      {supplier.email || '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900'>
                      {supplier.phoneNumber || '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate' title={supplier.bank ? `${supplier.bank.name} - ${supplier.bank.account}` : '-'}>
                      {supplier.bank ? supplier.bank.name : '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-600'>
                      {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-right text-xs'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(supplier.id);
                          }}
                          className='inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                          title='Hapus'
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
        <Pagination
          compact
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </div>
    </div>
  );
};

export default SupplierTable;
