import React, { useCallback, useState } from 'react';
import useTandaTerimaFakturPage from '@/hooks/useTandaTerimaFakturPage';
import {
  TandaTerimaFakturSearch,
  TandaTerimaFakturTable,
  TandaTerimaFakturModal,
  TandaTerimaFakturDetailModal,
} from '@/components/tandaTerimaFaktur';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const TandaTerimaFakturPage = () => {
  const {
    tandaTerimaFakturs,
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
    createTandaTerimaFaktur,
    updateTandaTerimaFaktur,
    deleteTandaTerimaFaktur: triggerDeleteTandaTerimaFaktur,
    deleteTandaTerimaFakturConfirmation,
    fetchTandaTerimaFaktur,
    fetchTandaTerimaFakturById,
  } = useTandaTerimaFakturPage();

  const [selectedTtf, setSelectedTtf] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const openCreateModal = () => {
    setSelectedTtf(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditModal = (ttf) => {
    setSelectedTtf(ttf);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTtf(null);
  };

  const openDetailModal = useCallback(
    async (ttf) => {
      if (!ttf?.id) {
        return;
      }
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      try {
        const detail = await fetchTandaTerimaFakturById(ttf.id);
        setSelectedTtf(detail || ttf);
      } catch (err) {
        setSelectedTtf(ttf);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchTandaTerimaFakturById]
  );

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTtf(null);
    setDetailLoading(false);
  };

  const handleCreateSubmit = async (payload) => {
    const result = await createTandaTerimaFaktur(payload);
    if (result) {
      setIsCreateModalOpen(false);
    }
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedTtf?.id) {
      return;
    }
    const result = await updateTandaTerimaFaktur(selectedTtf.id, payload);
    if (result) {
      setIsEditModalOpen(false);
      setSelectedTtf(null);
    }
  };

  const handleDelete = (id) => {
    if (!id) {
      return;
    }
    triggerDeleteTandaTerimaFaktur(id);
  };

  const handleRetry = () => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    fetchTandaTerimaFaktur({ page: currentPage });
  };

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Tanda Terima Faktur
              </h3>
              <p className='text-sm text-gray-500'>
                Catat dan kelola serah terima dokumen faktur antara supplier
                dan customer.
              </p>
            </div>
            <div className='flex justify-end'>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Tambah TTF
              </button>
            </div>
          </div>

          <TandaTerimaFakturSearch
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
            <TandaTerimaFakturTable
              tandaTerimaFakturs={tandaTerimaFakturs}
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

      <TandaTerimaFakturModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
      />

      <TandaTerimaFakturModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedTtf}
        isEdit
      />

      <TandaTerimaFakturDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        tandaTerimaFaktur={selectedTtf}
        isLoading={detailLoading}
      />

      <ConfirmationDialog
        show={deleteTandaTerimaFakturConfirmation.showConfirm}
        onClose={deleteTandaTerimaFakturConfirmation.hideDeleteConfirmation}
        onConfirm={deleteTandaTerimaFakturConfirmation.confirmDelete}
        title={deleteTandaTerimaFakturConfirmation.title}
        message={deleteTandaTerimaFakturConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteTandaTerimaFakturConfirmation.loading}
      />
    </div>
  );
};

export default TandaTerimaFakturPage;
