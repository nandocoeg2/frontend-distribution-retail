import React from 'react';
import { useAuth } from '../hooks/useAuth';
import useRoleManagement from '../hooks/useRoleManagement';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const RoleManagement = () => {
  const { isAuthenticated } = useAuth();
  const {
    roles,
    allMenus,
    loading,
    error,
    selectedRole,
    selectedMenus,
    saving,
    creating,
    showMenuModal,
    showCreateModal,
    showDeleteModal,
    deletingRoleId,
    newRoleName,
    newRoleDescription,
    newRoleMenus,
    setNewRoleName,
    setNewRoleDescription,
    setNewRoleMenus,
    setShowCreateModal,
    setShowMenuModal,
    setShowDeleteModal,
    openMenuModal,
    handleMenuSelection,
    saveMenuAssignments,
    handleCreateRole,
    handleDeleteRole,
    confirmDeleteRole,
    getAssignedMenuCount,
    handleAuthError
  } = useRoleManagement();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null; // Will be handled by ProtectedRoute or redirect
  }


  const renderMenuTree = (menus, selected, onSelect, level = 0) => {
    if (!Array.isArray(menus) || menus.length === 0) return null;
    return menus
      .filter((menu) => menu && menu.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((menu) => (
        <div key={menu.id} className={`${level > 0 ? 'ml-6' : ''}`}>
          <label className='flex items-center space-x-2 py-2 hover:bg-gray-50 rounded px-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={selected.includes(menu.id)}
              onChange={() => onSelect(menu.id)}
              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <span className='text-sm text-gray-700'>{menu.name}</span>
          </label>
          {Array.isArray(menu.children) && menu.children.length > 0 && (
            <div className='ml-2'>
              {renderMenuTree(menu.children, selected, onSelect, level + 1)}
            </div>
          )}
        </div>
      ));
  };

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
        <span className='ml-2'>Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-600 text-lg font-semibold mb-2'>An Error Occurred</div>
          <div className='text-gray-600 mb-4'>{error}</div>
          <button
            onClick={() => window.location.reload()}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className='bg-white/80 backdrop-blur-sm shadow-sm p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
              <HeroIcon name='shield' className='w-8 h-8 text-blue-600' />
              Role Management
            </h1>
            <p className='text-gray-600'>Manage user roles and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'
          >
            Create New Role
          </button>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto p-6'>
        {roles.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 text-center'>
            <HeroIcon name='shield' className='w-16 h-16 text-gray-400 mb-4' />
            <h3 className='text-lg font-semibold text-gray-600 mb-2'>No Roles Found</h3>
            <p className='text-gray-500 mb-4'>Start by creating your first role</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
            >
              Create First Role
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
            {roles.map((role) => (
            <div key={role.id} className='bg-white rounded-xl p-6 shadow'>
              <h3 className='text-lg font-semibold capitalize'>{role.name}</h3>
              <p className='text-sm text-gray-600'>{role.description}</p>
              <div className='my-4'>
                <p className='text-sm font-medium'>Assigned Menus:</p>
                <div className='h-32 overflow-y-auto text-sm'>
                  {role.menus && role.menus.length > 0 ? (
                    <ul className='space-y-1'>
                      {role.menus.map((item) => (
                        <li key={(item.menu || item).id} className='text-gray-700'>
                          • {(item.menu || item).name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-gray-500 italic'>No menus assigned</p>
                  )}
                </div>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>{getAssignedMenuCount(role)} menus</span>
                <div className='flex gap-2'>
                  <button
                    onClick={() => openMenuModal(role)}
                    className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors'
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className='bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </main>

      {showMenuModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto'>
            <h3 className='text-lg font-semibold mb-4'>
              Manage Menus for {selectedRole?.name}
            </h3>
            <div className='my-4 h-64 overflow-y-auto border rounded-md p-3'>
              {renderMenuTree(allMenus, selectedMenus, handleMenuSelection)}
            </div>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setShowMenuModal(false)}
                className='bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={saveMenuAssignments}
                disabled={saving}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto'>
            <h3 className='text-lg font-semibold mb-4'>Create New Role</h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Role Name *
                </label>
                <input
                  type='text'
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder='Enter role name'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Description
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder='Enter role description (optional)'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  rows={3}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Assign Menus *
                </label>
                <div className='h-48 overflow-y-auto border rounded-md p-3'>
                  {renderMenuTree(allMenus, newRoleMenus, (menuId) => {
                    setNewRoleMenus((prev) =>
                      prev.includes(menuId)
                        ? prev.filter((id) => id !== menuId)
                        : [...prev, menuId]
                    );
                  })}
                </div>
              </div>
            </div>
            <div className='flex justify-end gap-2 mt-6'>
              <button
                onClick={() => setShowCreateModal(false)}
                className='bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={creating}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {creating ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-semibold mb-4'>Confirm Deletion</h3>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to delete this role? This action cannot be undone.
            </p>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRole}
                disabled={saving}
                className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoleManagement;
