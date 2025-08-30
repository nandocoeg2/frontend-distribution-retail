import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getUserData();
    if (!user) {
      navigate('/login');
      return;
    }
    setUserData(user);
  }, [navigate]);

  if (!userData) {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6'></div>
          <p className='text-gray-600 text-lg'>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      name: 'Create Report',
      icon: 'plus',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    {
      name: 'Export Data',
      icon: 'arrow-up-on-square',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
    },
    {
      name: 'View Analytics',
      icon: 'magnifying-glass',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    },
    {
      name: 'Manage Users',
      icon: 'users',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
    },
  ];

  const recentActivities = [
    {
      action: 'Generated monthly report',
      time: '2 minutes ago',
      icon: 'document',
      color: 'text-blue-500',
    },
    {
      action: 'Updated user permissions',
      time: '15 minutes ago',
      icon: 'lock-closed',
      color: 'text-green-500',
    },
    {
      action: 'Exported analytics data',
      time: '1 hour ago',
      icon: 'chart-bar',
      color: 'text-purple-500',
    },
    {
      action: 'Created backup',
      time: '3 hours ago',
      icon: 'archive-box',
      color: 'text-orange-500',
    },
  ];

  return (
    <>
      <div className='bg-white/80 backdrop-blur-sm shadow-sm p-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 mb-1 flex items-center'>
            Good morning, {userData.firstName}!{' '}
            <HeroIcon
              name='sparkles'
              className='w-8 h-8 text-yellow-500 ml-2'
            />
          </h1>
          <p className='text-gray-600'>
            Here's what's happening with your workspace today
          </p>
        </div>
      </div>

      <div className='p-6 space-y-6'>
        <div>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>
            Quick Actions
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {quickActions.map((action) => (
              <button
                key={action.name}
                className={`text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow ${action.color}`}
              >
                <HeroIcon name={action.icon} className='w-8 h-8 mb-2' />
                <div className='font-semibold'>{action.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>
            Recent Activities
          </h2>
          <div className='bg-white rounded-lg shadow-md p-4'>
            <ul className='space-y-3'>
              {recentActivities.map((activity, index) => (
                <li key={index} className='flex items-center space-x-3'>
                  <HeroIcon
                    name={activity.icon}
                    className={`w-6 h-6 ${activity.color}`}
                  />
                  <div>
                    <p className='text-gray-700'>{activity.action}</p>
                    <p className='text-xs text-gray-500'>{activity.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
