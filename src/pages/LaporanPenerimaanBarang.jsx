import React, { useState } from 'react';
import useLaporanPenerimaanBarangPage from '@/hooks/useLaporanPenerimaanBarangPage';
import {
  LaporanPenerimaanBarangSearch,
  LaporanPenerimaanBarangTable,
  LaporanPenerimaanBarangModal,
  LaporanPenerimaanBarangDetailModal,
  LaporanPenerimaanBarangBulkModal,
} from '@/components/laporanPenerimaanBarang';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const LaporanPenerimaanBarang = () => {
  const {
    reports,
    pagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange,
    createReport,
    createReportFromFile,
    uploadBulkReports,
    fetchBulkStatus,
    updateReport,
    deleteReport,
    deleteReportConfirmation,
    fetchReports,
    fetchReportById,
  } = useLaporanPenerimaanBarangPage();

  const [selectedReport, setSelectedReport] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const openCreateModal = () => {
    setSelectedReport(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedReport(null);
  };

  const openBulkModal = () => {
    setIsBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    setIsBulkModalOpen(false);
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedReport(null);
  };

  const openDetailModal = async (report) => {
    if (!report?.id) {
      return;
    }

    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setSelectedReport(null);

    try {
      const detail = await fetchReportById(report.id);
      setSelectedReport(detail?.data || detail || null);
    } catch (error) {
      console.error('Failed to fetch laporan penerimaan barang detail:', error);
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReport(null);
    setDetailLoading(false);
  };

  const handleCreateSubmit = async (payload) => {
    await createReport(payload);
  };

  const handleUpdateSubmit = async (payload) => {
    if (!selectedReport?.id) {
      return;
    }
    await updateReport(selectedReport.id, payload);
  };

  const handleRetry = () => {
    const currentPage = pagination?.currentPage || pagination?.page || 1;
    const limit = pagination?.itemsPerPage || pagination?.limit || 10;
    fetchReports(currentPage, limit);
  };

  return (
    <div className='p-6'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-medium text-gray-900'>Laporan Penerimaan Barang</h3>
            <div className='flex items-center gap-2'>
              <button
                onClick={openBulkModal}
                className='inline-flex items-center rounded-md bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600'
              >
                <HeroIcon name='arrow-up-tray' className='mr-2 h-5 w-5' />
                Upload Bulk
              </button>
              <button
                onClick={openCreateModal}
                className='inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='mr-2 h-5 w-5' />
                Tambah Laporan
              </button>
            </div>
          </div>

          <LaporanPenerimaanBarangSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChange}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
          />

          {error ? (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <p className='text-red-800 text-sm mb-3'>Terjadi kesalahan: {error}</p>
              <button
                onClick={handleRetry}
                className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {loading && (
                <div className='flex items-center mb-4 text-sm text-gray-500'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2'></div>
                  Memuat data laporan...
                </div>
              )}
              <LaporanPenerimaanBarangTable
                reports={reports}
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onEdit={openEditModal}
                onDelete={deleteReport}
                onView={openDetailModal}
                searchQuery={searchQuery}
              />
            </>
          )}
        </div>
      </div>

      <LaporanPenerimaanBarangModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateSubmit}
        isEdit={false}
        onUploadFromFile={createReportFromFile}
      />

      <LaporanPenerimaanBarangModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateSubmit}
        initialValues={selectedReport}
        isEdit
      />

      <LaporanPenerimaanBarangDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        report={selectedReport}
        isLoading={detailLoading}
      />

      <LaporanPenerimaanBarangBulkModal
        isOpen={isBulkModalOpen}
        onClose={closeBulkModal}
        onBulkUpload={uploadBulkReports}
        onFetchStatus={fetchBulkStatus}
      />

      <ConfirmationDialog
        show={deleteReportConfirmation.showConfirm}
        onClose={deleteReportConfirmation.hideDeleteConfirmation}
        onConfirm={deleteReportConfirmation.confirmDelete}
        title={deleteReportConfirmation.title}
        message={deleteReportConfirmation.message}
        type='danger'
        confirmText='Hapus'
        cancelText='Batal'
        loading={deleteReportConfirmation.loading}
      />
    </div>
  );
};

export default LaporanPenerimaanBarang;
