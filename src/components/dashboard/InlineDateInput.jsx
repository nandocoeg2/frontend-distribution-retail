import React from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const InlineDateInput = ({
  value,
  onChange = () => {},
  placeholder = 'dd/mm/yyyy',
  readOnly = false,
  disabled = false,
  className = '',
}) => {
  const inputClasses =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200';

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type='text'
        inputMode='numeric'
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        readOnly={readOnly}
        disabled={disabled}
        className={`${inputClasses} pr-9 ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      />
      <CalendarDaysIcon
        className='absolute right-2 h-4 w-4 text-gray-400'
        aria-hidden='true'
      />
    </div>
  );
};

export default InlineDateInput;
