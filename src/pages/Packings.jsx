import React from 'react';
import usePackingsPage from '../hooks/usePackingsPage';
import {
  PackingTable,
  PackingSearch,
  PackingModal,
  ViewPackingModal
} from '../components/packings';
import Pagination from '../components/common/Pagination';
import { useConfirmationDialog, ConfirmationDialog as BaseConfirmationDialog } from '../components/ui/ConfirmationDialog';

const Packings = () => {
  const {
    packings,
    pagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    viewingPacking,
    isViewModalOpen,
    searchFilters,
    selectedPackings,
    isProcessing,
    hasSelectedPackings,
    deletePacking,
    deletePackingConfirmation,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    openViewModal,
    closeViewModal,
    handleProcessPackings,
    handleFilterChange,
    clearFilters,
    handleSelectPacking,
    handleSelectAllPackings,
    refreshPackings
  } = usePackingsPage();

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingPacking, setEditingPacking] = React.useState(null);

  // Confirmation dialog for process packing
  const { showDialog, hideDialog, setLoading, ConfirmationDialog: ProcessConfirmationDialog } = useConfirmationDialog();

  const handleEditPacking = (packing) => {
    setEditingPacking(packing);
    setIsEditModalOpen(true);
  };

  const handleModalSuccess = () => {
    refreshPackings();
  };

  const handleProcessSelected = () => {
    showDialog({
      title: "Konfirmasi Proses Packing",
      message: `Apakah Anda yakin ingin memproses ${selectedPackings.length} packing yang dipilih? Status akan berubah dari "PENDING PACKING" menjadi "PROCESSING PACKING".`,
      confirmText: "Ya, Proses",
      cancelText: "Batal",
      type: "warning"
    });
  };

  const handleConfirmProcess = async () => {
    setLoading(true);
    try {
      await handleProcessPackings();
      hideDialog();
    } catch (error) {
      console.error('Error processing packings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Packing Management</h1>
          {/* <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Tambah Packing
          </button> */}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <PackingSearch 
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChange}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
            searchFilters={searchFilters}
            handleFilterChange={handleFilterChange}
            clearFilters={clearFilters}
          />

          {loading && <p className="text-center text-gray-500">Loading...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}

          {!loading && !error && (
            <>
              <PackingTable 
                packings={packings} 
                onViewById={openViewModal}
                onEdit={handleEditPacking}
                onDelete={deletePacking}
                deleteLoading={deletePackingConfirmation.loading}
                selectedPackings={selectedPackings}
                onSelectPacking={handleSelectPacking}
                onSelectAllPackings={handleSelectAllPackings}
                onProcessSelected={handleProcessSelected}
                isProcessing={isProcessing}
                hasSelectedPackings={hasSelectedPackings}
              />
              <Pagination 
                pagination={pagination} 
                onPageChange={handlePageChange} 
              />
            </>
          )}
        </div>

        {isViewModalOpen && (
          <ViewPackingModal 
            packing={viewingPacking} 
            onClose={closeViewModal} 
          />
        )}

        {isCreateModalOpen && (
          <PackingModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleModalSuccess}
          />
        )}

        {isEditModalOpen && (
          <PackingModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingPacking(null);
            }}
            initialData={editingPacking}
            onSuccess={handleModalSuccess}
          />
        )}

        {/* Confirmation Dialogs */}
        <ProcessConfirmationDialog onConfirm={handleConfirmProcess} />

        <BaseConfirmationDialog
          show={deletePackingConfirmation.showConfirm}
          onClose={deletePackingConfirmation.hideDeleteConfirmation}
          onConfirm={deletePackingConfirmation.confirmDelete}
          title={deletePackingConfirmation.title}
          message={deletePackingConfirmation.message}
          type="danger"
          confirmText="Hapus"
          cancelText="Batal"
          loading={deletePackingConfirmation.loading}
        />
      </div>
    </div>
  );
};

export default Packings;


