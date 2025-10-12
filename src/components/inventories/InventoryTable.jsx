import React from 'react';
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { useConfirmationDialog } from '../ui';
import Pagination from '../common/Pagination';

const InventoryTable = ({ inventories, pagination, onPageChange, onLimitChange, onEdit, onDelete, onView, loading }) => {
  const [deleteId, setDeleteId] = React.useState(null);
  const { showDialog, hideDialog, ConfirmationDialog } = useConfirmationDialog();
  const formatDecimal = (value, fractionDigits = 2) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return '0';
    }
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits
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
      formattedSize: `${formatDecimal(panjang, 1)}Ã—${formatDecimal(lebar, 1)}Ã—${formatDecimal(tinggi, 1)} cm`
    };
  };

  const handleDelete = (inventoryId) => {
    setDeleteId(inventoryId);
    showDialog({
      title: "Hapus Item",
      message: "Apakah Anda yakin ingin menghapus item ini?",
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
    <>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PLU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Karton</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Pcs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stok</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Berat (kg)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensi (cm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : inventories.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-gray-500">No inventory found.</td>
              </tr>
            ) : (
              inventories.map((inventory) => {
                const { berat, formattedSize } = resolveDimension(inventory);
                return (
                <tr key={inventory.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{inventory.plu}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inventory.nama_barang}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inventory.stok_c}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inventory.stok_q}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(inventory.harga_barang)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inventory.min_stok}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{berat}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formattedSize}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(inventory.updatedAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onView(inventory)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onEdit(inventory)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(inventory.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
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

      <ConfirmationDialog
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default InventoryTable;

