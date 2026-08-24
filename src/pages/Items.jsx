import React, { useState, useRef } from 'react';
import ItemTableServerSide from '../components/items/ItemTableServerSide';
import AddItemModal from '../components/items/AddItemModal';
import ItemDetailCard from '../components/items/ItemDetailCard';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { ConfirmationDialog } from '../components/ui';
import { exportExcel, deleteItem, bulkDeleteItems } from '../services/itemService';
import toastService from '../services/toastService';

const Items = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const tableRef = useRef(null);

  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirmation, setShowBulkDeleteConfirmation] = useState(false);

  const openAddModal = () => setIsAddModalOpen(true);

  const confirmExportExcel = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);
      // Get current filters from table
      const filters = tableRef.current?.getFilters?.() || {};
      await exportExcel(filters.q || '');
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
    tableRef.current?.refetch?.();
  };

  const handleViewDetail = (row) => {
    setSelectedItemForDetail(row.original || row);
  };

  const handleCloseDetail = () => {
    setSelectedItemForDetail(null);
  };

  const handleSelectionChange = (id, isSelected) => {
    setSelectedItems((prev) => {
      if (isSelected) {
        return [...prev, id];
      } else {
        return prev.filter((itemId) => itemId !== id);
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      toastService.warning('Pilih minimal satu item untuk dihapus.');
      return;
    }
    setShowBulkDeleteConfirmation(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      const result = await bulkDeleteItems(selectedItems);
      const resultData = result?.data || result;

      setShowBulkDeleteConfirmation(false);

      const successCount = resultData?.successCount || 0;
      const failedCount = resultData?.failedIds?.length || 0;

      if (successCount > 0 && failedCount === 0) {
        toastService.success(`Berhasil menghapus ${successCount} item.`);
      } else if (successCount > 0 && failedCount > 0) {
        toastService.warning(`Berhasil menghapus ${successCount} item. ${failedCount} gagal dihapus.`);
      } else {
        toastService.error('Gagal menghapus item.');
      }

      setSelectedItems([]);
      tableRef.current?.refetch?.();
      
      if (selectedItemForDetail && selectedItems.includes(selectedItemForDetail.id)) {
        setSelectedItemForDetail(null);
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toastService.error(err.message || 'Gagal menghapus item.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const isDetailOpen = Boolean(selectedItemForDetail);

  return (
    <div className={isDetailOpen ? 'space-y-3' : 'h-full flex flex-col'}>
      <div className={`max-w-full mx-auto w-full ${isDetailOpen ? '' : 'h-full flex flex-col'}`}>
        <div className={`bg-white shadow rounded-lg overflow-hidden p-3 ${isDetailOpen ? 'space-y-2' : 'flex flex-col flex-1 min-h-0'}`}>
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
          <div className={isDetailOpen ? '' : 'flex-1 flex flex-col min-h-0'}>
            <ItemTableServerSide
              ref={tableRef}
              onViewDetail={handleViewDetail}
              selectedItems={selectedItems}
              onSelectionChange={handleSelectionChange}
              onBulkDelete={handleBulkDelete}
              isDeleting={bulkDeleting}
              hasSelectedItems={selectedItems.length > 0}
              selectedItemId={selectedItemForDetail?.id}
            />
          </div>
        </div>
      </div>

      {isAddModalOpen && <AddItemModal onClose={closeAddModal} />}

      {/* Item Detail Card */}
      {selectedItemForDetail && (
        <ItemDetailCard
          item={selectedItemForDetail}
          onClose={handleCloseDetail}
          onUpdate={() => {
            tableRef.current?.refetch?.();
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

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        show={showBulkDeleteConfirmation}
        onClose={() => setShowBulkDeleteConfirmation(false)}
        onConfirm={confirmBulkDelete}
        title="Konfirmasi Hapus"
        message={`Apakah Anda yakin ingin menghapus ${selectedItems.length} item terpilih?`}
        type="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={bulkDeleting}
      />
    </div>
  );
};

export default Items;
