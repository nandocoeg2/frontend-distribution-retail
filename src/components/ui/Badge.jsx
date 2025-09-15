import React from 'react';

/**
 * Status Badge Component
 * Displays status information with appropriate colors and variants
 */
export const StatusBadge = ({ 
  status, 
  variant = 'default',
  size = 'md',
  icon = null,
  dot = false,
  outline = false,
  className = ""
}) => {
  const variants = {
    success: outline ? "bg-transparent text-green-700 border-green-300" : "bg-green-100 text-green-800 border-green-200",
    warning: outline ? "bg-transparent text-yellow-700 border-yellow-300" : "bg-yellow-100 text-yellow-800 border-yellow-200",
    danger: outline ? "bg-transparent text-red-700 border-red-300" : "bg-red-100 text-red-800 border-red-200",
    error: outline ? "bg-transparent text-red-700 border-red-300" : "bg-red-100 text-red-800 border-red-200",
    primary: outline ? "bg-transparent text-blue-700 border-blue-300" : "bg-blue-100 text-blue-800 border-blue-200",
    secondary: outline ? "bg-transparent text-gray-700 border-gray-300" : "bg-gray-100 text-gray-800 border-gray-200",
    info: outline ? "bg-transparent text-cyan-700 border-cyan-300" : "bg-cyan-100 text-cyan-800 border-cyan-200",
    dark: outline ? "bg-transparent text-gray-900 border-gray-400" : "bg-gray-800 text-white border-gray-700",
    light: outline ? "bg-transparent text-gray-600 border-gray-200" : "bg-white text-gray-700 border-gray-200",
    default: outline ? "bg-transparent text-gray-700 border-gray-300" : "bg-gray-100 text-gray-800 border-gray-200"
  };

  const sizes = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
    xl: "px-5 py-2.5 text-lg"
  };

  const dotSizes = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-3.5 h-3.5"
  };

  if (!status && status !== 0) return <span className="text-gray-400">No Status</span>;

  return (
    <span className={`inline-flex items-center space-x-1.5 rounded-full font-medium border ${variants[variant]} ${sizes[size]} ${className}`}>
      {dot && (
        <span 
          className={`rounded-full ${dotSizes[size]} ${
            variant === 'success' ? 'bg-green-500' :
            variant === 'warning' ? 'bg-yellow-500' :
            variant === 'danger' || variant === 'error' ? 'bg-red-500' :
            variant === 'primary' ? 'bg-blue-500' :
            variant === 'info' ? 'bg-cyan-500' :
            variant === 'dark' ? 'bg-gray-700' :
            'bg-gray-400'
          }`}
        />
      )}
      {icon && <span>{icon}</span>}
      <span>{status}</span>
    </span>
  );
};

/**
 * Number Badge Component
 * Displays numeric information (like counts)
 */
export const NumberBadge = ({ 
  count, 
  max = 99,
  variant = 'primary',
  size = 'md',
  showZero = false,
  className = ""
}) => {
  if (!showZero && (!count || count === 0)) return null;

  const displayCount = count > max ? `${max}+` : count;

  const variants = {
    primary: "bg-blue-500 text-white",
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    danger: "bg-red-500 text-white",
    error: "bg-red-500 text-white",
    secondary: "bg-gray-500 text-white",
    dark: "bg-gray-800 text-white",
    light: "bg-gray-200 text-gray-800"
  };

  const sizes = {
    xs: "text-xs min-w-[1rem] h-4 px-1",
    sm: "text-xs min-w-[1.25rem] h-5 px-1.5",
    md: "text-sm min-w-[1.5rem] h-6 px-2",
    lg: "text-base min-w-[2rem] h-8 px-2.5",
    xl: "text-lg min-w-[2.5rem] h-10 px-3"
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>
      {displayCount}
    </span>
  );
};

/**
 * Icon Badge Component
 * Badge with icon only
 */
export const IconBadge = ({ 
  icon, 
  variant = 'primary',
  size = 'md',
  outline = false,
  className = ""
}) => {
  const variants = {
    primary: outline ? "bg-transparent text-blue-600 border-blue-300" : "bg-blue-100 text-blue-600",
    success: outline ? "bg-transparent text-green-600 border-green-300" : "bg-green-100 text-green-600",
    warning: outline ? "bg-transparent text-yellow-600 border-yellow-300" : "bg-yellow-100 text-yellow-600",
    danger: outline ? "bg-transparent text-red-600 border-red-300" : "bg-red-100 text-red-600",
    error: outline ? "bg-transparent text-red-600 border-red-300" : "bg-red-100 text-red-600",
    secondary: outline ? "bg-transparent text-gray-600 border-gray-300" : "bg-gray-100 text-gray-600",
    dark: outline ? "bg-transparent text-gray-800 border-gray-400" : "bg-gray-200 text-gray-800"
  };

  const sizes = {
    xs: "w-6 h-6 p-1",
    sm: "w-8 h-8 p-1.5",
    md: "w-10 h-10 p-2",
    lg: "w-12 h-12 p-2.5",
    xl: "w-14 h-14 p-3"
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full ${variants[variant]} ${sizes[size]} ${outline ? 'border' : ''} ${className}`}>
      {icon}
    </span>
  );
};

/**
 * Dot Badge Component
 * Simple dot indicator
 */
export const DotBadge = ({ 
  variant = 'primary',
  size = 'md',
  pulse = false,
  className = ""
}) => {
  const variants = {
    primary: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    error: "bg-red-500",
    secondary: "bg-gray-500",
    dark: "bg-gray-800",
    light: "bg-gray-300"
  };

  const sizes = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
    xl: "w-5 h-5"
  };

  return (
    <span className={`inline-block rounded-full ${variants[variant]} ${sizes[size]} ${pulse ? 'animate-pulse' : ''} ${className}`} />
  );
};

/**
 * Generic Badge Component
 * Most flexible badge component
 */
export const Badge = ({ 
  children,
  variant = 'default',
  size = 'md',
  outline = false,
  rounded = 'full', // full, md, lg, none
  className = ""
}) => {
  const variants = {
    success: outline ? "bg-transparent text-green-700 border-green-300" : "bg-green-100 text-green-800 border-green-200",
    warning: outline ? "bg-transparent text-yellow-700 border-yellow-300" : "bg-yellow-100 text-yellow-800 border-yellow-200",
    danger: outline ? "bg-transparent text-red-700 border-red-300" : "bg-red-100 text-red-800 border-red-200",
    error: outline ? "bg-transparent text-red-700 border-red-300" : "bg-red-100 text-red-800 border-red-200",
    primary: outline ? "bg-transparent text-blue-700 border-blue-300" : "bg-blue-100 text-blue-800 border-blue-200",
    secondary: outline ? "bg-transparent text-gray-700 border-gray-300" : "bg-gray-100 text-gray-800 border-gray-200",
    info: outline ? "bg-transparent text-cyan-700 border-cyan-300" : "bg-cyan-100 text-cyan-800 border-cyan-200",
    dark: outline ? "bg-transparent text-gray-900 border-gray-400" : "bg-gray-800 text-white border-gray-700",
    light: outline ? "bg-transparent text-gray-600 border-gray-200" : "bg-white text-gray-700 border-gray-200",
    default: outline ? "bg-transparent text-gray-700 border-gray-300" : "bg-gray-100 text-gray-800 border-gray-200"
  };

  const sizes = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
    xl: "px-5 py-2.5 text-lg"
  };

  const roundedOptions = {
    none: "",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full"
  };

  return (
    <span className={`inline-flex items-center font-medium border ${variants[variant]} ${sizes[size]} ${roundedOptions[rounded]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;