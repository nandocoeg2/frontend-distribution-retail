import React, { useState } from 'react';
import useInventoriesPage from '../hooks/useInventoriesPage';
import InventorySearch from '../components/inventories/InventorySearch';
import InventoryTable from '../components/inventories/InventoryTable';
import AddInventoryModal from '../components/inventories/AddInventoryModal';
import EditInventoryModal from '../components/inventories/EditInventoryModal';
import ViewInventoryModal from '../components/inventories/ViewInventoryModal';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Inventories = () => {
  const {
    inventories,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteInventory,
    fetchInventories
  } = useInventoriesPage();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    fetchInventories(pagination.currentPage, pagination.itemsPerPage);
  };

  const openEditModal = (inventory) => {
    setSelectedInventory(inventory);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedInventory(null);
    setIsEditModalOpen(false);
    fetchInventories(pagination.currentPage, pagination.itemsPerPage);
  };

  const openViewModal = (inventory) => {
    setSelectedInventory(inventory);
    setIsViewModalOpen(true);
  };
  const closeViewModal = () => {
    setSelectedInventory(null);
    setIsViewModalOpen(false);
  };



  if (loading && !searchLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-800'>Error: {error}</p>
        <button
          onClick={() => fetchInventories()}
          className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Inventories</h1>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Inventory
            </button>
          </div>
          <InventorySearch
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            searchLoading={searchLoading}
          />
          <InventoryTable
            inventories={inventories}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal}
            onDelete={deleteInventory}
            onView={openViewModal}
            loading={loading || searchLoading}
          />
        </div>
      </div>

      {isAddModalOpen && <AddInventoryModal onClose={closeAddModal} />}
      {isEditModalOpen && selectedInventory && (
        <EditInventoryModal
          inventory={selectedInventory}
          onClose={closeEditModal}
        />
      )}
      {isViewModalOpen && selectedInventory && (
        <ViewInventoryModal
          show={isViewModalOpen}
          inventory={selectedInventory}
          onClose={closeViewModal}
        />
      )}
    </div>
  );
};

export default Inventories;
