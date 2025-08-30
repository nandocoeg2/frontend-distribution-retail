import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar.jsx';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    const userMenus = authService.getMenus();
    setMenus(userMenus);
  }, []);

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
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
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
              Settings ⚙️
            </h1>
            <p className='text-gray-600'>
              Manage your application preferences and configuration
            </p>
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
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className='p-6'>
                {activeTab === 'general' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        General Settings
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Application Name
                          </label>
                          <input
                            type='text'
                            value='WorkSpace Admin Panel'
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Time Zone
                          </label>
                          <select className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                            <option>UTC</option>
                            <option>America/New_York</option>
                            <option>Europe/London</option>
                            <option>Asia/Tokyo</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className='text-md font-medium text-gray-900 mb-3'>
                        Application Preferences
                      </h4>
                      <div className='space-y-3'>
                        <label className='flex items-center'>
                          <input
                            type='checkbox'
                            defaultChecked
                            className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                          />
                          <span className='ml-2 text-sm text-gray-700'>
                            Enable email notifications
                          </span>
                        </label>
                        <label className='flex items-center'>
                          <input
                            type='checkbox'
                            className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                          />
                          <span className='ml-2 text-sm text-gray-700'>
                            Auto-save changes
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Security Settings
                      </h3>
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Current Password
                          </label>
                          <input
                            type='password'
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            New Password
                          </label>
                          <input
                            type='password'
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Confirm New Password
                          </label>
                          <input
                            type='password'
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className='text-md font-medium text-gray-900 mb-3'>
                        Two-Factor Authentication
                      </h4>
                      <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                        <div className='flex items-center'>
                          <span className='text-green-600 mr-2'>✅</span>
                          <span className='text-sm text-green-800'>
                            Two-factor authentication is enabled
                          </span>
                        </div>
                        <button className='mt-2 text-sm text-green-700 hover:text-green-900 font-medium'>
                          Manage 2FA Settings
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Notification Preferences
                      </h3>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between py-3 border-b border-gray-200'>
                          <div>
                            <h4 className='text-sm font-medium text-gray-900'>
                              Email Notifications
                            </h4>
                            <p className='text-sm text-gray-500'>
                              Receive notifications via email
                            </p>
                          </div>
                          <input
                            type='checkbox'
                            defaultChecked
                            className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                          />
                        </div>
                        <div className='flex items-center justify-between py-3 border-b border-gray-200'>
                          <div>
                            <h4 className='text-sm font-medium text-gray-900'>
                              Push Notifications
                            </h4>
                            <p className='text-sm text-gray-500'>
                              Receive push notifications in browser
                            </p>
                          </div>
                          <input
                            type='checkbox'
                            className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                          />
                        </div>
                        <div className='flex items-center justify-between py-3'>
                          <div>
                            <h4 className='text-sm font-medium text-gray-900'>
                              Weekly Reports
                            </h4>
                            <p className='text-sm text-gray-500'>
                              Receive weekly summary reports
                            </p>
                          </div>
                          <input
                            type='checkbox'
                            defaultChecked
                            className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Appearance Settings
                      </h3>
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Theme
                          </label>
                          <select className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                            <option>Light</option>
                            <option>Dark</option>
                            <option>Auto</option>
                          </select>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Sidebar Position
                          </label>
                          <div className='flex space-x-4'>
                            <label className='flex items-center'>
                              <input
                                type='radio'
                                name='sidebar'
                                value='left'
                                defaultChecked
                                className='text-blue-600 border-gray-300 focus:ring-blue-500'
                              />
                              <span className='ml-2 text-sm text-gray-700'>
                                Left
                              </span>
                            </label>
                            <label className='flex items-center'>
                              <input
                                type='radio'
                                name='sidebar'
                                value='right'
                                className='text-blue-600 border-gray-300 focus:ring-blue-500'
                              />
                              <span className='ml-2 text-sm text-gray-700'>
                                Right
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className='mt-8 pt-6 border-t border-gray-200'>
                  <button className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors'>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
