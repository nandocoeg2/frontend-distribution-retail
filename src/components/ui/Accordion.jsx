import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Individual Accordion Item Component
 */
export const AccordionItem = ({ 
  title, 
  isExpanded, 
  onToggle, 
  children, 
  bgColor = "bg-white",
  headerBgColor = "bg-white",
  borderColor = "border-gray-200",
  hoverColor = "hover:bg-gray-50",
  disabled = false,
  icon = null,
  badge = null
}) => (
  <div className={`${bgColor} rounded-lg border ${borderColor} mb-4 overflow-hidden`}>
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={`w-full px-6 py-4 text-left ${headerBgColor} ${disabled ? 'cursor-not-allowed opacity-50' : `${hoverColor} cursor-pointer`} transition-colors flex items-center justify-between`}
    >
      <div className="flex items-center space-x-3">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {badge && badge}
      </div>
      {!disabled && (
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500 transition-transform" />
          )}
        </div>
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
 * Accordion Container Component
 * Manages multiple accordion items with optional single-open behavior
 */
export const Accordion = ({ 
  children, 
  allowMultiple = true, 
  defaultExpanded = [], 
  className = "" 
}) => {
  const [expandedItems, setExpandedItems] = useState(defaultExpanded);

  const handleToggle = (index) => {
    if (allowMultiple) {
      setExpandedItems(prev => 
        prev.includes(index) 
          ? prev.filter(item => item !== index)
          : [...prev, index]
      );
    } else {
      setExpandedItems(prev => 
        prev.includes(index) ? [] : [index]
      );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === AccordionItem) {
          return React.cloneElement(child, {
            isExpanded: expandedItems.includes(index),
            onToggle: () => handleToggle(index),
            key: index
          });
        }
        return child;
      })}
    </div>
  );
};

/**
 * Simple Accordion Section (for backward compatibility)
 */
export const AccordionSection = ({ 
  title, 
  isExpanded, 
  onToggle, 
  children, 
  bgColor = "bg-white",
  icon = null,
  badge = null
}) => (
  <AccordionItem
    title={title}
    isExpanded={isExpanded}
    onToggle={onToggle}
    bgColor={bgColor}
    icon={icon}
    badge={badge}
  >
    {children}
  </AccordionItem>
);

export default Accordion;