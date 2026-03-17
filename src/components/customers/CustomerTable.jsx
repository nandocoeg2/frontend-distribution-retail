import React from 'react';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';
import { useConfirmationDialog } from '../ui';

const CustomerTable = ({ customers, pagination, onPageChange, onLimitChange, onDelete, onViewDetail, selectedCustomerId, searchQuery }) => {
  const [deleteId, setDeleteId] = React.useState(null);
  const { showDialog, hideDialog, ConfirmationDialog } = useConfirmationDialog();

  const handleDelete = (customerId) => {
    setDeleteId(customerId);
    showDialog({
      title: "Hapus Customer",
      message: "Apakah Anda yakin ingin menghapus customer ini?",
      type: "danger",
      confirmText: "Hapus",
      cancelText: "Batal"
    });
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
    hideDialog();
  };
  return (
    <div className='space-y-2'>
      <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
        <div className='overflow-x-auto'>
          <table className='min-w-full w-full divide-y divide-gray-200 text-xs table-fixed'>
            <colgroup>
              <col style={{ width: '180px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '60px' }} />
            </colgroup>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Customer Name
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Code
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Group
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Region
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Alamat
                </th>
                <th className='px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Phone
                </th>
                <th className='px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 bg-white'>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className='px-3 py-6 text-center text-xs text-gray-500'>
                    {searchQuery ? 'No customers found matching your search.' : 'No customers available.'}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const isSelected = selectedCustomerId === customer.id;
                  return (
                  <tr
                    key={customer.id}
                    onClick={() => onViewDetail && onViewDetail(customer)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate' title={customer.namaCustomer}>
                      {customer.namaCustomer}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900'>
                      {customer.kodeCustomer}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate' title={customer.groupCustomer?.nama_group || 'N/A'}>
                      {customer.groupCustomer?.nama_group || 'N/A'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate' title={customer.region || 'N/A'}>
                      {customer.region || 'N/A'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate' title={customer.alamatPengiriman || '-'}>
                      {customer.alamatPengiriman || '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900'>
                      {customer.phoneNumber || '-'}
                    </td>
                    <td className='px-2.5 py-1.5 whitespace-nowrap text-right text-xs'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(customer.id);
                          }}
                          className='inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                          title='Delete'
                        >
                          <TrashIcon className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination compact pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
      </div>
      
      <ConfirmationDialog 
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CustomerTable;
