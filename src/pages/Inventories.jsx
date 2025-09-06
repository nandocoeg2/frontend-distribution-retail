import React, { useState, useEffect } from 'react';
import InventorySearch from '../components/inventories/InventorySearch';
import InventoryTable from '../components/inventories/InventoryTable';
import AddInventoryModal from '../components/inventories/AddInventoryModal';
import EditInventoryModal from '../components/inventories/EditInventoryModal';
import ViewInventoryModal from '../components/inventories/ViewInventoryModal';
import Pagination from '../components/inventories/Pagination';
import { getInventories, searchInventories, deleteInventory } from '../services/inventoryService';
import toastService from '../services/toastService';

const Inventories = () => {
  const [inventories, setInventories] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInventories = async (page = 1) => {
    try {
      const data = await getInventories(page);
      setInventories(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toastService.error('Failed to fetch inventories');
      console.error('Fetch inventories error:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      fetchInventories(1);
    } else {
      try {
        const data = await searchInventories(query);
        setInventories(data.data);
        setPagination(data.pagination);
      } catch (error) {
        toastService.error('Failed to search inventories');
        console.error('Search inventories error:', error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventory(id);
        toastService.success('Inventory item deleted successfully');
        fetchInventories(pagination.currentPage);
      } catch (error) {
        toastService.error('Failed to delete inventory item');
        console.error('Delete inventory error:', error);
      }
    }
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    fetchInventories(pagination.currentPage);
  };

  const openEditModal = (inventory) => {
    setSelectedInventory(inventory);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedInventory(null);
    setIsEditModalOpen(false);
    fetchInventories(pagination.currentPage);
  };

  const openViewModal = (inventory) => {
    setSelectedInventory(inventory);
    setIsViewModalOpen(true);
  };
  const closeViewModal = () => {
    setSelectedInventory(null);
    setIsViewModalOpen(false);
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventories</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Inventory
        </button>
      </div>
      <InventorySearch onSearch={handleSearch} />
      <InventoryTable
        inventories={inventories}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onView={openViewModal}
      />
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={fetchInventories}
      />

      {isAddModalOpen && <AddInventoryModal onClose={closeAddModal} />}
      {isEditModalOpen && selectedInventory && (
        <EditInventoryModal
          inventory={selectedInventory}
          onClose={closeEditModal}
        />
      )}
      {isViewModalOpen && selectedInventory && (
        <ViewInventoryModal
          inventory={selectedInventory}
          onClose={closeViewModal}
        />
      )}
    </div>
  );
};

export default Inventories;
