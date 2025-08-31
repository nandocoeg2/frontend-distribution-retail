import React, { useEffect } from 'react';

const ViewPurchaseOrderModal = ({ isOpen, onClose, order, loading }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Purchase Order Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : order ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">PO Number</h4>
                <p className="mt-1 text-sm text-gray-900">{order.po_number || '-'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Customer ID</h4>
                <p className="mt-1 text-sm text-gray-900">{order.customerId || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Customer Name</h4>
                <p className="mt-1 text-sm text-gray-900">{order.customer?.name || '-'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Supplier Name</h4>
                <p className="mt-1 text-sm text-gray-900">{order.supplier?.name || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Total Items</h4>
                <p className="mt-1 text-sm text-gray-900">{order.total_items || 0}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Order Date</h4>
                <p className="mt-1 text-sm text-gray-900">{formatDate(order.tanggal_order)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">PO Type</h4>
                <p className="mt-1 text-sm text-gray-900">{order.po_type || '-'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="mt-1 text-sm text-gray-900">{order.status?.status_name || '-'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Surat Jalan</h4>
              <p className="mt-1 text-sm text-gray-900">{order.suratJalan || '-'}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Invoice Pengiriman</h4>
              <p className="mt-1 text-sm text-gray-900">{order.invoicePengiriman || '-'}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Surat PO</h4>
              <p className="mt-1 text-sm text-gray-900">{order.suratPO || '-'}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Surat Penagihan</h4>
              <p className="mt-1 text-sm text-gray-900">{order.suratPenagihan || '-'}</p>
            </div>

            {order.createdAt && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Updated At</h4>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No details available.</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPurchaseOrderModal;
