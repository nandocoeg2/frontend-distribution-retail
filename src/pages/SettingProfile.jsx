import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar.jsx';

const SettingProfile = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    avatar: null,
  });

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Load user data and menus
    const user = authService.getUserData();
    const userMenus = authService.getMenus();

    setUserData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      jobTitle: user?.jobTitle || '',
      avatar: user?.avatar || null,
    });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically update the user profile
    console.log('Profile updated:', userData);
    // Show success message or redirect
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
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-1'>
              Profile Settings 👤
            </h1>
            <p className='text-gray-600'>
              Manage your personal profile information and preferences
            </p>
          </div>
        </header>

        {/* Content */}
        <main className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-4xl mx-auto'>
            <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden'>
              {/* Profile Header */}
              <div className='bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8'>
                <div className='flex items-center space-x-6'>
                  <div className='relative'>
                    <div className='w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30'>
                      {userData.avatar ? (
                        <img
                          src={userData.avatar}
                          alt='Profile'
                          className='w-full h-full rounded-full object-cover'
                        />
                      ) : (
                        <span className='text-3xl text-white font-bold'>
                          {userData.firstName?.charAt(0)}
                          {userData.lastName?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <button className='absolute bottom-0 right-0 bg-white text-gray-600 rounded-full p-2 shadow-md hover:shadow-lg transition-shadow'>
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                      </svg>
                    </button>
                  </div>
                  <div className='text-white'>
                    <h2 className='text-2xl font-bold'>
                      {userData.firstName} {userData.lastName}
                    </h2>
                    <p className='text-blue-100'>{userData.email}</p>
                    <p className='text-blue-100 text-sm'>{userData.jobTitle}</p>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit} className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Personal Information */}
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Personal Information
                      </h3>

                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            First Name
                          </label>
                          <input
                            type='text'
                            name='firstName'
                            value={userData.firstName}
                            onChange={handleInputChange}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                            placeholder='Enter your first name'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Last Name
                          </label>
                          <input
                            type='text'
                            name='lastName'
                            value={userData.lastName}
                            onChange={handleInputChange}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                            placeholder='Enter your last name'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Email Address
                          </label>
                          <input
                            type='email'
                            name='email'
                            value={userData.email}
                            onChange={handleInputChange}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                            placeholder='Enter your email address'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Phone Number
                          </label>
                          <input
                            type='tel'
                            name='phone'
                            value={userData.phone}
                            onChange={handleInputChange}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                            placeholder='Enter your phone number'
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Work Information
                      </h3>

                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Job Title
                          </label>
                          <input
                            type='text'
                            name='jobTitle'
                            value={userData.jobTitle}
                            onChange={handleInputChange}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                            placeholder='Enter your job title'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Department
                          </label>
                          <select
                            name='department'
                            value={userData.department}
                            onChange={handleInputChange}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                          >
                            <option value=''>Select Department</option>
                            <option value='IT'>Information Technology</option>
                            <option value='HR'>Human Resources</option>
                            <option value='Finance'>Finance</option>
                            <option value='Marketing'>Marketing</option>
                            <option value='Operations'>Operations</option>
                            <option value='Sales'>Sales</option>
                          </select>
                        </div>

                        {/* Security Settings */}
                        <div className='pt-4 border-t border-gray-200'>
                          <h4 className='text-md font-medium text-gray-900 mb-3'>
                            Security Preferences
                          </h4>
                          <div className='space-y-3'>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                defaultChecked
                                className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                              />
                              <span className='ml-2 text-sm text-gray-700'>
                                Enable two-factor authentication
                              </span>
                            </label>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                              />
                              <span className='ml-2 text-sm text-gray-700'>
                                Send login notifications
                              </span>
                            </label>
                            <label className='flex items-center'>
                              <input
                                type='checkbox'
                                defaultChecked
                                className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                              />
                              <span className='ml-2 text-sm text-gray-700'>
                                Auto-logout after inactivity
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='mt-8 pt-6 border-t border-gray-200 flex justify-between'>
                  <button
                    type='button'
                    className='px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium'
                  >
                    Cancel Changes
                  </button>
                  <div className='space-x-3'>
                    <button
                      type='button'
                      className='px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium'
                    >
                      Change Password
                    </button>
                    <button
                      type='submit'
                      className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingProfile;
