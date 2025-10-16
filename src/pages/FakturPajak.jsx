import React, { useCallback, useState } from 'react';
import useFakturPajakPage from '@/hooks/useFakturPajakPage';
import {
  FakturPajakSearch,
  FakturPajakTable,
  FakturPajakModal,
  FakturPajakDetailModal,
} from '@/components/fakturPajak';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const FakturPajakPage = () => {
  const {
    fakturPajaks,
    pagination,
    loading,
    error,
    filters,
    searchLoading,
    hasActiveFilters,
    searchQuery,
    handleFiltersChange,
    handleSearchSubmit,
    handleResetFilters,
    handlePageChange,
    handleLimitChange,
    createFakturPajak,
    updateFakturPajak,
    deleteFakturPajak: triggerDeleteFakturPajak,
    deleteFakturPajakConfirmation,
    fetchFakturPajak,
    fetchFakturPajakById,
  } = useFakturPajakPage();

  const [selectedFakturPajak, setSelectedFakturPajak] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const openCreateModal = () => {
    setSelectedFakturPajak(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (fakturPajak) => {
    setSelectedFakturPajak(fakturPajak);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedFakturPajak(null);
  };

  const openDetailModal = useCallback(
    async (fakturPajak) => {
      if (!fakturPajak?.id) {
        return;
      }
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      try {
        const detail = await fetchFakturPajakById(fakturPajak.id);
        setSelectedFakturPajak(detail || fakturPajak);
      } catch (err) {
        setSelectedFakturPajak(fakturPajak);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchFakturPajakById],
  );

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedFakturPajak(null);
    setDetailLoading(false);
  };

  const handleCreateSubmit = async (payload) => {
    const result = await createFakturPajak(payload);
    if (result) {
      setIsCreateModalOpen(false);
    }
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedFakturPajak?.id) {
      return;
    }
    const result = await updateFakturPajak(selectedFakturPajak.id, payload);
    if (result) {
      setIsEditModalOpen(false);
      setSelectedFakturPajak(null);
    }
  };

  const handleDelete = (id) => {
    if (!id) {
      return;
    }
    triggerDeleteFakturPajak(id);
  };

  const handleRetry = () => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    fetchFakturPajak({ page: currentPage });
  };

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Manajemen Faktur Pajak
              </h3>
              <p className='text-sm text-gray-500'>
                Kelola faktur pajak penjualan beserta relasi invoice dan
                laporan penerimaan barang.
              </p>
            </div>
            <div className='flex justify-end'>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah Faktur Pajak
              </button>
            </div>
          </div>

          <FakturPajakSearch
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearchSubmit}
            onReset={handleResetFilters}
            loading={searchLoading || loading}
          />

          {error ? (
            <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
              <p className='mb-3 text-sm text-red-800'>
                Terjadi kesalahan: {error}
              </p>
              <button
                onClick={handleRetry}
                className='px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700'
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <FakturPajakTable
              fakturPajaks={fakturPajaks}
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onView={openDetailModal}
              loading={loading}
              searchQuery={searchQuery}
              hasActiveFilters={hasActiveFilters}
            />
          )}
        </div>
      </div>

      <FakturPajakModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <FakturPajakModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedFakturPajak}
        isEdit
      />

      <FakturPajakDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        fakturPajak={selectedFakturPajak}
        isLoading={detailLoading}
      />

      <ConfirmationDialog
        show={deleteFakturPajakConfirmation.showConfirm}
        onClose={deleteFakturPajakConfirmation.hideDeleteConfirmation}
        onConfirm={deleteFakturPajakConfirmation.confirmDelete}
        title={deleteFakturPajakConfirmation.title}
        message={deleteFakturPajakConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteFakturPajakConfirmation.loading}
      />
    </div>
  );
};

export default FakturPajakPage;
