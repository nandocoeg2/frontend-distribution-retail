import React, { useState } from 'react';
import useTermOfPayments from '@/hooks/useTermOfPayments';
import TermOfPaymentTable from '@/components/termOfPayments/TermOfPaymentTable';
import TermOfPaymentSearch from '@/components/termOfPayments/TermOfPaymentSearch';
import AddTermOfPaymentModal from '@/components/termOfPayments/AddTermOfPaymentModal';
import TermOfPaymentDetailCard from '@/components/termOfPayments/TermOfPaymentDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import termOfPaymentService from '../services/termOfPaymentService';
import toastService from '../services/toastService';

const TermOfPayments = () => {
  const {
    termOfPayments,
    setTermOfPayments,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    createTermOfPayment,
    updateTermOfPayment,
    getTermOfPaymentById,
    deleteTermOfPaymentConfirmation,
    fetchTermOfPayments,
    handleAuthError
  } = useTermOfPayments();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTermOfPaymentForDetail, setSelectedTermOfPaymentForDetail] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const confirmExportExcel = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);
      await termOfPaymentService.exportExcel(searchQuery);
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

  const handleViewDetail = async (termOfPayment) => {
    try {
      // Optionally fetch detailed data if needed
      const detailData = await getTermOfPaymentById(termOfPayment.id);
      setSelectedTermOfPaymentForDetail(detailData);
    } catch (err) {
      // If fetch fails, use list data
      console.warn('Failed to fetch term of payment details, using list data:', err.message);
      setSelectedTermOfPaymentForDetail(termOfPayment);
    }
  };

  const handleCloseDetail = () => {
    setSelectedTermOfPaymentForDetail(null);
  };

  const handleTermOfPaymentAdded = async (formData) => {
    try {
      await createTermOfPayment(formData);
      closeAddModal();
    } catch (error) {
      console.error('Error creating term of payment:', error);
    }
  };


  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-800'>Error: {error}</p>
        <button
          onClick={fetchTermOfPayments}
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
            <h3 className='text-sm font-semibold text-gray-900'>Term of Payment List</h3>
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
                Add Term of Payment
              </button>
            </div>
          </div>

          <TermOfPaymentSearch
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            searchLoading={searchLoading}
          />

          <TermOfPaymentTable
            termOfPayments={termOfPayments}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onDelete={deleteTermOfPaymentConfirmation.showDeleteConfirmation}
            onViewDetail={handleViewDetail}
            selectedTermOfPaymentId={selectedTermOfPaymentForDetail?.id}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <AddTermOfPaymentModal
        show={showAddModal}
        onClose={closeAddModal}
        onTermOfPaymentAdded={handleTermOfPaymentAdded}
        handleAuthError={handleAuthError}
      />

      {/* Term of Payment Detail Card */}
      {selectedTermOfPaymentForDetail && (
        <TermOfPaymentDetailCard
          termOfPayment={selectedTermOfPaymentForDetail}
          onClose={handleCloseDetail}
          updateTermOfPayment={updateTermOfPayment}
          onUpdate={() => {
            fetchTermOfPayments();
            handleViewDetail(selectedTermOfPaymentForDetail);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        show={deleteTermOfPaymentConfirmation.showConfirm}
        onClose={deleteTermOfPaymentConfirmation.hideDeleteConfirmation}
        onConfirm={deleteTermOfPaymentConfirmation.confirmDelete}
        title={deleteTermOfPaymentConfirmation.title}
        message={deleteTermOfPaymentConfirmation.message}
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        loading={deleteTermOfPaymentConfirmation.loading}
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

export default TermOfPayments;
