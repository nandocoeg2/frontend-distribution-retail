import React, { useState, useEffect } from 'react';
import usePurchaseOrders from '../hooks/usePurchaseOrders';
import PurchaseOrderTable from '../components/purchaseOrders/PurchaseOrderTable.jsx';
import PurchaseOrderSearch from '../components/purchaseOrders/PurchaseOrderSearch.jsx';
import AddPurchaseOrderModal from '../components/purchaseOrders/AddPurchaseOrderModal.jsx';
import EditPurchaseOrderModal from '../components/purchaseOrders/EditPurchaseOrderModal.jsx';
import ViewPurchaseOrderModal from '../components/purchaseOrders/ViewPurchaseOrderModal.jsx';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { useNavigate } from 'react-router-dom';

const PurchaseOrders = () => {
  const {
    purchaseOrders,
    pagination,
    loading,
    error,
    searchLoading,
    searchQuery,
    searchField,
    fetchPurchaseOrders,
    searchPurchaseOrders,
    deletePurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrder,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSearchFieldChange,
  } = usePurchaseOrders();

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  // This function is now the callback for when the Add modal is finished.
  const handleAddFinished = () => {
    setAddModalOpen(false);
    fetchPurchaseOrders(); // Always refresh the list when the modal closes.
  };

  const handleEditOrder = async (id, formData) => {
    const result = await updatePurchaseOrder(id, formData);
    if (result) {
      setEditModalOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleViewOrder = async (order) => {
    setViewModalOpen(true);
    const orderData = await getPurchaseOrder(order.id);
    setSelectedOrder(orderData);
  };

  const handleEditModalOpen = async (order) => {
    setEditModalOpen(true);
    const orderData = await getPurchaseOrder(order.id);
    setSelectedOrder(orderData);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={() => fetchPurchaseOrders()}
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Add Purchase Order
              </button>
            </div>
          </div>

          <PurchaseOrderSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChange}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
          />

          <PurchaseOrderTable
            orders={purchaseOrders}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onView={handleViewOrder}
            onEdit={handleEditModalOpen}
            onDelete={deletePurchaseOrder}
            loading={loading}
          />
        </div>
      </div>

      {isAddModalOpen && (
        <AddPurchaseOrderModal
          isOpen={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          onFinished={handleAddFinished}
          createPurchaseOrder={createPurchaseOrder}
        />
      )}

      {selectedOrder && isEditModalOpen && (
        <EditPurchaseOrderModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleEditOrder}
          order={selectedOrder}
        />
      )}

      {isViewModalOpen && (
        <ViewPurchaseOrderModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          loading={!selectedOrder} 
          onProcessed={() => {
            fetchPurchaseOrders();
          }}
        />
      )}
    </div>
  );
};

export default PurchaseOrders;
