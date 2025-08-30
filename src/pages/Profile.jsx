import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar.jsx';

const Profile = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);
  const [userData, setUserData] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Load user data and menus
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
      navigate('/login');
    }
  };

  if (!userData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6'></div>
          <p className='text-gray-600 text-lg'>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'overview', name: 'Overview', icon: '👤' },
    { id: 'activity', name: 'Activity', icon: '📊' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
  ];

  const recentActivities = [
    {
      action: 'Updated profile information',
      time: '2 hours ago',
      icon: '👤',
      color: 'text-blue-500',
    },
    {
      action: 'Changed password',
      time: '1 day ago',
      icon: '🔒',
      color: 'text-green-500',
    },
    {
      action: 'Accessed dashboard',
      time: '2 days ago',
      icon: '📊',
      color: 'text-purple-500',
    },
    {
      action: 'Logged into system',
      time: '3 days ago',
      icon: '🔑',
      color: 'text-orange-500',
    },
  ];

  const preferences = [
    { name: 'Email Notifications', enabled: true },
    { name: 'SMS Alerts', enabled: false },
    { name: 'Two-Factor Authentication', enabled: true },
    { name: 'Data Analytics', enabled: true },
    { name: 'Marketing Communications', enabled: false },
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
        {/* Header */}
        <header className='bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60 p-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-1'>
              My Profile 👤
            </h1>
            <p className='text-gray-600'>
              View and manage your personal profile information
            </p>
          </div>
        </header>

        {/* Content */}
        <main className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-7xl mx-auto'>
            {/* Profile Header Card */}
            <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 mb-8 overflow-hidden'>
              <div className='bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-12'>
                <div className='flex items-center space-x-8'>
                  <div className='relative'>
                    <div className='w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30'>
                      <span className='text-4xl text-white font-bold'>
                        {userData.firstName?.charAt(0)}
                        {userData.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className='absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full'></div>
                  </div>
                  <div className='text-white'>
                    <h2 className='text-4xl font-bold mb-2'>
                      {userData.firstName} {userData.lastName}
                    </h2>
                    <p className='text-xl text-blue-100 mb-1'>
                      {userData.email}
                    </p>
                    <div className='flex items-center space-x-4 text-blue-100'>
                      <span className='flex items-center space-x-1'>
                        <span>🏢</span>
                        <span>{userData.role?.name || 'User'}</span>
                      </span>
                      <span className='flex items-center space-x-1'>
                        <span>📅</span>
                        <span>
                          Member since{' '}
                          {new Date(userData.createdAt).getFullYear()}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className='bg-white/60 backdrop-blur-sm border-b border-gray-200/60 px-8'>
                <div className='flex space-x-8'>
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeSection === section.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{section.icon}</span>
                      <span>{section.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section Content */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              {/* Main Content */}
              <div className='lg:col-span-2 space-y-8'>
                {activeSection === 'overview' && (
                  <div className='space-y-6'>
                    {/* Personal Information */}
                    <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                      <h3 className='text-xl font-semibold text-gray-900 mb-6'>
                        Personal Information
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-500 mb-1'>
                              Full Name
                            </label>
                            <p className='text-lg text-gray-900'>
                              {userData.firstName} {userData.lastName}
                            </p>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-500 mb-1'>
                              Username
                            </label>
                            <p className='text-lg text-gray-900'>
                              {userData.username}
                            </p>
                          </div>
                        </div>
                        <div className='space-y-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-500 mb-1'>
                              Email Address
                            </label>
                            <p className='text-lg text-gray-900'>
                              {userData.email}
                            </p>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-500 mb-1'>
                              Role
                            </label>
                            <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                              {userData.role?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                      <h3 className='text-xl font-semibold text-gray-900 mb-6'>
                        Account Status
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div className='text-center p-4 bg-green-50 rounded-xl'>
                          <div className='text-2xl text-green-600 mb-2'>✅</div>
                          <p className='text-sm font-medium text-gray-900'>
                            Account Active
                          </p>
                          <p className='text-xs text-gray-500'>Verified user</p>
                        </div>
                        <div className='text-center p-4 bg-blue-50 rounded-xl'>
                          <div className='text-2xl text-blue-600 mb-2'>🔐</div>
                          <p className='text-sm font-medium text-gray-900'>
                            2FA Enabled
                          </p>
                          <p className='text-xs text-gray-500'>
                            Security enhanced
                          </p>
                        </div>
                        <div className='text-center p-4 bg-purple-50 rounded-xl'>
                          <div className='text-2xl text-purple-600 mb-2'>
                            👑
                          </div>
                          <p className='text-sm font-medium text-gray-900'>
                            Premium Access
                          </p>
                          <p className='text-xs text-gray-500'>Full features</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'activity' && (
                  <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                    <h3 className='text-xl font-semibold text-gray-900 mb-6'>
                      Recent Activity
                    </h3>
                    <div className='space-y-4'>
                      {recentActivities.map((activity, index) => (
                        <div
                          key={index}
                          className='flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors'
                        >
                          <div className={`text-2xl ${activity.color}`}>
                            {activity.icon}
                          </div>
                          <div className='flex-1'>
                            <p className='text-gray-900 font-medium'>
                              {activity.action}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'preferences' && (
                  <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                    <h3 className='text-xl font-semibold text-gray-900 mb-6'>
                      Account Preferences
                    </h3>
                    <div className='space-y-4'>
                      {preferences.map((preference, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0'
                        >
                          <div>
                            <p className='text-gray-900 font-medium'>
                              {preference.name}
                            </p>
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                preference.enabled
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {preference.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className='space-y-6'>
                {/* Quick Actions */}
                <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Quick Actions
                  </h3>
                  <div className='space-y-3'>
                    <button
                      onClick={() => navigate('/profile/settings-profile')}
                      className='w-full bg-blue-600 text-white rounded-lg p-3 font-medium hover:bg-blue-700 transition-colors'
                    >
                      Edit Profile
                    </button>
                    <button className='w-full bg-gray-600 text-white rounded-lg p-3 font-medium hover:bg-gray-700 transition-colors'>
                      Change Password
                    </button>
                    <button className='w-full bg-green-600 text-white rounded-lg p-3 font-medium hover:bg-green-700 transition-colors'>
                      Security Settings
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Profile Stats
                  </h3>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Login Sessions</span>
                      <span className='font-semibold'>142</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Profile Views</span>
                      <span className='font-semibold'>28</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Last Login</span>
                      <span className='font-semibold'>Today</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Member Since</span>
                      <span className='font-semibold'>
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </span>
                    </div>
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

export default Profile;
