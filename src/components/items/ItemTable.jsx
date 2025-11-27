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
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200 text-xs table-fixed'>
          <colgroup>
            <col style={{ width: '180px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '60px' }} />
          </colgroup>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Nama Barang
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                PLU
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Kode Barang
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Berat
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Dimensi
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Updated
              </th>
              <th className='px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-100'>
            {loading ? (
              <tr>
                <td colSpan='7' className='px-2 py-1 text-center'>
                  <div className='w-6 h-6 mx-auto border-b-2 border-blue-600 rounded-full animate-spin'></div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan='7' className='px-2 py-1 text-center text-gray-500 text-xs'>
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
                    className={`cursor-pointer transition-colors h-8 ${
                      selectedItemId === item.id 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate' title={item.nama_barang}>
                      {item.nama_barang}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900'>
                      {item.plu}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900'>
                      {item.eanBarcode || item.item_code || 'N/A'}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900'>
                      {berat}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-900'>
                      {formattedSize}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs text-gray-600'>
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className='px-2 py-1 whitespace-nowrap text-xs'>
                      <div className='flex space-x-1'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className='p-0.5 text-red-600 hover:text-red-900'
                          title='Delete'
                        >
                          <TrashIcon className='h-4 w-4' />
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
    </div>
  );
};

export default ItemTable;
