import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import usePurchaseOrders from '../hooks/usePurchaseOrders';
import PurchaseOrderTable from '../components/purchaseOrders/PurchaseOrderTable.jsx';
import PurchaseOrderSearch from '../components/purchaseOrders/PurchaseOrderSearch.jsx';
import AddPurchaseOrderModal from '../components/purchaseOrders/AddPurchaseOrderModal.jsx';
import EditPurchaseOrderModal from '../components/purchaseOrders/EditPurchaseOrderModal.jsx';
import ViewPurchaseOrderModal from '../components/purchaseOrders/ViewPurchaseOrderModal.jsx';

const PurchaseOrders = () => {
  const {
    purchaseOrders,
    loading,
    error,
    searchLoading,
    searchPurchaseOrders,
    deletePurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrder,
  } = usePurchaseOrders();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleAddOrder = async (formData) => {
    const result = await createPurchaseOrder(formData);
    if (result) {
      setShowAddModal(false);
      return true;
    }
    return false;
  };

  const handleEditOrder = async (id, formData) => {
    const result = await updatePurchaseOrder(id, formData);
    if (result) {
      setShowEditModal(false);
      setEditingOrder(null);
      return true;
    }
    return false;
  };

  const handleViewOrder = async (order) => {
    setViewLoading(true);
    setShowViewModal(true);
    
    const orderData = await getPurchaseOrder(order.id);
    if (orderData) {
      setViewingOrder(orderData);
    }
    setViewLoading(false);
  };

  const handleEditModalOpen = (order) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Purchase Orders</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Purchase Order
            </button>
          </div>

          <PurchaseOrderSearch 
            onSearch={searchPurchaseOrders} 
            searchLoading={searchLoading} 
          />

          <PurchaseOrderTable
            orders={purchaseOrders}
            onView={handleViewOrder}
            onEdit={handleEditModalOpen}
            onDelete={deletePurchaseOrder}
            loading={loading}
          />
        </div>
      </div>

      <AddPurchaseOrderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddOrder}
      />

      <EditPurchaseOrderModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingOrder(null);
        }}
        onSubmit={handleEditOrder}
        order={editingOrder}
      />

      <ViewPurchaseOrderModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingOrder(null);
        }}
        order={viewingOrder}
        loading={viewLoading}
      />
    </div>
  );
};

export default PurchaseOrders;
