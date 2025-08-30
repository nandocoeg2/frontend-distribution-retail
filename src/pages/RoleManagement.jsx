import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar.jsx';

const HeroIcon = ({ name, className = 'w-5 h-5' }) => {
  const icons = {
    shield: (
      <svg
        className={className}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
        />
      </svg>
    ),
    plus: (
      <svg
        className={className}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 4v16m8-8H4'
        />
      </svg>
    ),
    trash: (
      <svg
        className={className}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
        />
      </svg>
    ),
    pencil: (
      <svg
        className={className}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
        />
      </svg>
    ),
    x: (
      <svg
        className={className}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M6 18L18 6M6 6l12 12'
        />
      </svg>
    ),
    warning: (
      <svg
        className={className}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.732 16.5c-.77.833.192 2.5 1.732 2.5z'
        />
      </svg>
    ),
    menu: (
      <svg
        className={className}
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M4 6h16M4 12h16M4 18h16'
        />
      </svg>
    ),
  };
  return icons[name] || null;
};

const RoleManagement = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);
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

    const userMenus = authService.getMenus();
    setMenus(userMenus);
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
      setRoles([
        {
          id: 'cmeef187l0000ydcq6pejypov',
          name: 'super admin',
          description: 'Super Administrator',
          menus: [
            {
              menu: {
                id: '1',
                name: 'Dashboard',
                url: '/dashboard',
                icon: 'home',
              },
            },
            {
              menu: { id: '2', name: 'Profile', url: '/profile', icon: 'user' },
            },
          ],
        },
      ]);
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
      setAllMenus([
        {
          id: '1',
          name: 'Dashboard',
          url: '/dashboard',
          icon: null,
          order: 1,
          parentId: null,
          children: [],
        },
        {
          id: '2',
          name: 'Profile',
          url: '/profile',
          icon: null,
          order: 2,
          parentId: null,
          children: [
            {
              id: '3',
              name: 'Setting Profile',
              url: '/profile/settings-profile',
              icon: null,
              order: 1,
              parentId: '2',
              children: [],
            },
          ],
        },
        {
          id: '4',
          name: 'Purchase Order Management',
          url: '#',
          icon: null,
          order: 3,
          parentId: null,
          children: [
            {
              id: '5',
              name: 'Customers',
              url: '/purchase-order/customers',
              icon: null,
              order: 1,
              parentId: '4',
              children: [],
            },
            {
              id: '6',
              name: 'Purchase Orders',
              url: '/purchase-order/purchase-orders',
              icon: null,
              order: 2,
              parentId: '4',
              children: [],
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const openMenuModal = (role) => {
    setSelectedRole(role);
    const assignedMenuIds =
      role.menus
        ?.filter((m) => {
          const menu = m.menu || m;
          return menu && menu.id;
        })
        .map((m) => {
          const menu = m.menu || m;
          return menu.id;
        }) || [];
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

  const handleSelectAllMenus = () => {
    const allMenuIds = getAllMenuIds(allMenus);
    setSelectedMenus(
      selectedMenus.length === allMenuIds.length ? [] : allMenuIds
    );
  };

  const getAllMenuIds = (menus) => {
    if (!Array.isArray(menus)) return [];

    let ids = [];
    menus.forEach((menu) => {
      if (menu && menu.id) {
        ids.push(menu.id);
        if (
          menu.children &&
          Array.isArray(menu.children) &&
          menu.children.length > 0
        ) {
          ids = [
            ...ids,
            ...getAllMenuIds(menu.children.filter((c) => c && c.id)),
          ];
        }
      }
    });
    return ids;
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
          body: JSON.stringify({
            menuIds: selectedMenus,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update menus');
      }

      await fetchRoles();
      setShowMenuModal(false);
      setSelectedRole(null);
      setSelectedMenus([]);
    } catch (error) {
      console.error('Error updating menu assignments:', error);
      alert(error.message || 'Failed to update menu assignments');
    } finally {
      setSaving(false);
    }
  };

  const getAssignedMenuCount = (role) => {
    return (
      role.menus?.filter((item) => {
        const menu = item.menu || item;
        return menu && menu.id;
      }).length || 0
    );
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
      setDeletingRoleId(null);
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
          menuIds: ['cmeef18710005ydcq4dsy8k12'],
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

    const rootMenus =
      level === 0 ? menus.filter((menu) => menu && !menu.parentId) : menus;

    return rootMenus
      .filter((menu) => menu && menu.id)
      .sort(
        (a, b) =>
          (a?.order || 0) - (b?.order || 0) ||
          String(a?.name || '').localeCompare(String(b?.name || ''))
      )
      .map((menu) => {
        if (!menu || !menu.id) return null;

        const children = menu.children || [];

        return (
          <div key={menu.id} style={{ marginLeft: level * 16 }}>
            <label className='flex items-center space-x-2 py-1'>
              <input
                type='checkbox'
                checked={selectedMenus.includes(menu.id)}
                onChange={() => handleMenuSelection(menu.id)}
                className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4'
              />
              <span className='text-sm text-gray-700'>{menu.name}</span>
              <span className='text-xs text-gray-500 ml-2'>
                {menu?.url &&
                menu.url !== '#' &&
                String(menu.url || '').startsWith('/')
                  ? `(${menu.url})`
                  : ''}
              </span>
            </label>
            {Array.isArray(children) &&
              children.length > 0 &&
              children.filter((c) => c && c.id).length > 0 && (
                <div className='ml-6'>
                  {renderMenuTree(
                    children.filter((c) => c && c.id),
                    level + 1
                  )}
                </div>
              )}
          </div>
        );
      })
      .filter(Boolean);
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
        <span className='ml-2'>Loading roles...</span>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-50 to-gray-100'>
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        menus={menus}
        onLogout={handleLogout}
      />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <header className='bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2'>
                <HeroIcon name='shield' className='w-8 h-8 text-blue-600' />
                Role Management
              </h1>
              <p className='text-gray-600'>
                Manage roles and their menu access permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2'
            >
              <HeroIcon name='plus' className='w-5 h-5' />
              Create New Role
            </button>
          </div>{' '}
        </header>

        <main className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-7xl mx-auto'>
            <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden'>
              <div className='p-6'>
                <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className='bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col h-96'
                    >
                      <div className='flex items-start justify-between mb-4 flex-shrink-0'>
                        <div>
                          <h3 className='text-lg font-semibold text-gray-900 capitalize'>
                            {role.name}
                          </h3>
                          <p className='text-sm text-gray-600 mt-1'>
                            {role.description}
                          </p>
                        </div>
                      </div>

                      <div className='mb-4 flex-1 min-h-0'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>
                          Assigned Menus:
                        </p>
                        <div className='h-48 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50/50 text-sm'>
                          {role.menus && role.menus.length > 0 ? (
                            <div className='space-y-1'>
                              {role.menus
                                .filter((item) => {
                                  // Handle both formats: direct menu or nested in 'menu' property
                                  const menu = item.menu || item;
                                  return menu && menu.id;
                                })
                                .sort((a, b) => {
                                  const menuA = a.menu || a;
                                  const menuB = b.menu || b;
                                  return (menuA?.name || '').localeCompare(
                                    menuB?.name || ''
                                  );
                                })
                                .map((item) => {
                                  const menu = item.menu || item;
                                  return (
                                    <div key={menu.id}>
                                      <div className='font-medium text-gray-800 leading-relaxed py-1'>
                                        {menu.name || 'Unnamed Menu'}
                                        {menu.url &&
                                          menu.url !== '#' &&
                                          String(menu.url).startsWith('/') && (
                                            <span className='text-gray-500 ml-1 text-xs'>
                                              ({menu.url})
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <span className='text-xs text-gray-500 italic'>
                              No menus assigned
                            </span>
                          )}
                        </div>
                      </div>

                      <div className='flex items-center justify-between pt-4 border-t border-gray-200 flex-shrink-0'>
                        <div>
                          <p className='text-sm text-gray-600'>
                            <span className='font-medium text-gray-900'>
                              {getAssignedMenuCount(role)}
                            </span>{' '}
                            menus
                          </p>
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => openMenuModal(role)}
                            className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors'
                          >
                            Manage Menus
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors'
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Menu Assignment Modal */}
        {showMenuModal && selectedRole && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Manage Menus for {selectedRole.name}
                  </h3>
                  <button
                    onClick={() => setShowMenuModal(false)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <HeroIcon name='x' className='w-6 h-6' />
                  </button>
                </div>
              </div>

              <div className='p-6 overflow-y-auto max-h-[60vh]'>
                <div className='mb-4'>
                  <button
                    onClick={handleSelectAllMenus}
                    className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                  >
                    {selectedMenus.length === getAllMenuIds(allMenus).length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
                {renderMenuTree(allMenus)}
              </div>
              <div className='p-6 border-t border-gray-200 flex items-center justify-end space-x-3'>
                <button
                  onClick={() => setShowMenuModal(false)}
                  className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={saveMenuAssignments}
                  disabled={saving}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors'
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Role Modal */}
        {showCreateModal && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl max-w-md w-full'>
              <div className='p-6 border-b border-gray-200'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Create New Role
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <HeroIcon name='x' className='w-6 h-6' />
                  </button>
                </div>
              </div>

              <div className='p-6'>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Role Name *
                    </label>
                    <input
                      type='text'
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder='Enter role name'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Description
                    </label>
                    <textarea
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      placeholder='Enter role description (optional)'
                      rows={3}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
                      maxLength={200}
                    />
                  </div>
                </div>
              </div>

              <div className='p-6 border-t border-gray-200 flex items-center justify-end space-x-3'>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  disabled={creating || !newRoleName.trim()}
                  className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  {creating ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl max-w-md w-full'>
              <div className='p-6 border-b border-gray-200'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Delete Role
                </h3>
              </div>

              <div className='p-6'>
                <p className='text-gray-700 mb-4'>
                  Are you sure you want to delete this role? This action cannot
                  be undone and will remove all menu assignments for this role.
                </p>
                <p className='text-sm text-gray-600'>
                  Type <strong>DELETE</strong> to confirm deletion.
                </p>
                <input
                  type='text'
                  placeholder='Type DELETE to confirm'
                  className='mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value === 'DELETE') {
                      confirmDeleteRole();
                    }
                  }}
                />
              </div>

              <div className='p-6 border-t border-gray-200 flex items-center justify-end space-x-3'>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingRoleId(null);
                  }}
                  className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteRole}
                  disabled={saving}
                  className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  {saving ? 'Deleting...' : 'Delete Role'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
