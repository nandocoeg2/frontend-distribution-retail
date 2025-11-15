import React from 'react';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatUtils';
import { useConfirmationDialog } from '../ui';
import Pagination from '../common/Pagination';

const ItemTable = ({
  items,
  pagination,
  onPageChange,
  onLimitChange,
  onDelete,
  onViewDetail,
  selectedItemId,
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

  const resolveDimension = (item) => {
    const dimensiValue = (() => {
      if (!item) {
        return null;
      }
      if (
        item.dimensiBarang &&
        typeof item.dimensiBarang === 'object' &&
        !Array.isArray(item.dimensiBarang)
      ) {
        return item.dimensiBarang;
      }

      if (Array.isArray(item.dimensiBarang) && item.dimensiBarang.length > 0) {
        return item.dimensiBarang[0];
      }

      if (item.dimensi && typeof item.dimensi === 'object') {
        return item.dimensi;
      }

      return null;
    })();

    const berat = item?.berat ?? dimensiValue?.berat ?? 0;
    const panjang = item?.panjang ?? dimensiValue?.panjang ?? 0;
    const lebar = item?.lebar ?? dimensiValue?.lebar ?? 0;
    const tinggi = item?.tinggi ?? dimensiValue?.tinggi ?? 0;

    return {
      berat: `${formatDecimal(berat)} kg`,
      formattedSize: `${formatDecimal(panjang, 0)} x ${formatDecimal(lebar, 0)} x ${formatDecimal(tinggi, 0)} cm`,
    };
  };

  const handleDelete = (itemId) => {
    setDeleteId(itemId);
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
                Nama Barang
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                PLU
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Kode Barang
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
                <td colSpan='6' className='py-4 text-center'>
                  <div className='w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin'></div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan='6' className='py-4 text-center text-gray-500'>
                  No items found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const { berat, formattedSize } = resolveDimension(item);
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => onViewDetail(item)}
                    className={`cursor-pointer transition-colors ${
                      selectedItemId === item.id 
                        ? 'bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {item.nama_barang}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600 font-mono bg-gray-100 rounded whitespace-nowrap'>
                      {item.plu}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600 font-mono bg-gray-100 rounded whitespace-nowrap'>
                      {item.kode_barang || 'N/A'}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {berat}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                      {formattedSize}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500 whitespace-nowrap'>
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className='px-6 py-4 text-sm font-medium text-right whitespace-nowrap'>
                      <div className='flex items-center justify-end space-x-2'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
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

export default ItemTable;
