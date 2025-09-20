import React from 'react';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';
import { useConfirmationDialog } from '../ui/ConfirmationDialog';

const PurchaseOrderTable = ({ orders, pagination, onPageChange, onLimitChange, onView, onEdit, onDelete, loading, isHistory = false, selectedOrders = [], onSelectionChange, onSelectAll }) => {
  const { showDialog, hideDialog, setLoading, ConfirmationDialog } = useConfirmationDialog();
  const [deletingOrderId, setDeletingOrderId] = React.useState(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleDeleteClick = (orderId, orderNumber) => {
    setDeletingOrderId(orderId);
    showDialog({
      title: "Hapus Purchase Order",
      message: `Apakah Anda yakin ingin menghapus Purchase Order "${orderNumber}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger"
    });
  };

  const handleConfirmDelete = async () => {
    if (deletingOrderId) {
      setLoading(true);
      try {
        await onDelete(deletingOrderId);
        hideDialog();
      } catch (error) {
        console.error('Error deleting purchase order:', error);
      } finally {
        setLoading(false);
        setDeletingOrderId(null);
      }
    }
  };

  const getStatusClass = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const lowerCaseStatus = status.toLowerCase();
    if (lowerCaseStatus.includes('pending')) {
      return 'bg-gray-100 text-gray-800';
    }
    if (lowerCaseStatus.includes('processing')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (lowerCaseStatus.includes('processed')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={orders.length > 0 && selectedOrders.length === orders.length}
                onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                disabled={loading || isHistory}
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PO Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanggal Masuk PO
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanggal Batas Kirim
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Termin Bayar
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                  No purchase orders available.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => onSelectionChange && onSelectionChange(order.id, e.target.checked)}
                      disabled={loading || isHistory}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.po_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.customer?.namaCustomer || '-'}
                    </div>
                    {order.customer?.kodeCustomer && (
                      <div className="text-xs text-gray-500">
                        {order.customer.kodeCustomer}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.total_items}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.tanggal_masuk_po ? new Date(order.tanggal_masuk_po).toLocaleDateString('id-ID') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.tanggal_batas_kirim ? new Date(order.tanggal_batas_kirim).toLocaleDateString('id-ID') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.termin_bayar || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.po_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.status?.status_name ? (
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status.status_name.toLowerCase().includes('approved')
                            ? 'bg-green-100 text-green-800'
                            : order.status.status_name.toLowerCase().includes('failed')
                              ? 'bg-red-100 text-red-800'
                              : getStatusClass(order.status.status_name)
                        }`}
                      >
                        {order.status.status_name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onView(order)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="View"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {!isHistory && (
                        <>
                          <button
                            onClick={() => onEdit(order)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(order.id, order.po_number)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
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
      
      <ConfirmationDialog onConfirm={handleConfirmDelete} />
    </>
  );
};

export default PurchaseOrderTable;

