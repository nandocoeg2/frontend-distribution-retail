import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar.jsx';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [menus, setMenus] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Load user data and menus from localStorage
    const user = authService.getUserData();
    const userMenus = authService.getMenus();

    setUserData(user);
    setMenus(userMenus);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even if logout API fails
      navigate('/login');
    }
  };

  if (!userData) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        menus={menus}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Top Header */}
        <header className='bg-white shadow-sm border-b border-gray-200 p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-semibold text-gray-900'>
                Dashboard
              </h1>
              <p className='text-sm text-gray-600'>
                Welcome back, {userData.firstName}!
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                  <span className='text-white text-sm font-medium'>
                    {userData.firstName?.charAt(0)}
                    {userData.lastName?.charAt(0)}
                  </span>
                </div>
                <div className='hidden md:block'>
                  <p className='text-sm font-medium text-gray-900'>
                    {userData.firstName} {userData.lastName}
                  </p>
                  <p className='text-xs text-gray-600'>{userData.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-7xl mx-auto'>
            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center'>
                      <svg
                        className='w-5 h-5 text-blue-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                        />
                      </svg>
                    </div>
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Total Users
                    </p>
                    <p className='text-2xl font-semibold text-gray-900'>
                      1,234
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-8 h-8 bg-green-100 rounded-md flex items-center justify-center'>
                      <svg
                        className='w-5 h-5 text-green-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                        />
                      </svg>
                    </div>
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>Revenue</p>
                    <p className='text-2xl font-semibold text-gray-900'>
                      $12,345
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center'>
                      <svg
                        className='w-5 h-5 text-yellow-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                    </div>
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Pending Tasks
                    </p>
                    <p className='text-2xl font-semibold text-gray-900'>23</p>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center'>
                      <svg
                        className='w-5 h-5 text-purple-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 10V3L4 14h7v7l9-11h-7z'
                        />
                      </svg>
                    </div>
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Performance
                    </p>
                    <p className='text-2xl font-semibold text-gray-900'>98%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info Panel */}
            <div className='bg-white rounded-lg shadow mb-8'>
              <div className='px-6 py-4 border-b border-gray-200'>
                <h3 className='text-lg font-medium text-gray-900'>
                  User Information
                </h3>
              </div>
              <div className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Full Name
                    </label>
                    <p className='text-sm text-gray-900'>
                      {userData.firstName} {userData.lastName}
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email
                    </label>
                    <p className='text-sm text-gray-900'>{userData.email}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Username
                    </label>
                    <p className='text-sm text-gray-900'>{userData.username}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Role
                    </label>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                      {userData.role?.name}
                    </span>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userData.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {userData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Member Since
                    </label>
                    <p className='text-sm text-gray-900'>
                      {new Date(userData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Menus */}
            <div className='bg-white rounded-lg shadow'>
              <div className='px-6 py-4 border-b border-gray-200'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Available Menus
                </h3>
              </div>
              <div className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {menus.map((menu) => (
                    <div
                      key={menu.id}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-center mb-2'>
                        <div className='w-6 h-6 bg-blue-100 rounded flex items-center justify-center mr-3'>
                          <svg
                            className='w-4 h-4 text-blue-600'
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
                        </div>
                        <h4 className='text-sm font-medium text-gray-900'>
                          {menu.name}
                        </h4>
                      </div>
                      {menu.children && menu.children.length > 0 && (
                        <div className='ml-9'>
                          <ul className='space-y-1'>
                            {menu.children.map((child) => (
                              <li
                                key={child.id}
                                className='text-xs text-gray-600'
                              >
                                • {child.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
