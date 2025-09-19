import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCustomers from '@/hooks/useCustomersPage';
import { useModal } from '@/hooks/useModal';
import CustomerTable from '@/components/customers/CustomerTable';
import CustomerSearch from '@/components/customers/CustomerSearch';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import ViewCustomerModal from '@/components/customers/ViewCustomerModal';
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleAddCustomer = () => {
    openModal('add');
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    openModal('edit');
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    openModal('view');
  };

  const handleDeleteCustomer = (id) => {
    deleteCustomer(id);
  };

  const handleCustomerAdded = () => {
    closeModal('add');
    fetchCustomers(pagination.currentPage, pagination.itemsPerPage);
  };

  const handleCustomerUpdated = () => {
    closeModal('edit');
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
                onEdit={handleEditCustomer}
                onDelete={handleDeleteCustomer}
                onView={handleViewCustomer}
              />
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      <AddCustomerModal
        show={modalState.add}
        onClose={() => closeModal('add')}
        onCustomerAdded={handleCustomerAdded}
        handleAuthError={handleAuthError}
      />

      <EditCustomerModal
        show={modalState.edit}
        onClose={() => closeModal('edit')}
        customer={selectedCustomer}
        onCustomerUpdated={handleCustomerUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewCustomerModal
        show={modalState.view}
        onClose={() => closeModal('view')}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default Customers;
