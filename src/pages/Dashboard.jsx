import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

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
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
      </div>
    </div>
  );
};

export default Dashboard;
