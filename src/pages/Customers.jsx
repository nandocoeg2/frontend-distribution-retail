import React, { useState } from 'react';
import {
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import useCustomers from '@/hooks/useCustomersPage';
import CustomerTable from '@/components/customers/CustomerTable';
import CustomerSearch from '@/components/customers/CustomerSearch';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import ViewCustomerModal from '@/components/customers/ViewCustomerModal';

const Customers = () => {
  const {
    customers,
    setCustomers,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteCustomer,
    fetchCustomers,
    handleAuthError
  } = useCustomers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setEditingCustomer(null);
    setShowEditModal(false);
  };

  const openViewModal = (customer) => {
    setViewingCustomer(customer);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setViewingCustomer(null);
    setShowViewModal(false);
  };

  const handleCustomerAdded = (newCustomer) => {
    setCustomers([...customers, newCustomer]);
    closeAddModal();
  };

  const handleCustomerUpdated = (updatedCustomer) => {
    setCustomers(
      customers.map((customer) =>
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );
    closeEditModal();
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
          onClick={fetchCustomers}
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
            <h3 className='text-lg font-medium text-gray-900'>Customer List</h3>
            <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <UserPlusIcon className='h-5 w-5 mr-2' />
              Add Customer
            </button>
          </div>

          <CustomerSearch 
            searchQuery={searchQuery} 
            handleSearchChange={handleSearchChange} 
            searchLoading={searchLoading} 
          />

          <CustomerTable 
            customers={customers} 
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal} 
            onDelete={deleteCustomer} 
            onView={openViewModal}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <AddCustomerModal 
        show={showAddModal} 
        onClose={closeAddModal} 
        onCustomerAdded={handleCustomerAdded}
        handleAuthError={handleAuthError}
      />

      <EditCustomerModal 
        show={showEditModal} 
        onClose={closeEditModal} 
        customer={editingCustomer}
        onCustomerUpdated={handleCustomerUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewCustomerModal 
        show={showViewModal} 
        onClose={closeViewModal} 
        customer={viewingCustomer} 
      />
    </div>
  );
};

export default Customers;
