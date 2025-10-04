import React from 'react';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';
import { useConfirmationDialog } from '../ui/ConfirmationDialog';

const PurchaseOrderTable = ({
  orders,
  pagination,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onDelete,
  loading,
  isHistory = false,
  selectedOrders = [],
  onSelectionChange,
  onSelectAll,
}) => {
  const { showDialog, hideDialog, setLoading, ConfirmationDialog } =
    useConfirmationDialog();
  const [deletingOrderId, setDeletingOrderId] = React.useState(null);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  const handleDeleteClick = (orderId, orderNumber) => {
    setDeletingOrderId(orderId);
    showDialog({
      title: 'Hapus Purchase Order',
      message: `Apakah Anda yakin ingin menghapus Purchase Order "${orderNumber}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
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

  const isProcessingStatus = (order) => {
    if (!order?.status) {
      return false;
    }

    const normalize = (value) => {
      if (!value) {
        return '';
      }
      return value.toString().trim().toLowerCase().replace(/_/g, ' ');
    };

    const normalizedName = normalize(order.status.status_name);
    const normalizedCode = normalize(order.status.status_code);
    return (
      normalizedName === 'processing purchase order' ||
      normalizedCode === 'processing purchase order'
    );
  };

  return (
    <>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead>
            <tr>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                <input
                  type='checkbox'
                  className='text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  checked={
                    orders.length > 0 && selectedOrders.length === orders.length
                  }
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  disabled={loading || isHistory}
                />
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                PO Number
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Customer
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Total Items
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Tanggal Masuk PO
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Tanggal Batas Kirim
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                TOP
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Type
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Status
              </th>
              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan='10'
                  className='px-6 py-4 text-center text-gray-500'
                >
                  No purchase orders available.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isProcessing = isProcessingStatus(order);

                return (
                  <tr key={order.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <input
                        type='checkbox'
                        className='text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) =>
                          onSelectionChange &&
                          onSelectionChange(order.id, e.target.checked)
                        }
                        disabled={loading || isHistory}
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {order.po_number}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {order.customer?.namaCustomer || '-'}
                      </div>
                      {order.customer?.kodeCustomer && (
                        <div className='text-xs text-gray-500'>
                          {order.customer.kodeCustomer}
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {order.total_items}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {order.tanggal_masuk_po
                          ? new Date(order.tanggal_masuk_po).toLocaleDateString(
                              'id-ID'
                            )
                          : '-'}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {order.tanggal_batas_kirim
                          ? new Date(
                              order.tanggal_batas_kirim
                            ).toLocaleDateString('id-ID')
                          : '-'}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {order.termOfPayment?.kode_top || '-'}
                      </div>
                      {order.termOfPayment?.batas_hari && (
                        <div className='text-xs text-gray-500'>
                          {order.termOfPayment.batas_hari} hari
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {order.po_type}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {order.status?.status_name ? (
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status.status_name
                              .toLowerCase()
                              .includes('approved')
                              ? 'bg-green-100 text-green-800'
                              : order.status.status_name
                                    .toLowerCase()
                                    .includes('failed')
                                ? 'bg-red-100 text-red-800'
                                : getStatusClass(order.status.status_name)
                          }`}
                        >
                          {order.status.status_name}
                        </span>
                      ) : (
                        <span className='text-sm text-gray-500'>-</span>
                      )}
                    </td>
                    <td className='px-6 py-4 text-sm font-medium text-right whitespace-nowrap'>
                      <div className='flex space-x-2'>
                        <button
                          type='button'
                          onClick={() => onView(order)}
                          className='p-1 text-indigo-600 hover:text-indigo-900'
                          title='View'
                        >
                          <EyeIcon className='w-4 h-4' />
                        </button>
                        {!isHistory && (
                          <>
                            <button
                              type='button'
                              onClick={() => !isProcessing && onEdit(order)}
                              className={`p-1 ${
                                isProcessing
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-indigo-600 hover:text-indigo-900'
                              }`}
                              title={
                                isProcessing
                                  ? 'Purchase order sedang diproses dan tidak dapat diedit.'
                                  : 'Edit'
                              }
                              disabled={isProcessing}
                            >
                              <PencilIcon className='w-4 h-4' />
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                handleDeleteClick(order.id, order.po_number)
                              }
                              className='p-1 text-red-600 hover:text-red-900'
                              title='Delete'
                            >
                              <TrashIcon className='w-4 h-4' />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
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
