import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const user = authService.getUserData();
    setUserData(user);
  }, [navigate]);

  if (!userData) {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <p>Loading profile...</p>
      </div>
    );
  }

  const sections = [
    { id: 'overview', name: 'Overview', icon: 'user-circle' },
    { id: 'activity', name: 'Activity', icon: 'chart-bar' },
    { id: 'preferences', name: 'Preferences', icon: 'cog' },
  ];

  return (
    <>
      <header className='bg-white/80 p-6'>
        <h1 className='text-3xl font-bold flex items-center'>
          My Profile <HeroIcon name='user-circle' className='w-8 h-8 ml-2' />
        </h1>
      </header>
      <main className='flex-1 overflow-y-auto p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-white/90 rounded-2xl shadow-sm mb-8'>
            <div className='bg-gradient-to-r from-blue-500 to-indigo-600 p-8'>
              <div className='flex items-center space-x-8'>
                <div className='w-32 h-32 bg-white/20 rounded-full flex items-center justify-center'>
                  <span className='text-4xl text-white font-bold'>
                    {userData.firstName?.charAt(0)}
                    {userData.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className='text-4xl font-bold text-white'>
                    {userData.firstName} {userData.lastName}
                  </h2>
                  <p className='text-xl text-blue-100'>{userData.email}</p>
                </div>
              </div>
            </div>
            <div className='px-8'>
              <div className='flex space-x-8'>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`py-4 px-2 border-b-2 flex items-center space-x-2 ${
                      activeSection === section.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    <HeroIcon name={section.icon} className='w-5 h-5' />
                    <span>{section.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            <div className='lg:col-span-2 space-y-8'>
              {activeSection === 'overview' && (
                <div className='bg-white/90 p-6 rounded-2xl shadow-sm'>
                  <h3 className='text-xl font-semibold mb-6'>
                    Personal Information
                  </h3>
                  {/* ... overview content ... */}
                </div>
              )}
            </div>
            <div className='space-y-6'>
              <div className='bg-white/90 p-6 rounded-2xl shadow-sm'>
                <h3 className='text-lg font-semibold mb-4'>Quick Actions</h3>
                <button
                  onClick={() => navigate('/profile/settings-profile')}
                  className='w-full bg-blue-600 text-white p-3 rounded-lg'
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Profile;
