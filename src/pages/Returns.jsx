import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useReturnsPage from '@/hooks/useReturnsPage';
import {
  ReturnsFilters,
  ReturnsTable,
  ReturnClassifyModal,
} from '@/components/returns';
import Pagination from '@/components/common/Pagination';
import {
  useConfirmationDialog,
} from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const ReturnsPage = () => {
  const navigate = useNavigate();
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const {
    returns,
    filters,
    pagination,
    loading,
    error,
    classifyTarget,
    classifyLoading,
    deleteLoading,
    deleteLoadingId,
    statusOptions,
    handleFiltersChange,
    handleSearch,
    handleResetFilters,
    handlePageChange,
    handleLimitChange,
    openClassifyModal,
    closeClassifyModal,
    handleClassify,
    handleDeleteReturn,
    refresh,
  } = useReturnsPage();

  const {
    showDialog: showDeleteDialog,
    hideDialog: hideDeleteDialog,
    setLoading: setDeleteDialogLoading,
    ConfirmationDialog: DeleteConfirmationDialog,
  } = useConfirmationDialog();

  const handleCreateReturn = () => {
    navigate('/returns/create');
  };

  const handleViewDetail = (id) => {
    if (!id) {
      return;
    }
    navigate(`/returns/${id}`);
  };

  const handleRequestDelete = (returnItem) => {
    if (!returnItem?.id) {
      return;
    }
    setPendingDeleteId(returnItem.id);
    showDeleteDialog({
      title: 'Hapus Retur',
      message: `Anda yakin ingin menghapus retur ${
        returnItem.returnNumber || returnItem.id
      }? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) {
      hideDeleteDialog();
      return;
    }

    setDeleteDialogLoading(true);
    const success = await handleDeleteReturn(pendingDeleteId);
    setDeleteDialogLoading(false);

    if (success) {
      setPendingDeleteId(null);
      hideDeleteDialog();
    }
  };

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm'>
        <div className='px-6 py-5 border-b border-gray-100'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-xl font-semibold text-gray-900'>
                Manajemen Retur Barang
              </h1>
              <p className='text-sm text-gray-500'>
                Catat, tinjau, dan klasifikasikan barang retur dari proses QC.
              </p>
            </div>
            <button
              type='button'
              onClick={handleCreateReturn}
              className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Buat Retur Baru
            </button>
          </div>
        </div>

        <div className='px-6 py-5'>
          <ReturnsFilters
            filters={filters}
            statusOptions={statusOptions}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            onReset={handleResetFilters}
            loading={loading}
          />

          {error ? (
            <div className='p-4 mb-4 border border-red-100 rounded-lg bg-red-50'>
              <p className='text-sm font-medium text-red-700'>
                Terjadi kesalahan saat memuat data retur.
              </p>
              <p className='mt-1 text-sm text-red-600'>{error}</p>
              <button
                type='button'
                onClick={refresh}
                className='inline-flex items-center px-3 py-2 mt-3 text-sm font-semibold text-white transition-colors bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700'
              >
                <HeroIcon name='arrow-path' className='w-4 h-4 mr-2' />
                Muat Ulang
              </button>
            </div>
          ) : null}

          <ReturnsTable
            returns={returns}
            loading={loading}
            onView={handleViewDetail}
            onClassify={openClassifyModal}
            onDelete={handleRequestDelete}
            classifyLoading={classifyLoading}
            deleteLoading={deleteLoading}
            deleteLoadingId={deleteLoadingId}
          />

          <div className='mt-6'>
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </div>
        </div>
      </div>

      <ReturnClassifyModal
        open={Boolean(classifyTarget)}
        onClose={closeClassifyModal}
        returnItem={classifyTarget}
        onConfirm={handleClassify}
        loading={classifyLoading}
      />

      <DeleteConfirmationDialog onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default ReturnsPage;
