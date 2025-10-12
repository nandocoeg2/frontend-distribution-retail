import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArchiveBoxIcon,
  Bars3Icon,
  BuildingStorefrontIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { ChevronDoubleRightIcon } from '@heroicons/react/20/solid';

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

  const iconComponents = {
    default: HomeIcon,
    home: HomeIcon,
    dashboard: HomeIcon,
    bars: Bars3Icon,
    user: UserGroupIcon,
    users: UserGroupIcon,
    'clipboard-document-list': ClipboardDocumentListIcon,
    clipboard: ClipboardDocumentListIcon,
    cog: Cog6ToothIcon,
    settings: Cog6ToothIcon,
    archive: ArchiveBoxIcon,
    document: DocumentTextIcon,
    clock: ClockIcon,
  };

  const emojiToIconMap = {
    '\u{1F3E0}': 'home',
    '\u{1F465}': 'user',
    '\u{1F4CB}': 'clipboard-document-list',
    '\u{1F4E6}': 'archive',
    '\u{2699}\u{FE0F}': 'cog',
    '\u{1F552}': 'clock',
  };

  const getIcon = (iconName = 'default', className = 'w-5 h-5') => {
    const IconComponent = iconComponents[iconName] || iconComponents.default;
    return <IconComponent className={className} aria-hidden='true' />;
  };

  const normalizeIconName = (menu) => {
    if (menu.icon && typeof menu.icon === 'string') {
      return menu.icon.toLowerCase();
    }
    if (menu.iconEmoji && emojiToIconMap[menu.iconEmoji]) {
      return emojiToIconMap[menu.iconEmoji];
    }
    return 'default';
  };

  const defaultMenuItems = [
    {
      id: 'reporting',
      name: 'Reporting',
      url: '/reporting',
      icon: 'home',
    },
    {
      id: 'users',
      name: 'Users',
      url: '/users',
      icon: 'user',
    },
    {
      id: 'po',
      name: 'Purchase Order',
      icon: 'clipboard-document-list',
      children: [
        {
          id: 'po-purchase-orders',
          name: 'Purchase Orders',
          url: '/po/purchase-orders',
        },
        {
          id: 'po-invoices',
          name: 'Invoice Pengiriman',
          url: '/po/invoice-pengiriman',
        },
        {
          id: 'po-invoice-penagihan',
          name: 'Invoice Penagihan',
          url: '/po/invoice-penagihan',
        },
        { id: 'po-surat-jalan', name: 'Surat Jalan', url: '/po/surat-jalan' },
        { id: 'po-packings', name: 'Packings', url: '/po/packings' },
        {
          id: 'po-purchase-orders-history',
          name: 'Purchase Order History',
          url: '/po/purchase-orders-history',
        },
      ],
    },
    {
      id: 'master',
      name: 'Master Data',
      icon: 'cog',
      children: [
        { id: 'master-customers', name: 'Customers', url: '/master/customers' },
        { id: 'master-suppliers', name: 'Suppliers', url: '/master/suppliers' },
        {
          id: 'master-inventories',
          name: 'Inventories',
          url: '/master/inventories',
        },
        {
          id: 'master-term-of-payment',
          name: 'Term of Payments',
          url: '/master/term-of-payment',
        },
        {
          id: 'master-group-customers',
          name: 'Group Customers',
          url: '/master/group-customers',
        },
        { id: 'master-regions', name: 'Regions', url: '/master/regions' },
        { id: 'master-company', name: 'Companies', url: '/master/company' },
      ],
    },
  ];

  const allMenus = menus.length > 0 ? menus : defaultMenuItems;

  const renderMenuItem = (menu, level = 0) => {
    const hasChildren =
      Array.isArray(menu.children) && menu.children.length > 0;
    const isActive = menu.url ? location.pathname === menu.url : false;
    const isExpanded = expandedMenus.has(menu.id);
    const iconName = normalizeIconName(menu);
    const iconWrapperClasses = `p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'}`;

    const iconElement = (
      <div
        className={`flex-shrink-0 ${isCollapsed && level === 0 ? '' : 'mr-3'} relative`}
      >
        <div className={iconWrapperClasses}>{getIcon(iconName)}</div>
      </div>
    );

    const menuLabel = (
      <div className='flex-1'>
        <span className='text-sm font-medium'>{menu.name}</span>
        {menu.description && !isCollapsed && (
          <p className='text-xs opacity-75 mt-0.5'>{menu.description}</p>
        )}
      </div>
    );

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
              {iconElement}
              {(!isCollapsed || level > 0) && (
                <div className='flex items-center justify-between flex-1'>
                  {menuLabel}
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
                {iconElement}
                {(!isCollapsed || level > 0) && (
                  <div className='flex items-center justify-between flex-1'>
                    {menuLabel}
                    {menu.badge && (
                      <span className='px-2 py-0.5 text-xs font-semibold bg-white/10 rounded-full'>
                        {menu.badge}
                      </span>
                    )}
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
                <div className='px-3 py-2 mx-6 text-sm transition-all duration-200 rounded-lg cursor-pointer text-slate-400 hover:text-white hover:bg-white/5'>
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
      <div className='absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent'></div>

      {/* Header */}
      <div className='relative p-6 border-b border-white/10'>
        <div className='flex items-center justify-between'>
          {!isCollapsed && (
            <div className='flex items-center space-x-3'>
              <div className='flex items-center justify-center w-10 h-10 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl'>
                <BuildingStorefrontIcon
                  className='w-6 h-6 text-white'
                  aria-hidden='true'
                />
              </div>
              <div>
                <h1 className='text-xl font-bold text-transparent bg-gradient-to-r from-white to-slate-200 bg-clip-text'>
                  PT Doven
                </h1>
                <p className='text-xs text-slate-400'>PT Doven</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className='flex items-center justify-center w-10 h-10 mx-auto shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl'>
              <BuildingStorefrontIcon
                className='w-6 h-6 text-white'
                aria-hidden='true'
              />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='p-2 transition-all duration-200 rounded-xl hover:bg-white/10 hover:shadow-md group'
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronDoubleRightIcon
              className={`w-6 h-6 text-slate-200 transition-transform duration-300 group-hover:scale-110 ${
                isCollapsed ? '' : 'rotate-180'
              }`}
              aria-hidden='true'
            />
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className='relative flex-1 py-6 overflow-y-auto custom-scrollbar'>
        {!isCollapsed && (
          <div className='px-6 mb-4'>
            <p className='text-xs font-semibold tracking-wider uppercase text-slate-400'>
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
          <div className='p-3 mb-4 border bg-white/5 rounded-xl border-white/10'>
            <div className='flex items-center space-x-3'>
              <div className='flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600'>
                <UserCircleIcon
                  className='w-6 h-6 text-white'
                  aria-hidden='true'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-white truncate'>
                  {JSON.parse(localStorage.getItem('userData') || '{}')
                    .firstName || 'User'}{' '}
                  {JSON.parse(localStorage.getItem('userData') || '{}')
                    .lastName || ''}
                </p>
                <p className='text-xs truncate text-slate-400'>
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

