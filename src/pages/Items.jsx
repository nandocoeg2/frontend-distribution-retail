import React, { useState } from 'react';
import useItemsPage from '../hooks/useItemsPage';
import ItemSearch from '../components/items/ItemSearch';
import ItemTable from '../components/items/ItemTable';
import AddItemModal from '../components/items/AddItemModal';
import ItemDetailCard from '../components/items/ItemDetailCard';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { ConfirmationDialog } from '../components/ui';
import { exportExcel } from '../services/itemService';
import toastService from '../services/toastService';

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
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);

  const openAddModal = () => setIsAddModalOpen(true);

  const confirmExportExcel = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);
      await exportExcel(searchQuery);
      toastService.success('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      toastService.error(err.message || 'Gagal mengexport data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = () => {
    setShowExportConfirmation(true);
  };
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



  // if (loading && !searchLoading) {
  //   return (
  //     <div className='flex justify-center items-center h-64'>
  //       <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
  //     </div>
  //   );
  // }

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
    <div>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='p-3'>
          <div className='flex justify-between items-center mb-2'>
            <h1 className='text-sm font-semibold text-gray-900'>Items</h1>
            <div className='flex gap-2'>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className='inline-flex items-center px-2.5 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {exportLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5'></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <HeroIcon name='arrow-down-tray' className='h-4 w-4 mr-1.5' />
                    Export Excel
                  </>
                )}
              </button>
              <button
                onClick={openAddModal}
                className='inline-flex items-center px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='h-4 w-4 mr-1.5' />
                Add Item
              </button>
            </div>
          </div>
          <ItemSearch
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            searchLoading={searchLoading}
          />
          {loading && !searchLoading ? (
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            </div>
          ) : (
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
          )}
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

      {/* Export Confirmation Dialog */}
      <ConfirmationDialog
        show={showExportConfirmation}
        onClose={() => setShowExportConfirmation(false)}
        onConfirm={confirmExportExcel}
        title="Konfirmasi Export"
        message="Apakah Anda yakin ingin mengexport data ini ke Excel?"
        type="info"
        confirmText="Ya, Export"
        cancelText="Batal"
        loading={exportLoading}
      />
    </div>
  );
};

export default Items;
