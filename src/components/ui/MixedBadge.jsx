import React from 'react';
import { Badge } from './Badge';

/**
 * Badge to indicate a mixed carton box
 */
const MixedBadge = ({ className = '' }) => {
  return (
    <Badge 
      variant="warning" 
      className={`inline-flex items-center gap-1 ${className}`}
    >
      <svg 
        className="h-3 w-3" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
        />
      </svg>
      MIXED
    </Badge>
  );
};

export default MixedBadge;
