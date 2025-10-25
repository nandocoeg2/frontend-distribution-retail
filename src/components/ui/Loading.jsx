import React from 'react';

/**
 * Spinner Component
 * Basic loading spinner
 */
export const Spinner = ({ 
  size = "md",
  color = "blue",
  className = ""
}) => {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
    "2xl": "w-16 h-16"
  };

  const colors = {
    blue: "border-blue-600",
    green: "border-green-600",
    red: "border-red-600",
    yellow: "border-yellow-600",
    purple: "border-purple-600",
    pink: "border-pink-600",
    gray: "border-gray-600",
    white: "border-white"
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-t-transparent ${sizes[size]} ${colors[color]} ${className}`} />
  );
};

/**
 * Loading Dots Component
 * Three dots animation
 */
export const LoadingDots = ({ 
  size = "md",
  color = "blue",
  className = ""
}) => {
  const sizes = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3"
  };

  const colors = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-600",
    yellow: "bg-yellow-600",
    purple: "bg-purple-600",
    gray: "bg-gray-600",
    white: "bg-white"
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className={`${sizes[size]} ${colors[color]} rounded-full animate-pulse`} style={{ animationDelay: '0ms' }} />
      <div className={`${sizes[size]} ${colors[color]} rounded-full animate-pulse`} style={{ animationDelay: '150ms' }} />
      <div className={`${sizes[size]} ${colors[color]} rounded-full animate-pulse`} style={{ animationDelay: '300ms' }} />
    </div>
  );
};

/**
 * Progress Bar Component
 * Linear progress indicator
 */
export const ProgressBar = ({ 
  value = 0,
  max = 100,
  size = "md",
  color = "blue",
  showLabel = false,
  label = null,
  animated = false,
  className = ""
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    xs: "h-1",
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
    xl: "h-6"
  };

  const colors = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-600",
    yellow: "bg-yellow-600",
    purple: "bg-purple-600",
    pink: "bg-pink-600",
    gray: "bg-gray-600"
  };

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{label || "Loading..."}</span>
          {showLabel && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div 
          className={`h-full ${colors[color]} transition-all duration-300 ease-out ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Circular Progress Component
 * Circular progress indicator
 */
export const CircularProgress = ({ 
  value = 0,
  max = 100,
  size = 64,
  strokeWidth = 6,
  color = "blue",
  showLabel = false,
  className = ""
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = {
    blue: "stroke-blue-600",
    green: "stroke-green-600",
    red: "stroke-red-600",
    yellow: "stroke-yellow-600",
    purple: "stroke-purple-600",
    pink: "stroke-pink-600",
    gray: "stroke-gray-600"
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-300 ease-out ${colors[color]}`}
        />
      </svg>
      {showLabel && (
        <div className="absolute text-sm font-semibold">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton Component
 * Placeholder loading state
 */
export const Skeleton = ({ 
  width = "100%",
  height = "1rem",
  rounded = "md",
  animated = true,
  className = ""
}) => {
  const roundedOptions = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full"
  };

  return (
    <div 
      className={`bg-gray-200 ${roundedOptions[rounded]} ${animated ? 'animate-pulse' : ''} ${className}`}
      style={{ width, height }}
    />
  );
};

/**
 * Loading State Component
 * Complete loading state with message
 */
export const LoadingState = ({ 
  message = "Loading...",
  type = "spinner", // spinner, dots, progress
  size = "md",
  color = "blue",
  vertical = true,
  className = ""
}) => {
  const renderLoader = () => {
    switch (type) {
      case "dots":
        return <LoadingDots size={size} color={color} />;
      case "progress":
        return <ProgressBar animated color={color} className="w-32" />;
      default:
        return <Spinner size={size} color={color} />;
    }
  };

  return (
    <div className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center justify-center ${vertical ? 'space-y-4' : 'space-x-4'} ${className}`}>
      {renderLoader()}
      {message && (
        <p className="text-gray-500 text-sm font-medium">
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * Page Loading Component
 * Full page loading overlay
 */
export const PageLoading = ({ 
  message = "Loading...",
  type = "spinner",
  backdrop = true,
  className = ""
}) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${backdrop ? 'bg-white bg-opacity-75' : ''} ${className}`}>
      <LoadingState 
        message={message}
        type={type}
        size="lg"
        vertical={true}
      />
    </div>
  );
};

/**
 * Card Loading Component
 * Loading state for cards
 */
export const CardLoading = ({ 
  lines = 3,
  showAvatar = false,
  className = ""
}) => {
  return (
    <div className={`p-6 ${className}`}>
      <div className="animate-pulse">
        {showAvatar && (
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton width="3rem" height="3rem" rounded="full" />
            <div className="space-y-2 flex-1">
              <Skeleton width="60%" height="1rem" />
              <Skeleton width="40%" height="0.75rem" />
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton 
              key={index}
              width={index === lines - 1 ? "75%" : "100%"}
              height="1rem"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Table Loading Component
 * Loading state for tables
 */
export const TableLoading = ({ 
  rows = 5,
  columns = 4,
  className = ""
}) => {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 py-4 border-b border-gray-100">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex}
                width={colIndex === 0 ? "25%" : "100%"}
                height="1rem"
                className="flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Simple Loading Component (Default Export)
 * For backward compatibility
 */
const Loading = ({ className = "" }) => {
  return (
    <div className={`flex justify-center items-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default Loading;