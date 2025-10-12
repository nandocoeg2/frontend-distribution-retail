import React from 'react';
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useConfirmationDialog } from '../ui';
import Pagination from '../common/Pagination';

const InventoryTable = ({
  inventories,
  pagination,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onView,
  loading,
}) => {
  const [deleteId, setDeleteId] = React.useState(null);
  const { showDialog, hideDialog, ConfirmationDialog } =
    useConfirmationDialog();
  const formatDecimal = (value, fractionDigits = 2) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return '0';
    }
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    }).format(numericValue);
  };

  const resolveDimension = (inventory) => {
    const dimension = inventory.dimensiKardus || {};
    const berat = inventory.berat ?? dimension.berat ?? 0;
    const panjang = inventory.panjang ?? dimension.panjang ?? 0;
    const lebar = inventory.lebar ?? dimension.lebar ?? 0;
    const tinggi = inventory.tinggi ?? dimension.tinggi ?? 0;

    return {
      berat: `${formatDecimal(berat)} kg`,
      formattedSize: `${formatDecimal(panjang, 0)} x ${formatDecimal(lebar, 0)} x ${formatDecimal(tinggi, 0)} cm`,
    };
  };

  const handleDelete = (inventoryId) => {
    setDeleteId(inventoryId);
    showDialog({
      title: 'Hapus Item',
      message: 'Apakah Anda yakin ingin menghapus item ini?',
      type: 'danger',
      confirmText: 'Hapus',
      cancelText: 'Batal',
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
    <>
      <div className='overflow-x-auto bg-white rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                PLU
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Nama Barang
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Stok Karton
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Stok Pcs
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Harga
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Min Stok
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Berat (kg)
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Dimensi (cm)
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Updated
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {loading ? (
              <tr>
                <td colSpan='10' className='py-4 text-center'>
                  <div className='w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin'></div>
                </td>
              </tr>
            ) : inventories.length === 0 ? (
              <tr>
                <td colSpan='10' className='py-4 text-center text-gray-500'>
                  No inventory found.
                </td>
              </tr>
            ) : (
              inventories.map((inventory) => {
                const { berat, formattedSize } = resolveDimension(inventory);
                return (
                  <tr key={inventory.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 font-mono text-sm text-gray-900 whitespace-nowrap'>
                      {inventory.plu}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {inventory.nama_barang}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {inventory.stok_c}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {inventory.stok_q}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {formatCurrency(inventory.harga_barang)}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {inventory.min_stok}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {berat}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {formattedSize}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500 whitespace-nowrap'>
                      {formatDate(inventory.updatedAt)}
                    </td>
                    <td className='px-6 py-4 text-sm font-medium text-right whitespace-nowrap'>
                      <div className='flex items-center justify-end space-x-2'>
                        <button
                          onClick={() => onView(inventory)}
                          className='text-gray-600 hover:text-gray-900'
                          title='View'
                        >
                          <EyeIcon className='w-5 h-5' />
                        </button>
                        <button
                          onClick={() => onEdit(inventory)}
                          className='text-blue-600 hover:text-blue-900'
                          title='Edit'
                        >
                          <PencilSquareIcon className='w-5 h-5' />
                        </button>
                        <button
                          onClick={() => handleDelete(inventory.id)}
                          className='text-red-600 hover:text-red-900'
                          title='Delete'
                        >
                          <TrashIcon className='w-5 h-5' />
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

      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />

      <ConfirmationDialog onConfirm={handleConfirmDelete} />
    </>
  );
};

export default InventoryTable;
