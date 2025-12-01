import React, { useState } from 'react';
import useTermOfPayments from '@/hooks/useTermOfPayments';
import TermOfPaymentTable from '@/components/termOfPayments/TermOfPaymentTable';
import TermOfPaymentSearch from '@/components/termOfPayments/TermOfPaymentSearch';
import AddTermOfPaymentModal from '@/components/termOfPayments/AddTermOfPaymentModal';
import TermOfPaymentDetailCard from '@/components/termOfPayments/TermOfPaymentDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
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

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const handleExportExcel = async () => {
    try {
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
    <div className='p-6'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mb-4 flex justify-between items-center'>
            <h3 className='text-lg font-medium text-gray-900'>Term of Payment List</h3>
            <div className='flex gap-2'>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className='inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {exportLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <HeroIcon name='arrow-down-tray' className='w-5 h-5 mr-2' />
                    Export Excel
                  </>
                )}
              </button>
              <button
                onClick={openAddModal}
                className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
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
    </div>
  );
};

export default TermOfPayments;
