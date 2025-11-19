import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCustomers from '@/hooks/useCustomersPage';
import { useModal } from '@/hooks/useModal';
import CustomerTable from '@/components/customers/CustomerTable';
import CustomerSearch from '@/components/customers/CustomerSearch';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import CustomerDetailCardEditable from '@/components/customers/CustomerDetailCardEditable';
import { PlusIcon } from '@heroicons/react/24/outline';
import Pagination from '@/components/common/Pagination';
import Loading from '@/components/ui/Loading';

const Customers = () => {
  const {
    customers,
    pagination,
    loading,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    deleteCustomer,
    fetchCustomers,
    handleAuthError
  } = useCustomers();

  const { modalState, openModal, closeModal } = useModal();
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState(null);

  const handleAddCustomer = () => {
    openModal('add');
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
              <p className="text-sm text-gray-600">Manage your customer data</p>
            </div>
            <button
              onClick={handleAddCustomer}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Customer
            </button>
          </div>

          <CustomerSearch
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            isLoading={searchLoading}
          />

          {loading ? (
            <Loading />
          ) : (
            <>
              <CustomerTable
                customers={customers}
                pagination={pagination}
                onPageChange={handlePageChange}
                onDelete={deleteCustomer}
                onViewDetail={handleViewDetail}
                selectedCustomerId={selectedCustomerForDetail?.id}
                searchQuery={searchQuery}
              />
            </>
          )}
        </div>
      </div>

      {/* Customer Detail Card */}
      {selectedCustomerForDetail && (
        <div className="max-w-7xl mx-auto px-6">
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
    </div>
  );
};

export default Customers;
