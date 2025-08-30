import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isCollapsed, setIsCollapsed, menus = [], onLogout }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState(new Set());

  const toggleSubmenu = (menuId) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const getIcon = (iconName) => {
    const icons = {
      'clipboard-document-list': (
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
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      ),
      user: (
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
            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
          />
        </svg>
      ),
      cog: (
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
            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
          />
        </svg>
      ),
      default: (
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
            d='M4 6h16M4 12h16M4 18h16'
          />
        </svg>
      ),
    };
    return icons[iconName] || icons['default'];
  };

  const renderMenuItem = (menu, level = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isActive = location.pathname === menu.url;
    const isExpanded = expandedMenus.has(menu.id);

    return (
      <div key={menu.id} className='mb-1'>
        <div
          className={`flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer transition-colors duration-200 ${
            isActive ? 'bg-gray-700 text-white' : ''
          } ${level > 0 ? 'pl-8' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleSubmenu(menu.id);
            }
          }}
        >
          <div
            className={`flex items-center ${isCollapsed && level === 0 ? 'justify-center' : ''} flex-1`}
          >
            <div
              className={`flex-shrink-0 ${isCollapsed && level === 0 ? '' : 'mr-3'}`}
            >
              {getIcon(menu.icon)}
            </div>
            {(!isCollapsed || level > 0) && (
              <div className='flex-1 flex items-center justify-between'>
                <span className='text-sm font-medium'>{menu.name}</span>
                {hasChildren && (
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isExpanded ? 'transform rotate-90' : ''
                    }`}
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
                )}
              </div>
            )}
          </div>
          {!hasChildren && menu.url !== '#' && (
            <Link to={menu.url} className='absolute inset-0' />
          )}
        </div>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className='ml-4'>
            {menu.children.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-gray-800 text-white h-full flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className='p-4 border-b border-gray-700'>
        <div className='flex items-center justify-between'>
          {!isCollapsed && <h1 className='text-xl font-bold'>Dashboard</h1>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='p-1 rounded hover:bg-gray-700 transition-colors duration-200'
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className='flex-1 py-4 overflow-y-auto'>
        {menus.map((menu) => renderMenuItem(menu))}
      </div>

      {/* Logout Button */}
      <div className='p-4 border-t border-gray-700'>
        <button
          onClick={onLogout}
          className={`w-full flex items-center px-4 py-2 text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200 rounded ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <svg
            className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
            />
          </svg>
          {!isCollapsed && <span className='text-sm font-medium'>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
