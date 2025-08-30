import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar.jsx';

const RoleManagement = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);
  const [activeTab, setActiveTab] = useState('roles');
  const [showAddModal, setShowAddModal] = useState(false);
  const [roles] = useState([
    {
      id: 1,
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      permissions: ['read', 'write', 'delete', 'admin'],
      userCount: 2,
      status: 'active',
      createdAt: '2024-01-01',
    },
    {
      id: 2,
      name: 'Admin',
      description: 'Administrative access to most features',
      permissions: ['read', 'write', 'delete'],
      userCount: 5,
      status: 'active',
      createdAt: '2024-01-02',
    },
    {
      id: 3,
      name: 'Manager',
      description: 'Management level access with limited admin functions',
      permissions: ['read', 'write'],
      userCount: 12,
      status: 'active',
      createdAt: '2024-01-03',
    },
    {
      id: 4,
      name: 'User',
      description: 'Basic user access to standard features',
      permissions: ['read'],
      userCount: 45,
      status: 'active',
      createdAt: '2024-01-04',
    },
    {
      id: 5,
      name: 'Guest',
      description: 'Limited read-only access for temporary users',
      permissions: ['read'],
      userCount: 8,
      status: 'inactive',
      createdAt: '2024-01-05',
    },
  ]);

  const [permissions] = useState([
    { id: 'read', name: 'Read', description: 'View data and content' },
    { id: 'write', name: 'Write', description: 'Create and modify content' },
    { id: 'delete', name: 'Delete', description: 'Remove data and content' },
    { id: 'admin', name: 'Admin', description: 'Administrative functions' },
    {
      id: 'user_management',
      name: 'User Management',
      description: 'Manage user accounts',
    },
    {
      id: 'role_management',
      name: 'Role Management',
      description: 'Manage roles and permissions',
    },
    {
      id: 'system_settings',
      name: 'System Settings',
      description: 'Configure system settings',
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Generate and view reports',
    },
  ]);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Load menus
    const userMenus = authService.getMenus();
    setMenus(userMenus);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const tabs = [
    { id: 'roles', name: 'Roles', icon: '👥', count: roles.length },
    {
      id: 'permissions',
      name: 'Permissions',
      icon: '🔐',
      count: permissions.length,
    },
  ];

  const getStatusBadge = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getPermissionBadge = (permission) => {
    const colors = {
      read: 'bg-blue-100 text-blue-800',
      write: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      admin: 'bg-purple-100 text-purple-800',
    };
    return colors[permission] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-50 to-gray-100'>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        menus={menus}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <header className='bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-1'>
                Role Management 🔐
              </h1>
              <p className='text-gray-600'>
                Manage system roles, permissions, and access controls
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              <span>Add New Role</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-7xl mx-auto'>
            <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden'>
              {/* Tabs */}
              <div className='border-b border-gray-200 bg-gray-50/80'>
                <div className='flex space-x-8 px-6'>
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.name}</span>
                      <span className='bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full'>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Roles Tab Content */}
              {activeTab === 'roles' && (
                <div className='p-6'>
                  <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className='bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow'
                      >
                        <div className='flex items-start justify-between mb-4'>
                          <div>
                            <h3 className='text-lg font-semibold text-gray-900'>
                              {role.name}
                            </h3>
                            <p className='text-sm text-gray-600 mt-1'>
                              {role.description}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(role.status)}`}
                          >
                            {role.status}
                          </span>
                        </div>

                        <div className='mb-4'>
                          <p className='text-sm font-medium text-gray-700 mb-2'>
                            Permissions:
                          </p>
                          <div className='flex flex-wrap gap-2'>
                            {role.permissions.map((permission) => (
                              <span
                                key={permission}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPermissionBadge(permission)}`}
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                          <div>
                            <p className='text-sm text-gray-600'>
                              <span className='font-medium text-gray-900'>
                                {role.userCount}
                              </span>{' '}
                              users
                            </p>
                            <p className='text-xs text-gray-500'>
                              Created:{' '}
                              {new Date(role.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className='flex space-x-2'>
                            <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                              Edit
                            </button>
                            <button className='text-red-600 hover:text-red-700 text-sm font-medium'>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions Tab Content */}
              {activeTab === 'permissions' && (
                <div className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className='bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow'
                      >
                        <div className='flex items-start space-x-4'>
                          <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center'>
                            <span className='text-white text-lg'>🔑</span>
                          </div>
                          <div className='flex-1'>
                            <h3 className='text-lg font-semibold text-gray-900'>
                              {permission.name}
                            </h3>
                            <p className='text-sm text-gray-600 mt-1'>
                              {permission.description}
                            </p>
                            <div className='mt-3'>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPermissionBadge(permission.id)}`}
                              >
                                {permission.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Role Modal (Placeholder) */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-6 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Add New Role
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <svg
                  className='w-6 h-6'
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
              </button>
            </div>
            <p className='text-gray-600 mb-6'>
              Feature under development. Add role functionality will be
              implemented soon.
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className='w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
