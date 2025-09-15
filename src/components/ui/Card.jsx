import React from 'react';

/**
 * Info Card Component
 * Used for displaying key-value information in a consistent format
 */
export const InfoCard = ({ 
  label, 
  value, 
  variant = "default", 
  copyable = false,
  icon = null,
  action = null,
  className = ""
}) => {
  const variants = {
    default: "bg-gray-50 border-gray-200",
    primary: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    danger: "bg-red-50 border-red-200",
    info: "bg-cyan-50 border-cyan-200",
    dark: "bg-gray-800 border-gray-700 text-white",
    light: "bg-white border-gray-200"
  };

  const handleCopy = () => {
    if (copyable && value) {
      navigator.clipboard.writeText(value.toString());
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${variants[variant]} ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-sm">{icon}</span>}
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
        {action && action}
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-lg ${copyable ? 'font-mono' : 'font-semibold'} ${variant === 'dark' ? 'text-white' : 'text-gray-900'} break-all`}>
          {value || 'N/A'}
        </p>
        {copyable && (
          <button
            onClick={handleCopy}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 * For displaying statistics and metrics
 */
export const StatCard = ({ 
  title, 
  value, 
  change = null,
  changeType = null, // positive, negative, neutral
  icon = null,
  variant = "default",
  size = "md",
  className = ""
}) => {
  const variants = {
    default: "bg-white border-gray-200",
    primary: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    danger: "bg-red-50 border-red-200",
    dark: "bg-gray-800 border-gray-700 text-white"
  };

  const sizes = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`rounded-lg border ${variants[variant]} ${sizes[size]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${variant === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold mt-1 ${variant === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-1 ${getChangeColor()}`}>
              {changeType === 'positive' && '↗'} 
              {changeType === 'negative' && '↘'}
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4">
            <div className={`p-3 rounded-lg ${
              variant === 'primary' ? 'bg-blue-100' :
              variant === 'success' ? 'bg-green-100' :
              variant === 'warning' ? 'bg-yellow-100' :
              variant === 'danger' ? 'bg-red-100' :
              variant === 'dark' ? 'bg-gray-700' :
              'bg-gray-100'
            }`}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Feature Card Component
 * For displaying feature information with actions
 */
export const FeatureCard = ({ 
  title, 
  description, 
  icon = null,
  image = null,
  actions = [],
  variant = "default",
  hover = true,
  className = ""
}) => {
  const variants = {
    default: "bg-white border-gray-200",
    primary: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    danger: "bg-red-50 border-red-200",
    dark: "bg-gray-800 border-gray-700 text-white"
  };

  return (
    <div className={`rounded-lg border ${variants[variant]} overflow-hidden ${hover ? 'hover:shadow-lg transition-shadow' : ''} ${className}`}>
      {image && (
        <div className="aspect-w-16 aspect-h-9">
          <img src={image} alt={title} className="w-full h-48 object-cover" />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start space-x-3">
          {icon && (
            <div className={`p-2 rounded-lg ${
              variant === 'primary' ? 'bg-blue-100 text-blue-600' :
              variant === 'success' ? 'bg-green-100 text-green-600' :
              variant === 'warning' ? 'bg-yellow-100 text-yellow-600' :
              variant === 'danger' ? 'bg-red-100 text-red-600' :
              variant === 'dark' ? 'bg-gray-700 text-gray-300' :
              'bg-gray-100 text-gray-600'
            }`}>
              {icon}
            </div>
          )}
          
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${variant === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
            {description && (
              <p className={`mt-2 text-sm ${variant === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {description}
              </p>
            )}
            
            {actions.length > 0 && (
              <div className="mt-4 flex space-x-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      action.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                      action.variant === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
                      action.variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                      'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Simple Card Component
 * Basic card container
 */
export const Card = ({ 
  children, 
  variant = "default",
  padding = "md",
  hover = false,
  className = ""
}) => {
  const variants = {
    default: "bg-white border-gray-200",
    primary: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    danger: "bg-red-50 border-red-200",
    dark: "bg-gray-800 border-gray-700",
    light: "bg-gray-50 border-gray-200"
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10"
  };

  return (
    <div className={`rounded-lg border ${variants[variant]} ${paddings[padding]} ${hover ? 'hover:shadow-lg transition-shadow' : ''} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Card Header Component
 */
export const CardHeader = ({ 
  title, 
  subtitle = null,
  action = null,
  className = ""
}) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
    {action && action}
  </div>
);

/**
 * Card Footer Component
 */
export const CardFooter = ({ 
  children, 
  className = ""
}) => (
  <div className={`mt-6 pt-4 border-t border-gray-200 ${className}`}>
    {children}
  </div>
);

export default Card;