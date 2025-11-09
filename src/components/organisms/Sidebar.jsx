import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getActiveCompanyName } from '../../utils/companyUtils';
import CompanySwitcher from './CompanySwitcher';
import {
  ArchiveBoxIcon,
  BanknotesIcon,
  Bars3Icon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentChartBarIcon,
  DocumentCurrencyDollarIcon,
  DocumentTextIcon,
  HomeIcon,
  MapPinIcon,
  ReceiptPercentIcon,
  ReceiptRefundIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  Square3Stack3DIcon,
  TruckIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { ChevronDoubleRightIcon } from '@heroicons/react/20/solid';

const Sidebar = ({ isCollapsed, setIsCollapsed, menus = [], onLogout }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [companyName, setCompanyName] = useState(() => getActiveCompanyName());

  const handleCompanyChange = (company) => {
    // Save the selected company to localStorage
    if (company) {
      localStorage.setItem('company', JSON.stringify(company));
      setCompanyName(company.nama_perusahaan);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('company:updated'));
      
      // Reload the page to apply company changes
      window.location.reload();
    }
  };

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
    HomeIcon,
    UsersIcon,
    UserIcon,
    ShieldCheckIcon,
    CircleStackIcon,
    UserGroupIcon,
    TruckIcon,
    CubeIcon,
    Square3Stack3DIcon,
    ClockIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    ShoppingCartIcon,
    DocumentTextIcon,
    ClipboardDocumentCheckIcon,
    DocumentChartBarIcon,
    ArchiveBoxIcon,
    ClipboardDocumentListIcon,
    ReceiptPercentIcon,
    DocumentCurrencyDollarIcon,
    ReceiptRefundIcon,
    BanknotesIcon,
    Bars3Icon,
    Cog6ToothIcon,
    home: HomeIcon,
    dashboard: HomeIcon,
    bars: Bars3Icon,
    user: UserGroupIcon,
    users: UsersIcon,
    'clipboard-document-list': ClipboardDocumentListIcon,
    clipboard: ClipboardDocumentListIcon,
    cog: Cog6ToothIcon,
    settings: Cog6ToothIcon,
    archive: ArchiveBoxIcon,
    document: DocumentTextIcon,
    clock: ClockIcon,
    'shopping-cart': ShoppingCartIcon,
  };

  const emojiToIconMap = {
    '\u{1F3E0}': 'HomeIcon',
    '\u{1F465}': 'UsersIcon',
    '\u{1F4CB}': 'ClipboardDocumentListIcon',
    '\u{1F4E6}': 'ArchiveBoxIcon',
    '\u{2699}\u{FE0F}': 'Cog6ToothIcon',
    '\u{1F552}': 'ClockIcon',
  };

  const getIcon = (iconName = 'default', className = 'w-5 h-5') => {
    const normalizedName = typeof iconName === 'string' ? iconName : 'default';
    const lowerName = normalizedName.toLowerCase();
    const withoutSuffix = lowerName.endsWith('icon')
      ? lowerName.slice(0, -4)
      : lowerName;

    const IconComponent =
      iconComponents[normalizedName] ||
      iconComponents[lowerName] ||
      iconComponents[withoutSuffix] ||
      iconComponents.default;

    return <IconComponent className={className} aria-hidden='true' />;
  };

  const normalizeIconName = (menu) => {
    if (menu.icon && typeof menu.icon === 'string') {
      const rawIcon = menu.icon.trim();

      if (iconComponents[rawIcon]) {
        return rawIcon;
      }

      const camelCandidate =
        rawIcon.endsWith('Icon') || rawIcon.endsWith('icon')
          ? `${rawIcon.slice(0, -4)}Icon`
          : `${rawIcon.charAt(0).toUpperCase()}${rawIcon.slice(1)}Icon`;
      if (iconComponents[camelCandidate]) {
        return camelCandidate;
      }

      const lowercaseIcon = rawIcon.toLowerCase();
      if (iconComponents[lowercaseIcon]) {
        return lowercaseIcon;
      }

      const strippedIcon = lowercaseIcon.endsWith('icon')
        ? lowercaseIcon.slice(0, -4)
        : lowercaseIcon;
      if (iconComponents[strippedIcon]) {
        return strippedIcon;
      }
    }
    if (menu.iconEmoji && emojiToIconMap[menu.iconEmoji]) {
      return emojiToIconMap[menu.iconEmoji];
    }
    return 'default';
  };

  const defaultMenuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      url: '/dashboard',
      icon: 'HomeIcon',
    },
  ];

  const allMenus = menus.length > 0 ? menus : defaultMenuItems;

  const isPathMatch = (targetUrl) => {
    if (!targetUrl || targetUrl === '#') {
      return false;
    }

    if (targetUrl === '/') {
      return location.pathname === '/';
    }

    return (
      location.pathname === targetUrl ||
      location.pathname.startsWith(`${targetUrl}/`)
    );
  };

  useEffect(() => {
    const updateCompanyName = () => {
      setCompanyName(getActiveCompanyName());
    };

    updateCompanyName();

    if (typeof window === 'undefined') {
      return undefined;
    }

    window.addEventListener('storage', updateCompanyName);
    window.addEventListener('company:updated', updateCompanyName);

    return () => {
      window.removeEventListener('storage', updateCompanyName);
      window.removeEventListener('company:updated', updateCompanyName);
    };
  }, []);

  useEffect(() => {
    const menuSource = menus.length > 0 ? menus : defaultMenuItems;

    const findAncestors = (items, parents = []) => {
      for (const item of items) {
        const nextParents = [...parents, item.id];

        if (isPathMatch(item.url)) {
          return parents;
        }

        if (Array.isArray(item.children) && item.children.length > 0) {
          const match = findAncestors(item.children, nextParents);
          if (match) {
            return match;
          }
        }
      }
      return null;
    };

    const ancestorsToExpand = findAncestors(menuSource) || [];

    if (ancestorsToExpand.length === 0) {
      return;
    }

    setExpandedMenus((prev) => {
      let changed = false;
      const next = new Set(prev);

      ancestorsToExpand.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [menus, location.pathname]);

  const renderMenuItem = (menu, level = 0) => {
    const hasChildren =
      Array.isArray(menu.children) && menu.children.length > 0;
    const isChildActive =
      hasChildren && menu.children.some((child) => isPathMatch(child.url));
    const isActive = isPathMatch(menu.url) || isChildActive;
    const isExpanded =
      expandedMenus.has(menu.id) || (isChildActive && !isCollapsed);
    const iconName = normalizeIconName(menu);
    const iconWrapperClasses = `${
      level > 0 ? 'p-1.5' : 'p-2'
    } rounded-lg ${
      isActive
        ? 'bg-white/20'
        : level > 0
        ? 'bg-white/5 group-hover:bg-white/10'
        : 'bg-white/10 group-hover:bg-white/20'
    }`;

    const iconElement = (
      <div
        className={`flex-shrink-0 ${isCollapsed && level === 0 ? '' : 'mr-3'} relative`}
      >
        <div className={iconWrapperClasses}>
          {getIcon(iconName, level > 0 ? 'w-4 h-4' : 'w-5 h-5')}
        </div>
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
            {menu.children.map((child) => renderMenuItem(child, level + 1))}
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
      <div className='relative px-4 py-5 border-b border-white/10'>
        <div className='flex items-center gap-2'>
          {!isCollapsed && (
            <div className='flex-1 min-w-0'>
              <CompanySwitcher
                companyName={companyName}
                onCompanyChange={handleCompanyChange}
              />
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
        </div>
        
        {/* Floating Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='absolute -right-3 top-1/2 -translate-y-1/2 p-2 bg-transparent border border-white/10 rounded-lg hover:bg-slate-700 hover:shadow-lg transition-all duration-200 group z-10'
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronDoubleRightIcon
            className={`w-5 h-5 text-slate-200 transition-transform duration-300 group-hover:scale-110 ${
              isCollapsed ? '' : 'rotate-180'
            }`}
            aria-hidden='true'
          />
        </button>
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


