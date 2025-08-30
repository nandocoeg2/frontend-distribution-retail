import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar.jsx';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [menus, setMenus] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6'></div>
          <p className='text-gray-600 text-lg'>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'reports', name: 'Reports', icon: '📋' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  const quickActions = [
    {
      name: 'Create Report',
      icon: '➕',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    {
      name: 'Export Data',
      icon: '📤',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
    },
    {
      name: 'View Analytics',
      icon: '🔍',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    },
    {
      name: 'Manage Users',
      icon: '👥',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
    },
  ];

  const recentActivities = [
    {
      action: 'Generated monthly report',
      time: '2 minutes ago',
      icon: '📄',
      color: 'text-blue-500',
    },
    {
      action: 'Updated user permissions',
      time: '15 minutes ago',
      icon: '🔒',
      color: 'text-green-500',
    },
    {
      action: 'Exported analytics data',
      time: '1 hour ago',
      icon: '📊',
      color: 'text-purple-500',
    },
    {
      action: 'Created backup',
      time: '3 hours ago',
      icon: '💾',
      color: 'text-orange-500',
    },
  ];

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
        {/* Top Header */}
        <header className='bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-1'>
                Good morning, {userData.firstName}! 👋
              </h1>
              <p className='text-gray-600'>
                Here's what's happening with your workspace today
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              {/* Notification Bell */}
              <button className='relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors'>
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
                    d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                  />
                </svg>
                <span className='absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500'></span>
              </button>

              {/* Profile */}
              <div className='flex items-center space-x-3 bg-white rounded-full p-2 pr-4 shadow-md border border-gray-100'>
                <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center'>
                  <span className='text-white text-sm font-bold'>
                    {userData.firstName?.charAt(0)}
                    {userData.lastName?.charAt(0)}
                  </span>
                </div>
                <div className='hidden md:block'>
                  <p className='text-sm font-semibold text-gray-900'>
                    {userData.firstName} {userData.lastName}
                  </p>
                  <p className='text-xs text-gray-500'>{userData.role?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Tabs */}
        <div className='bg-white/60 backdrop-blur-sm border-b border-gray-200/60 px-6'>
          <div className='flex space-x-8'>
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
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <main className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-7xl mx-auto space-y-8'>
            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-2'>
                      Total Users
                    </p>
                    <p className='text-3xl font-bold text-gray-900'>1,234</p>
                    <p className='text-xs text-green-600 font-medium mt-1'>
                      ↗ +12.5% from last month
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center'>
                    <span className='text-2xl'>👥</span>
                  </div>
                </div>
              </div>

              <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-2'>
                      Revenue
                    </p>
                    <p className='text-3xl font-bold text-gray-900'>$42.5K</p>
                    <p className='text-xs text-green-600 font-medium mt-1'>
                      ↗ +8.2% from last month
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
                    <span className='text-2xl'>💰</span>
                  </div>
                </div>
              </div>

              <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-2'>
                      Active Sessions
                    </p>
                    <p className='text-3xl font-bold text-gray-900'>847</p>
                    <p className='text-xs text-orange-600 font-medium mt-1'>
                      ↘ -2.1% from last hour
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center'>
                    <span className='text-2xl'>⚡</span>
                  </div>
                </div>
              </div>

              <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-2'>
                      Performance
                    </p>
                    <p className='text-3xl font-bold text-gray-900'>98.2%</p>
                    <p className='text-xs text-green-600 font-medium mt-1'>
                      ↗ +0.8% uptime
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center'>
                    <span className='text-2xl'>📊</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              {/* Quick Actions */}
              <div className='lg:col-span-1'>
                <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-6'>
                    Quick Actions
                  </h3>
                  <div className='space-y-3'>
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        className={`w-full ${action.color} text-white rounded-xl p-4 flex items-center space-x-3 hover:shadow-md transition-all hover:scale-105`}
                      >
                        <span className='text-2xl'>{action.icon}</span>
                        <span className='font-medium'>{action.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6 mt-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-6'>
                    Recent Activity
                  </h3>
                  <div className='space-y-4'>
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className='flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors'
                      >
                        <div className={`text-xl ${activity.color}`}>
                          {activity.icon}
                        </div>
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-gray-900'>
                            {activity.action}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Profile & Menu Info */}
              <div className='lg:col-span-2 space-y-8'>
                {/* User Profile Card */}
                <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Profile Information
                    </h3>
                    <button className='text-blue-600 hover:text-blue-700 font-medium text-sm'>
                      Edit
                    </button>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                          Full Name
                        </label>
                        <p className='text-gray-900 font-medium'>
                          {userData.firstName} {userData.lastName}
                        </p>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                          Username
                        </label>
                        <p className='text-gray-900 font-medium'>
                          {userData.username}
                        </p>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                          Status
                        </label>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            userData.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          ● {userData.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className='space-y-4'>
                      <div>
                        <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                          Email Address
                        </label>
                        <p className='text-gray-900 font-medium'>
                          {userData.email}
                        </p>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                          Role
                        </label>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                          {userData.role?.name}
                        </span>
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                          Member Since
                        </label>
                        <p className='text-gray-900 font-medium'>
                          {new Date(userData.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Features */}
                <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Available Features
                    </h3>
                    <span className='text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-full'>
                      {menus.length} features
                    </span>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {menus.map((menu) => (
                      <div
                        key={menu.id}
                        className='p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all group cursor-pointer'
                      >
                        <div className='flex items-start space-x-3'>
                          <div className='w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                            <svg
                              className='w-5 h-5 text-white'
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
                          <div className='flex-1'>
                            <h4 className='font-medium text-gray-900 group-hover:text-blue-600 transition-colors'>
                              {menu.name}
                            </h4>
                            {menu.children && menu.children.length > 0 && (
                              <div className='mt-2'>
                                <div className='flex flex-wrap gap-1'>
                                  {menu.children
                                    .slice(0, 3)
                                    .map((child, index) => (
                                      <span
                                        key={child.id}
                                        className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'
                                      >
                                        {child.name}
                                      </span>
                                    ))}
                                  {menu.children.length > 3 && (
                                    <span className='text-xs text-gray-400 px-2 py-1'>
                                      +{menu.children.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className='text-gray-400 group-hover:text-gray-600 transition-colors'>
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
                                d='M9 5l7 7-7 7'
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
