import React, { useState } from 'react';
import { useSuppliersPage as useSuppliers } from '@/hooks/useSuppliers';
import SupplierTable from '@/components/suppliers/SupplierTable';
import SupplierSearch from '@/components/suppliers/SupplierSearch';
import AddSupplierModal from '@/components/suppliers/AddSupplierModal';
import SupplierDetailCard from '@/components/suppliers/SupplierDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import supplierService from '../services/supplierService';
import toastService from '../services/toastService';

const Suppliers = () => {
  const {
    suppliers,
    setSuppliers,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
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

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const confirmExportExcel = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);
      await supplierService.exportExcel(searchQuery);
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

  return (
    <div>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='p-3'>
          <div className='mb-2 flex justify-between items-center'>
            <h3 className='text-sm font-semibold text-gray-900'>Supplier List</h3>
            <div className='flex gap-2'>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className='inline-flex items-center px-2.5 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50'
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
                className='inline-flex items-center px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700'
              >
                <PlusIcon className='h-4 w-4 mr-1.5' />
                Add Supplier
              </button>
            </div>
          </div>

          <SupplierSearch
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            searchLoading={searchLoading}
          />

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
              searchQuery={searchQuery}
            />
          )}
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
