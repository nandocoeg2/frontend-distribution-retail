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

  const defaultMenuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      url: '/dashboard',
      icon: 'default',
      iconEmoji: '🏠',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      url: '/analytics',
      icon: 'default',
      iconEmoji: '📊',
    },
    {
      id: 'users',
      name: 'Users',
      url: '/users',
      icon: 'user',
      iconEmoji: '👥',
    },
    {
      id: 'settings',
      name: 'Settings',
      url: '/settings',
      icon: 'cog',
      iconEmoji: '⚙️',
    },
  ];

  const allMenus = menus.length > 0 ? menus : defaultMenuItems;

  const renderMenuItem = (menu, level = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isActive = location.pathname === menu.url;
    const isExpanded = expandedMenus.has(menu.id);

    return (
      <div key={menu.id} className='mb-2'>
        {hasChildren ? (
          <div
            className={`group flex items-center mx-3 px-3 py-3 text-slate-300 rounded-xl cursor-pointer transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-slate-900/10'
            } ${level > 0 ? 'ml-6' : ''}`}
            onClick={() => toggleSubmenu(menu.id)}
          >
            <div
              className={`flex items-center ${isCollapsed && level === 0 ? 'justify-center' : ''} flex-1`}
            >
              <div
                className={`flex-shrink-0 ${isCollapsed && level === 0 ? '' : 'mr-3'} relative`}
              >
                {menu.iconEmoji ? (
                  <span className='text-xl'>{menu.iconEmoji}</span>
                ) : (
                  <div
                    className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'}`}
                  >
                    {getIcon(menu.icon)}
                  </div>
                )}
              </div>
              {(!isCollapsed || level > 0) && (
                <div className='flex-1 flex items-center justify-between'>
                  <div>
                    <span className='text-sm font-medium'>{menu.name}</span>
                    {menu.description && !isCollapsed && (
                      <p className='text-xs opacity-75 mt-0.5'>
                        {menu.description}
                      </p>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
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
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link to={menu.url}>
            <div
              className={`group flex items-center mx-3 px-3 py-3 text-slate-300 rounded-xl cursor-pointer transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-slate-900/10'
              } ${level > 0 ? 'ml-6' : ''}`}
            >
              <div
                className={`flex items-center ${isCollapsed && level === 0 ? 'justify-center' : ''} flex-1`}
              >
                <div
                  className={`flex-shrink-0 ${isCollapsed && level === 0 ? '' : 'mr-3'} relative`}
                >
                  {menu.iconEmoji ? (
                    <span className='text-xl'>{menu.iconEmoji}</span>
                  ) : (
                    <div
                      className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'}`}
                    >
                      {getIcon(menu.icon)}
                    </div>
                  )}
                </div>
                {(!isCollapsed || level > 0) && (
                  <div className='flex-1 flex items-center justify-between'>
                    <div>
                      <span className='text-sm font-medium'>{menu.name}</span>
                      {menu.description && !isCollapsed && (
                        <p className='text-xs opacity-75 mt-0.5'>
                          {menu.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        {hasChildren && isExpanded && !isCollapsed && (
          <div className='mt-2 space-y-1'>
            {menu.children.map((child) => (
              <Link key={child.id} to={child.url || '#'}>
                <div className='mx-6 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-all duration-200 text-sm'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-current rounded-full opacity-50'>
                      <span className='sr-only'>{child.name}</span>
                    </div>
                    <span>{child.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white h-full flex flex-col transition-all duration-300 shadow-2xl relative ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Decorative gradient overlay */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none'></div>

      {/* Header */}
      <div className='relative p-6 border-b border-white/10'>
        <div className='flex items-center justify-between'>
          {!isCollapsed && (
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg'>
                <span className='text-xl'>⚡</span>
              </div>
              <div>
                <h1 className='text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent'>
                  WorkSpace
                </h1>
                <p className='text-xs text-slate-400'>Admin Panel</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mx-auto'>
              <span className='text-xl'>⚡</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='p-2 rounded-xl hover:bg-white/10 transition-all duration-200 hover:shadow-md group'
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
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
      <div className='flex-1 py-6 overflow-y-auto custom-scrollbar relative'>
        {!isCollapsed && (
          <div className='px-6 mb-4'>
            <p className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
              Navigation
            </p>
          </div>
        )}
        <div className='space-y-1'>
          {allMenus.map((menu) => renderMenuItem(menu))}
        </div>
      </div>

      {/* User Section & Logout */}
      <div className='relative p-4 border-t border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-900/50'>
        {!isCollapsed && (
          <div className='mb-4 p-3 bg-white/5 rounded-xl border border-white/10'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center'>
                <span className='text-sm font-bold text-white'>👤</span>
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-white truncate'>
                  {JSON.parse(localStorage.getItem('userData') || '{}')
                    .firstName || 'User'}{' '}
                  {JSON.parse(localStorage.getItem('userData') || '{}')
                    .lastName || ''}
                </p>
                <p className='text-xs text-slate-400 truncate'>
                  {JSON.parse(localStorage.getItem('userData') || '{}').email ||
                    'user@workspace.com'}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className={`w-full flex items-center px-4 py-3 text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 rounded-xl group ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <svg
            className={`w-5 h-5 group-hover:scale-110 transition-transform duration-200 ${isCollapsed ? '' : 'mr-3'}`}
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
          {!isCollapsed && (
            <span className='text-sm font-medium'>Sign Out</span>
          )}
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
