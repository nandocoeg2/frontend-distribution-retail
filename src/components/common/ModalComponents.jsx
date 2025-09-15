import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { 
  AccordionItem, 
  StatusBadge as UIStatusBadge, 
  InfoCard as UIInfoCard,
  LoadingState as UILoadingState,
  TabContainer,
  Tab
} from '../ui';

/**
 * @deprecated Use AccordionItem from '../ui/Accordion' instead
 * Keeping for backward compatibility
 */
export const AccordionSection = ({ title, isExpanded, onToggle, children, bgColor = "bg-white" }) => (
  <div className={`${bgColor} rounded-lg border border-gray-200 mb-4 overflow-hidden`}>
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
    >
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {isExpanded ? (
        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
      )}
    </button>
    {isExpanded && (
      <div className="px-6 pb-6 border-t border-gray-100">
        {children}
      </div>
    )}
  </div>
);

/**
 * @deprecated Use InfoCard from '../ui/Card' instead
 * Keeping for backward compatibility
 */
export const InfoCard = ({ label, value, variant = "default", copyable = false }) => {
  const variants = {
    default: "bg-gray-50 border-gray-200",
    primary: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    danger: "bg-red-50 border-red-200"
  };

  return (
    <div className={`p-4 rounded-lg border ${variants[variant]}`}>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className={`text-lg ${copyable ? 'font-mono' : 'font-semibold'} text-gray-900 break-all`}>
        {value || 'N/A'}
      </p>
    </div>
  );
};

/**
 * @deprecated Use StatusBadge from '../ui/Badge' instead
 * Keeping for backward compatibility
 */
export const StatusBadge = ({ status, variant = 'default' }) => {
  const variants = {
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    primary: "bg-blue-100 text-blue-800 border-blue-200",
    default: "bg-gray-100 text-gray-800 border-gray-200"
  };

  if (!status) return <span className="text-gray-400">No Status</span>;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${variants[variant]}`}>
      {status}
    </span>
  );
};

/**
 * Modal Header Component
 * Provides consistent header styling across all modals
 */
export const ModalHeader = ({ 
  title, 
  subtitle, 
  icon, 
  onClose, 
  gradientFrom = "from-blue-50", 
  gradientTo = "to-indigo-50",
  iconBgColor = "bg-blue-100"
}) => (
  <div className={`flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}>
    <div className="flex items-center space-x-4">
      <div className={`p-2 ${iconBgColor} rounded-lg`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
    <button 
      onClick={onClose} 
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

/**
 * Modal Footer Component
 * Provides consistent footer styling with action buttons
 */
export const ModalFooter = ({ onClose, actions = [] }) => (
  <div className="border-t border-gray-200 p-6 bg-gray-50">
    <div className="flex justify-end space-x-3">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`px-6 py-2 rounded-lg transition-colors font-medium ${action.className || 'bg-gray-500 text-white hover:bg-gray-600'}`}
        >
          {action.label}
        </button>
      ))}
      <button
        onClick={onClose}
        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
      >
        Close
      </button>
    </div>
  </div>
);

/**
 * @deprecated Use TabContainer from '../ui/Tabs' instead
 * Keeping for backward compatibility
 */
export const TabNavigation = ({ tabs, activeTab, onTabChange }) => (
  <div className="border-b border-gray-200 bg-gray-50">
    <nav className="flex space-x-8 px-6" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.badge && (
            <span className="ml-2 bg-blue-100 text-blue-600 py-1 px-2 rounded-full text-xs font-semibold">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  </div>
);

/**
 * Empty State Component
 * Displays consistent empty state messaging
 */
export const EmptyState = ({ icon, title, description }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl">{icon}</span>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500">{description}</p>
  </div>
);

/**
 * @deprecated Use LoadingState from '../ui/Loading' instead
 * Keeping for backward compatibility
 */
export const LoadingState = ({ message = "Loading..." }) => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-500">{message}</p>
    </div>
  </div>
);

/**
 * Base Modal Container Component
 * Provides the base modal structure that other modals can extend
 */
export const BaseModal = ({ 
  show, 
  onClose, 
  children, 
  maxWidth = "max-w-6xl",
  className = ""
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-hidden flex flex-col ${className}`}>
        {children}
      </div>
    </div>
  );
};