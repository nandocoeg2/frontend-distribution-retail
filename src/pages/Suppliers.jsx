import React, { useState } from 'react';
import { useSuppliersPage as useSuppliers } from '@/hooks/useSuppliers';
import SupplierTable from '@/components/suppliers/SupplierTable';
import SupplierSearch from '@/components/suppliers/SupplierSearch';
import AddSupplierModal from '@/components/suppliers/AddSupplierModal';
import SupplierDetailCard from '@/components/suppliers/SupplierDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import supplierService from '../services/supplierService';
import toastService from '../services/toastService';

const Suppliers = () => {
  const {
    suppliers,
    pagination,
    loading,
    error,
    searchQuery,
    activeSearchQuery,
    searchLoading,
    handleSearchChange,
    handleSearchSubmit,
    handlePageChange,
    handleLimitChange,
    deleteSupplierConfirmation,
    fetchSuppliers,
    handleAuthError
  } = useSuppliers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);

  const closeAddModal = () => setShowAddModal(false);

  const confirmExportExcel = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);
      await supplierService.exportExcel(activeSearchQuery);
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

  const handleViewDetail = (supplier) => {
    setSelectedSupplierForDetail(supplier);
  };

  const handleCloseDetail = () => {
    setSelectedSupplierForDetail(null);
  };

  const handleSupplierAdded = () => {
    fetchSuppliers();
    closeAddModal();
  };

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-800'>Error: {error}</p>
        <button
          onClick={fetchSuppliers}
          className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        >
          Retry
        </button>
      </div>
    );
  }

  const isDetailOpen = Boolean(selectedSupplierForDetail);

  return (
    <div className={isDetailOpen ? 'space-y-3' : 'h-full flex flex-col'}>
      <div className={`max-w-full mx-auto w-full ${isDetailOpen ? '' : 'h-full flex flex-col'}`}>
        <div className={`bg-white shadow rounded-lg overflow-hidden p-3 ${isDetailOpen ? 'space-y-2' : 'flex flex-col flex-1 min-h-0'}`}>
          <div className='mb-2'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <h3 className='text-sm font-semibold text-gray-900'>Supplier List</h3>
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={handleExportExcel}
                  disabled={exportLoading}
                  className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50'
                >
                  {exportLoading ? (
                    <>
                      <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5'></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className='h-4 w-4 mr-1.5' />
                      Export Excel
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700'
                >
                  <PlusIcon className='h-4 w-4 mr-1.5' />
                  Add Supplier
                </button>
              </div>
            </div>
          </div>

          <div className='mb-2'>
            <SupplierSearch
              searchQuery={searchQuery}
              handleSearchChange={handleSearchChange}
              handleSearchSubmit={handleSearchSubmit}
              searchLoading={searchLoading}
            />
          </div>

          <div className={isDetailOpen ? '' : 'mt-1 flex-1 flex flex-col min-h-0'}>
            {loading && !searchLoading ? (
              <div className='flex justify-center items-center h-64'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
              </div>
            ) : (
              <SupplierTable
                suppliers={suppliers}
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onDelete={deleteSupplierConfirmation.showDeleteConfirmation}
                onViewDetail={handleViewDetail}
                selectedSupplierId={selectedSupplierForDetail?.id}
                searchQuery={activeSearchQuery}
                isDetailOpen={isDetailOpen}
              />
            )}
          </div>
        </div>
      </div>

      <AddSupplierModal
        show={showAddModal}
        onClose={closeAddModal}
        onSupplierAdded={handleSupplierAdded}
        handleAuthError={handleAuthError}
      />

      {/* Supplier Detail Card */}
      {selectedSupplierForDetail && (
        <SupplierDetailCard
          supplier={selectedSupplierForDetail}
          onClose={handleCloseDetail}
          handleAuthError={handleAuthError}
          onUpdate={() => {
            fetchSuppliers();
            handleViewDetail(selectedSupplierForDetail);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        show={deleteSupplierConfirmation.showConfirm}
        onClose={deleteSupplierConfirmation.hideDeleteConfirmation}
        onConfirm={deleteSupplierConfirmation.confirmDelete}
        title={deleteSupplierConfirmation.title}
        message={deleteSupplierConfirmation.message}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        loading={deleteSupplierConfirmation.loading}
      />

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

export default Suppliers;
