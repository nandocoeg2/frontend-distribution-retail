import React, { useCallback, useState } from 'react';
import useKwitansiPage from '@/hooks/useKwitansiPage';
import {
  KwitansiSearch,
  KwitansiTable,
  KwitansiModal,
  KwitansiDetailModal,
} from '@/components/kwitansi';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const KwitansiPage = () => {
  const {
    kwitansis,
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
    createKwitansi,
    updateKwitansi,
    deleteKwitansi: triggerDeleteKwitansi,
    deleteKwitansiConfirmation,
    fetchKwitansi,
    fetchKwitansiById,
  } = useKwitansiPage();

  const [selectedKwitansi, setSelectedKwitansi] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const openCreateModal = () => {
    setSelectedKwitansi(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (kwitansi) => {
    setSelectedKwitansi(kwitansi);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedKwitansi(null);
  };

  const openDetailModal = useCallback(
    async (kwitansi) => {
      if (!kwitansi?.id) {
        return;
      }
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      try {
        const detail = await fetchKwitansiById(kwitansi.id);
        setSelectedKwitansi(detail || kwitansi);
      } catch (err) {
        setSelectedKwitansi(kwitansi);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchKwitansiById]
  );

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedKwitansi(null);
    setDetailLoading(false);
  };

  const handleCreateSubmit = async (payload) => {
    const result = await createKwitansi(payload);
    if (result) {
      setIsCreateModalOpen(false);
    }
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedKwitansi?.id) {
      return;
    }
    const result = await updateKwitansi(selectedKwitansi.id, payload);
    if (result) {
      setIsEditModalOpen(false);
      setSelectedKwitansi(null);
    }
  };

  const handleDelete = (id) => {
    if (!id) {
      return;
    }
    triggerDeleteKwitansi(id);
  };

  const handleRetry = () => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    fetchKwitansi({ page: currentPage });
  };

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Manajemen Kwitansi
              </h3>
              <p className='text-sm text-gray-500'>
                Pantau dan kelola bukti pembayaran dari invoice penagihan
                pelanggan.
              </p>
            </div>
            <div className='flex justify-end'>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah Kwitansi
              </button>
            </div>
          </div>

          <KwitansiSearch
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
            <KwitansiTable
              kwitansis={kwitansis}
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

      <KwitansiModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <KwitansiModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedKwitansi}
        isEdit
      />

      <KwitansiDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        kwitansi={selectedKwitansi}
        isLoading={detailLoading}
      />

      <ConfirmationDialog
        show={deleteKwitansiConfirmation.showConfirm}
        onClose={deleteKwitansiConfirmation.hideDeleteConfirmation}
        onConfirm={deleteKwitansiConfirmation.confirmDelete}
        title={deleteKwitansiConfirmation.title}
        message={deleteKwitansiConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteKwitansiConfirmation.loading}
      />
    </div>
  );
};

export default KwitansiPage;
