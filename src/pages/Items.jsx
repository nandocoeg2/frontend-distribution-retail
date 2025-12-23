import React, { useState, useRef } from 'react';
import ItemTableServerSide from '../components/items/ItemTableServerSide';
import AddItemModal from '../components/items/AddItemModal';
import ItemDetailCard from '../components/items/ItemDetailCard';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { ConfirmationDialog } from '../components/ui';
import { exportExcel, deleteItem } from '../services/itemService';
import toastService from '../services/toastService';

const Items = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const tableRef = useRef(null);

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

  const handleDeleteItem = async (id) => {
    try {
      await deleteItem(id);
      toastService.success('Item berhasil dihapus');
    } catch (err) {
      console.error('Delete failed:', err);
      toastService.error(err.message || 'Gagal menghapus item');
    }
  };

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
          <ItemTableServerSide
            ref={tableRef}
            onViewDetail={handleViewDetail}
            onDelete={handleDeleteItem}
            selectedItemId={selectedItemForDetail?.id}
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
    </div>
  );
};

export default Items;
