import React, { useState } from 'react';
import useUsers from '@/hooks/useUsersPage';
import UserTable from '@/components/users/UserTable';
import UserSearch from '@/components/users/UserSearch';
import AddUserModal from '@/components/users/AddUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import ViewUserModal from '@/components/users/ViewUserModal';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Users = () => {
  const {
    users,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteUser,
    fetchUsers,
    handleAuthError
  } = useUsers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setEditingUser(null);
    setShowEditModal(false);
  };

  const openViewModal = (user) => {
    setViewingUser(user);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setViewingUser(null);
    setShowViewModal(false);
  };

  const handleUserAdded = () => {
    closeAddModal();
    fetchUsers(1, pagination.itemsPerPage); // Refetch from the first page
  };

  const handleUserUpdated = () => {
    closeEditModal();
    fetchUsers(pagination.currentPage, pagination.itemsPerPage); // Refetch the current page
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
          onClick={() => fetchUsers()}
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
            <h3 className='text-lg font-medium text-gray-900'>User List</h3>
            <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add User
            </button>
          </div>

          <UserSearch 
            searchQuery={searchQuery} 
            handleSearchChange={handleSearchChange} 
            searchLoading={searchLoading} 
          />

          <UserTable 
            users={users} 
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal} 
            onDelete={deleteUser} 
            onView={openViewModal}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <AddUserModal 
        show={showAddModal} 
        onClose={closeAddModal} 
        onUserAdded={handleUserAdded}
        handleAuthError={handleAuthError}
      />

      <EditUserModal 
        show={showEditModal} 
        onClose={closeEditModal} 
        user={editingUser}
        onUserUpdated={handleUserUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewUserModal 
        show={showViewModal} 
        onClose={closeViewModal} 
        user={viewingUser} 
      />
    </div>
  );
};

export default Users;