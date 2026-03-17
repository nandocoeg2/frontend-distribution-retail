import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCustomers from '@/hooks/useCustomersPage';
import { useModal } from '@/hooks/useModal';
import CustomerTable from '@/components/customers/CustomerTable';
import CustomerSearch from '@/components/customers/CustomerSearch';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import CustomerDetailCardEditable from '@/components/customers/CustomerDetailCardEditable';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Pagination from '@/components/common/Pagination';
import Loading from '@/components/ui/Loading';
import customerService from '../services/customerService';
import toastService from '../services/toastService';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

const Customers = () => {
  const {
    customers,
    pagination,
    loading,
    searchQuery,
    activeSearchQuery,
    searchLoading,
    handleSearchChange,
    handleSearchSubmit,
    handlePageChange,
    handleLimitChange,
    deleteCustomer,
    fetchCustomers,
    handleAuthError
  } = useCustomers();

  const { modalState, openModal, closeModal } = useModal();
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);

  const handleAddCustomer = () => {
    openModal('add');
  };

  const confirmExportExcel = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);
      await customerService.exportExcel(activeSearchQuery);
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

  const handleViewDetail = (customer) => {
    setSelectedCustomerForDetail(customer);
  };

  const handleCloseDetail = () => {
    setSelectedCustomerForDetail(null);
  };

  const handleCustomerAdded = () => {
    closeModal('add');
    fetchCustomers(pagination.currentPage, pagination.itemsPerPage);
  };


  return (
    <div>
      <div className="max-w-full mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-3 py-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Customers</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                    Export Excel
                  </>
                )}
              </button>
              <button
                onClick={handleAddCustomer}
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Add Customer
              </button>
            </div>
          </div>

          <CustomerSearch
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            handleSearchSubmit={handleSearchSubmit}
            searchLoading={searchLoading}
          />

            {loading ? (
              <Loading />
            ) : (
              <CustomerTable
                customers={customers}
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onDelete={deleteCustomer}
                onViewDetail={handleViewDetail}
                selectedCustomerId={selectedCustomerForDetail?.id}
                searchQuery={activeSearchQuery}
              />
            )}
          </div>
        </div>
      </div>

      {/* Customer Detail Card */}
      {selectedCustomerForDetail && (
        <div className="max-w-full mx-auto px-3 mt-3">
          <CustomerDetailCardEditable
            customer={selectedCustomerForDetail}
            onClose={handleCloseDetail}
            onUpdate={() => {
              fetchCustomers(pagination.currentPage, pagination.itemsPerPage);
              handleViewDetail(selectedCustomerForDetail);
            }}
          />
        </div>
      )}

      {modalState.add && (
        <AddCustomerModal
          onClose={() => closeModal('add')}
          onCustomerAdded={handleCustomerAdded}
        />
      )}

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

export default Customers;
