import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/organisms/Sidebar.jsx';
import NotificationBell from '../components/molecules/NotificationBell.jsx';
import authService from '../services/authService.js';

const MainLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userMenus = authService.getMenus();
    setMenus(userMenus || []);
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
          <NotificationBell />
        </header>
        <main className='flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4'>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
