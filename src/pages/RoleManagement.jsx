import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const RoleManagement = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [allMenus, setAllMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchRoles();
    fetchMenus();
  }, [navigate]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/v1/roles/', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback data
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/v1/menus/', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch menus');
      const data = await response.json();
      setAllMenus(data);
    } catch (error) {
      console.error('Error fetching menus:', error);
      // Fallback data
    } finally {
      setLoading(false);
    }
  };

  const openMenuModal = (role) => {
    setSelectedRole(role);
    const assignedMenuIds =
      role.menus?.map((m) => (m.menu || m)?.id).filter(Boolean) || [];
    setSelectedMenus(assignedMenuIds);
    setShowMenuModal(true);
  };

  const handleMenuSelection = (menuId) => {
    setSelectedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const getAllMenuIds = (menus) => {
    if (!Array.isArray(menus)) return [];
    let ids = [];
    menus.forEach((menu) => {
      if (menu && menu.id) {
        ids.push(menu.id);
        if (Array.isArray(menu.children) && menu.children.length > 0) {
          ids = [...ids, ...getAllMenuIds(menu.children)];
        }
      }
    });
    return ids;
  };

  const handleSelectAllMenus = () => {
    const allMenuIds = getAllMenuIds(allMenus);
    setSelectedMenus(
      selectedMenus.length === allMenuIds.length ? [] : allMenuIds
    );
  };

  const saveMenuAssignments = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const response = await fetch(
        `http://localhost:5050/api/v1/roles/${selectedRole.id}/menus`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ menuIds: selectedMenus }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update menus');
      }
      await fetchRoles();
      setShowMenuModal(false);
    } catch (error) {
      console.error('Error updating menu assignments:', error);
      alert(error.message || 'Failed to update menu assignments');
    } finally {
      setSaving(false);
    }
  };

  const getAssignedMenuCount = (role) => {
    return role.menus?.filter((item) => (item.menu || item)?.id).length || 0;
  };

  const handleDeleteRole = (role) => {
    setDeletingRoleId(role.id);
    setShowDeleteModal(true);
  };

  const confirmDeleteRole = async () => {
    if (!deletingRoleId) return;
    setSaving(true);
    try {
      const response = await fetch(
        `http://localhost:5050/api/v1/roles/${deletingRoleId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete role');
      }
      await fetchRoles();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting role:', error);
      alert(error.message || 'Failed to delete role');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      alert('Role name is required');
      return;
    }
    setCreating(true);
    try {
      const response = await fetch('http://localhost:5050/api/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDescription.trim(),
          menuIds: [],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create role');
      }
      await fetchRoles();
      setShowCreateModal(false);
      setNewRoleName('');
      setNewRoleDescription('');
    } catch (error) {
      console.error('Error creating role:', error);
      alert(error.message || 'Failed to create role');
    } finally {
      setCreating(false);
    }
  };

  const renderMenuTree = (menus, level = 0) => {
    if (!Array.isArray(menus) || menus.length === 0) return null;
    return menus
      .filter((menu) => menu && menu.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((menu) => (
        <div key={menu.id} style={{ marginLeft: level * 20 }}>
          <label className='flex items-center space-x-2 py-1'>
            <input
              type='checkbox'
              checked={selectedMenus.includes(menu.id)}
              onChange={() => handleMenuSelection(menu.id)}
              className='rounded'
            />
            <span>{menu.name}</span>
          </label>
          {Array.isArray(menu.children) && menu.children.length > 0 && (
            <div className='ml-4'>
              {renderMenuTree(menu.children, level + 1)}
            </div>
          )}
        </div>
      ));
  };

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
        <span className='ml-2'>Loading...</span>
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
            <p className='text-gray-600'>Manage roles and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className='bg-green-600 text-white px-4 py-2 rounded-lg'
          >
            Create New Role
          </button>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto p-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
          {roles.map((role) => (
            <div key={role.id} className='bg-white rounded-xl p-6 shadow'>
              <h3 className='text-lg font-semibold capitalize'>{role.name}</h3>
              <p className='text-sm text-gray-600'>{role.description}</p>
              <div className='my-4'>
                <p className='text-sm font-medium'>Assigned Menus:</p>
                <div className='h-32 overflow-y-auto text-sm'>
                  {role.menus && role.menus.length > 0 ? (
                    <ul>
                      {role.menus.map((item) => (
                        <li key={(item.menu || item).id}>
                          {(item.menu || item).name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No menus assigned</p>
                  )}
                </div>
              </div>
              <div className='flex justify-between items-center'>
                <span>{getAssignedMenuCount(role)} menus</span>
                <div>
                  <button
                    onClick={() => openMenuModal(role)}
                    className='bg-blue-600 text-white px-3 py-1 rounded'
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className='bg-red-600 text-white px-3 py-1 rounded ml-2'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showMenuModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex justify-center items-center'>
          <div className='bg-white rounded-lg p-6 w-1/3'>
            <h3 className='text-lg font-semibold'>
              Manage Menus for {selectedRole?.name}
            </h3>
            <button onClick={handleSelectAllMenus}>Select/Deselect All</button>
            <div className='my-4 h-64 overflow-y-auto'>
              {renderMenuTree(allMenus)}
            </div>
            <button onClick={saveMenuAssignments} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setShowMenuModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex justify-center items-center'>
          <div className='bg-white rounded-lg p-6 w-1/3'>
            <h3 className='text-lg font-semibold'>Create New Role</h3>
            <input
              type='text'
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder='Role Name'
            />
            <textarea
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              placeholder='Description'
            />
            <button onClick={handleCreateRole} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className='fixed inset-c0 bg-black/50 z-50 flex justify-center items-center'>
          <div className='bg-white rounded-lg p-6'>
            <h3 className='text-lg font-semibold'>Confirm Deletion</h3>
            <p>Are you sure you want to delete this role?</p>
            <button onClick={confirmDeleteRole} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};

export default RoleManagement;
