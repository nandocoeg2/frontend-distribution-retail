import React, { useState, useEffect } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const SettingProfile = () => {
  const navigate = useNavigate();
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
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const user = authService.getUserData();
    setUserData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      jobTitle: user?.jobTitle || '',
      avatar: user?.avatar || null,
    });
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Profile updated:', userData);
  };

  return (
    <>
      <header className='bg-white/80 p-6'>
        <h1 className='text-3xl font-bold flex items-center gap-2'>
          Profile Settings
          <UserIcon className='h-8 w-8 text-indigo-500' aria-hidden='true' />
        </h1>
      </header>

      <main className='flex-1 overflow-y-auto p-6'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-white/90 rounded-2xl shadow-sm'>
            <div className='bg-gradient-to-r from-blue-500 to-indigo-600 p-8'>
              <div className='flex items-center space-x-6'>
                <div className='w-24 h-24 bg-white/20 rounded-full flex items-center justify-center'>
                  {userData.avatar ? (
                    <img
                      src={userData.avatar}
                      alt='Profile'
                      className='w-full h-full rounded-full'
                    />
                  ) : (
                    <span className='text-3xl text-white font-bold'>
                      {userData.firstName?.charAt(0)}
                      {userData.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-white'>
                    {userData.firstName} {userData.lastName}
                  </h2>
                  <p className='text-blue-100'>{userData.email}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='p-6'>
              <div className='grid md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>
                    Personal Information
                  </h3>
                  <input
                    type='text'
                    name='firstName'
                    value={userData.firstName}
                    onChange={handleInputChange}
                    placeholder='First Name'
                    className='w-full p-3 border rounded-lg'
                  />
                  <input
                    type='text'
                    name='lastName'
                    value={userData.lastName}
                    onChange={handleInputChange}
                    placeholder='Last Name'
                    className='w-full p-3 border rounded-lg'
                  />
                  <input
                    type='email'
                    name='email'
                    value={userData.email}
                    onChange={handleInputChange}
                    placeholder='Email Address'
                    className='w-full p-3 border rounded-lg'
                  />
                </div>
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>Work Information</h3>
                  <input
                    type='text'
                    name='jobTitle'
                    value={userData.jobTitle}
                    onChange={handleInputChange}
                    placeholder='Job Title'
                    className='w-full p-3 border rounded-lg'
                  />
                  <select
                    name='department'
                    value={userData.department}
                    onChange={handleInputChange}
                    className='w-full p-3 border rounded-lg'
                  >
                    <option value=''>Select Department</option>
                    <option value='IT'>IT</option>
                    <option value='HR'>HR</option>
                  </select>
                </div>
              </div>
              <div className='mt-8 pt-6 border-t'>
                <button
                  type='submit'
                  className='px-6 py-3 bg-blue-600 text-white rounded-lg'
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default SettingProfile;
