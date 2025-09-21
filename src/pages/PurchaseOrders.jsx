import React, { useState, useEffect } from 'react';
import usePurchaseOrders from '../hooks/usePurchaseOrders';
import PurchaseOrderTable from '../components/purchaseOrders/PurchaseOrderTable.jsx';
import PurchaseOrderSearch from '../components/purchaseOrders/PurchaseOrderSearch.jsx';
import AddPurchaseOrderModal from '../components/purchaseOrders/AddPurchaseOrderModal.jsx';
import EditPurchaseOrderModal from '../components/purchaseOrders/EditPurchaseOrderModal.jsx';
import ViewPurchaseOrderModal from '../components/purchaseOrders/ViewPurchaseOrderModal.jsx';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { useConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { useAlert } from '../components/ui/Alert';
import purchaseOrderService from '../services/purchaseOrderService';
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
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { showDialog, hideDialog, setLoading, ConfirmationDialog } = useConfirmationDialog();
  const { showSuccess, showError, showWarning, AlertComponent } = useAlert();
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

  // Bulk selection handlers
  const handleSelectionChange = (orderId, checked) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = purchaseOrders.map(order => order.id);
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders([]);
    }
  };

  // Bulk process handlers
  const handleBulkProcess = () => {
    if (selectedOrders.length === 0) {
      showWarning('Pilih minimal satu purchase order untuk diproses.');
      return;
    }

    showDialog({
      title: "Proses Purchase Orders",
      message: `Apakah Anda yakin ingin memproses ${selectedOrders.length} purchase order yang dipilih?`,
      confirmText: "Proses",
      cancelText: "Batal",
      type: "warning"
    });
  };

  const handleConfirmBulkProcess = async () => {
    setLoading(true);
    setBulkProcessing(true);
    
    try {
      const result = await purchaseOrderService.processPurchaseOrder(selectedOrders, 'PROCESSING PURCHASE ORDER');
      
      if (result.success) {
        const successCount = result.data?.success?.length || 0;
        const failedCount = result.data?.failed?.length || 0;
        
        let message = `Berhasil memproses ${successCount} purchase order.`;
        if (failedCount > 0) {
          message += ` ${failedCount} purchase order gagal diproses.`;
        }
        
        showSuccess(message);
        
        // Refresh data dan clear selection
        fetchPurchaseOrders();
        setSelectedOrders([]);
        hideDialog();
      } else {
        throw new Error('Failed to process purchase orders');
      }
    } catch (error) {
      console.error('Error processing purchase orders:', error);
      showError(`Gagal memproses purchase orders: ${error.message}`);
    } finally {
      setLoading(false);
      setBulkProcessing(false);
    }
  };

  // Clear selection when data changes
  useEffect(() => {
    setSelectedOrders([]);
  }, [purchaseOrders]);

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
              {selectedOrders.length > 0 && (
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-gray-600">
                    {selectedOrders.length} dipilih
                  </span>
                  <button
                    onClick={handleBulkProcess}
                    disabled={bulkProcessing}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                  >
                    {bulkProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Proses ({selectedOrders.length})
                      </>
                    )}
                  </button>
                </div>
              )}
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
            selectedOrders={selectedOrders}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
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

      {/* Bulk Process Confirmation Dialog */}
      <ConfirmationDialog onConfirm={handleConfirmBulkProcess} />
      
      {/* Alert Component */}
      <AlertComponent />
    </div>
  );
};

export default PurchaseOrders;
