import React, { useState } from 'react';
import useItemsPage from '../hooks/useItemsPage';
import ItemSearch from '../components/items/ItemSearch';
import ItemTable from '../components/items/ItemTable';
import AddItemModal from '../components/items/AddItemModal';
import ItemDetailCard from '../components/items/ItemDetailCard';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { ConfirmationDialog } from '../components/ui';

const Items = () => {
  const {
    items,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteItem,
    fetchItems
  } = useItemsPage();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    if (fetchItems) {
      fetchItems();
    }
  };

  const handleViewDetail = (item) => {
    setSelectedItemForDetail(item);
  };

  const handleCloseDetail = () => {
    setSelectedItemForDetail(null);
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
          onClick={() => fetchItems && fetchItems()}
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
            <h1 className="text-2xl font-bold">Items</h1>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Item
            </button>
          </div>
          <ItemSearch
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            searchLoading={searchLoading}
          />
          <ItemTable
            items={items}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onDelete={deleteItem}
            onViewDetail={handleViewDetail}
            selectedItemId={selectedItemForDetail?.id}
            loading={loading || searchLoading}
          />
        </div>
      </div>

      {isAddModalOpen && <AddItemModal onClose={closeAddModal} />}

      {/* Item Detail Card */}
      {selectedItemForDetail && (
        <ItemDetailCard
          item={selectedItemForDetail}
          onClose={handleCloseDetail}
          onUpdate={() => {
            if (fetchItems) {
              fetchItems();
            }
            handleViewDetail(selectedItemForDetail);
          }}
        />
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        show={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Konfirmasi"
        message="Apakah Anda yakin?"
        type="warning"
        confirmText="Ya"
        cancelText="Batal"
        loading={false}
      />
    </div>
  );
};

export default Items;
