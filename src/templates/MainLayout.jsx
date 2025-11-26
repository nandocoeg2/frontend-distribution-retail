import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/organisms/Sidebar.jsx';
import NotificationBell from '../components/molecules/NotificationBell.jsx';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService.js';

const MainLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const userMenus = authService.getMenus();
    setMenus(userMenus || []);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        menus={menus}
        onLogout={handleLogout}
      />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <header className='flex justify-between items-center p-4 bg-white border-b'>
          <div>{/* Breadcrumbs or page titles can be added here */}</div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => window.location.reload()}
              className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors'
              title='Refresh halaman'
            >
              <ArrowPathIcon className='w-5 h-5' />
            </button>
            <NotificationBell />
          </div>
        </header>
        <main className='flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4'>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
