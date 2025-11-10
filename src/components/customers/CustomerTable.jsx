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
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Customer Name
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Customer Code
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Group
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Region
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Phone
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
            customers.map((customer) => {
              const isSelected = selectedCustomerId === customer.id;
              return (
              <tr 
                key={customer.id}
                onClick={() => onViewDetail && onViewDetail(customer)}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {customer.namaCustomer}
                  </div>
                  <div className='text-sm text-gray-500'>
                    {customer.email || 'No email'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {customer.kodeCustomer}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {customer.groupCustomer?.nama_group || 'N/A'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {customer.region?.nama_region || 'N/A'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {customer.phoneNumber || '-'}
                  </div>
                  {customer.customerPics && customer.customerPics.length > 0 && (() => {
                    const defaultPic = customer.customerPics.find(pic => pic.default);
                    const pic = defaultPic || customer.customerPics[0];
                    return (
                      <div className='text-xs text-gray-500'>
                        PIC: {pic.nama_pic} ({pic.dept})
                      </div>
                    );
                  })()}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(customer.id);
                    }}
                    className='text-red-600 hover:text-red-900 p-1 transition-colors'
                    title='Delete'
                  >
                    <TrashIcon className='h-4 w-4' />
                  </button>
                </td>
              </tr>
            );
            })
          )}
        </tbody>
      </table>
      <Pagination pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
      
      <ConfirmationDialog 
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CustomerTable;

