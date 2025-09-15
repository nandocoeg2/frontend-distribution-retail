import React, { useState } from 'react';

/**
 * Individual Tab Component
 */
export const Tab = ({ 
  id, 
  label, 
  icon = null, 
  badge = null, 
  disabled = false,
  className = ""
}) => {
  // This is a placeholder component, tabs are rendered by TabContainer
  return null;
};

/**
 * Tab Container Component
 * Manages tab navigation state and renders tab buttons
 */
export const TabContainer = ({ 
  children, 
  defaultActiveTab = null,
  activeTab: controlledActiveTab = null,
  onTabChange = null,
  variant = "default", // default, pills, underline, cards
  size = "md", // sm, md, lg
  fullWidth = false,
  className = ""
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultActiveTab);
  
  // Use controlled or uncontrolled state
  const activeTab = controlledActiveTab !== null ? controlledActiveTab : internalActiveTab;
  
  const handleTabChange = (tabId) => {
    if (controlledActiveTab === null) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  // Extract tab information from children
  const tabs = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === Tab) {
      return child.props;
    }
    return null;
  }).filter(Boolean);

  // Set default active tab if none provided
  React.useEffect(() => {
    if (!activeTab && tabs.length > 0 && controlledActiveTab === null) {
      setInternalActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab, controlledActiveTab]);

  const getVariantClasses = () => {
    switch (variant) {
      case "pills":
        return {
          container: "bg-gray-100 p-1 rounded-lg inline-flex",
          active: "bg-white text-gray-900 shadow-sm",
          inactive: "text-gray-500 hover:text-gray-700"
        };
      case "underline":
        return {
          container: "border-b border-gray-200",
          active: "border-blue-500 text-blue-600 border-b-2",
          inactive: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2"
        };
      case "cards":
        return {
          container: "border-b border-gray-200",
          active: "bg-white border-gray-200 border-t border-l border-r text-gray-900 -mb-px",
          inactive: "text-gray-500 hover:text-gray-700"
        };
      default:
        return {
          container: "border-b border-gray-200 bg-gray-50",
          active: "border-blue-500 text-blue-600 border-b-2",
          inactive: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2"
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "py-2 px-3 text-sm";
      case "lg":
        return "py-4 px-6 text-lg";
      default:
        return "py-3 px-4 text-base";
    }
  };

  const variantClasses = getVariantClasses();
  const sizeClasses = getSizeClasses();

  return (
    <div className={`${className}`}>
      <nav className={`flex ${fullWidth ? 'w-full' : ''} ${variantClasses.container} ${variant === 'pills' ? 'space-x-1' : 'space-x-8'}`} aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={`${sizeClasses} font-medium flex items-center space-x-2 transition-colors ${fullWidth ? 'flex-1 justify-center' : ''} ${
              activeTab === tab.id
                ? variantClasses.active
                : `${variantClasses.inactive} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`
            } ${variant === 'pills' ? 'rounded-md' : ''} ${tab.className || ''}`}
          >
            {tab.icon && <span>{tab.icon}</span>}
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
};

/**
 * Tab Content Component
 * Renders content for the active tab
 */
export const TabContent = ({ 
  children, 
  activeTab, 
  className = "",
  unmountInactive = false 
}) => {
  return (
    <div className={`mt-4 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props.tabId) {
          const isActive = child.props.tabId === activeTab;
          
          if (unmountInactive && !isActive) {
            return null;
          }
          
          return (
            <div 
              key={child.props.tabId}
              className={isActive ? 'block' : 'hidden'}
            >
              {child}
            </div>
          );
        }
        return child;
      })}
    </div>
  );
};

/**
 * Tab Panel Component
 * Individual content panel for each tab
 */
export const TabPanel = ({ 
  tabId, 
  children, 
  className = "" 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Simple Tab Navigation (for backward compatibility)
 */
export const TabNavigation = ({ tabs, activeTab, onTabChange, variant = "default" }) => (
  <TabContainer 
    activeTab={activeTab} 
    onTabChange={onTabChange}
    variant={variant}
  >
    {tabs.map(tab => (
      <Tab 
        key={tab.id}
        id={tab.id}
        label={tab.label}
        icon={tab.icon}
        badge={tab.badge}
        disabled={tab.disabled}
      />
    ))}
  </TabContainer>
);

export default TabContainer;