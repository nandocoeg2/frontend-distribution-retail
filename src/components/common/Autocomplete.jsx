import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Autocomplete = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  displayKey = 'name',
  valueKey = 'id',
  name = null,
  onSearch = null, // Function to call when searching (for dynamic search)
  onFocus = null, // Function to call when input is focused
  searchDelay = 300, // Delay in ms before calling onSearch
  loading = false, // External loading state
  showId = false, // Whether to show ID as subtitle
  className = '',
  inputClassName = '',
  optionsClassName = '',
  optionClassName = 'px-3 py-2 cursor-pointer hover:bg-gray-100',
  emptyStateClassName = 'px-3 py-2 text-gray-500',
  searchingClassName = 'px-3 py-2 text-gray-500',
  dropdownPosition = 'absolute' // 'absolute' | 'static'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Only update inputValue when value changes, not when options change
  useEffect(() => {
    if (!value || value === '') {
      return;
    }
    const selectedOption = options.find(option => String(option[valueKey]) === String(value));
    if (selectedOption) {
      setInputValue(selectedOption[displayKey] || '');
    }
  }, [value, displayKey, valueKey]);

  // Sync display when options arrive and we have a selected value
  useEffect(() => {
    if (value && options.length > 0) {
      const selectedOption = options.find(option => String(option[valueKey]) === String(value));
      if (selectedOption) {
        setInputValue(selectedOption[displayKey] || '');
      }
    }
  }, [options, value, displayKey, valueKey]);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  // Recalculate dropdown position whenever it's shown or on scroll/resize
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  };

  useEffect(() => {
    if (showOptions) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
    }
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [showOptions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setInputValue(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (onSearch && query) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          await onSearch(query);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      }, searchDelay);
    } else {
      if (query) {
        const filtered = options.filter(option =>
          option[displayKey].toLowerCase().includes(query.toLowerCase())
        );
        setFilteredOptions(filtered);
      } else {
        setFilteredOptions(options);
      }
    }

    setShowOptions(true);

    if (query === '') {
      onChange({ target: { name: name || e.target.name, value: '' } });
    }
  };

  const handleOptionClick = (option) => {
    const selectedValue = option[valueKey];
    setInputValue(option[displayKey] || '');
    setShowOptions(false);

    if (onChange) {
      onChange({
        target: {
          name: name || (wrapperRef.current?.querySelector('input')?.name) || '',
          value: selectedValue
        }
      });
    }
  };

  const handleFocus = () => {
    setFilteredOptions(options);
    setShowOptions(true);

    if (onFocus) {
      onFocus();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const dropdown = showOptions && dropdownPosition === 'absolute' ? (
    createPortal(
      <ul
        style={dropdownStyle}
        className={`border rounded-md max-h-60 overflow-y-auto shadow-lg ${optionsClassName || 'bg-white border-gray-300'}`}
      >
        {isSearching || loading ? (
          <li className={searchingClassName}>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Searching...
            </div>
          </li>
        ) : filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <li
              key={option[valueKey]}
              onMouseDown={(e) => {
                // Use onMouseDown to fire before onBlur closes the dropdown
                e.preventDefault();
                handleOptionClick(option);
              }}
              className={optionClassName}
            >
              <div className="font-medium">{option[displayKey]}</div>
              {showId && option.id && (
                <div className="text-sm text-gray-500">{option.id}</div>
              )}
            </li>
          ))
        ) : (
          <li className={emptyStateClassName}>No results found</li>
        )}
      </ul>,
      document.body
    )
  ) : showOptions && dropdownPosition === 'static' ? (
    <ul
      className={`w-full border rounded-md max-h-60 overflow-y-auto shadow-lg relative mt-2 ${optionsClassName || 'bg-white border-gray-300'}`}
    >
      {isSearching || loading ? (
        <li className={searchingClassName}>
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Searching...
          </div>
        </li>
      ) : filteredOptions.length > 0 ? (
        filteredOptions.map((option) => (
          <li
            key={option[valueKey]}
            onMouseDown={(e) => {
              e.preventDefault();
              handleOptionClick(option);
            }}
            className={optionClassName}
          >
            <div className="font-medium">{option[displayKey]}</div>
            {showId && option.id && (
              <div className="text-sm text-gray-500">{option.id}</div>
            )}
          </li>
        ))
      ) : (
        <li className={emptyStateClassName}>No results found</li>
      )}
    </ul>
  ) : null;

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && ' *'}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={inputValue || ''}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required && !value}
        disabled={disabled}
        name={name || label?.toLowerCase().replace(/\s+/g, '_') || 'autocomplete'}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${inputClassName}`}
      />
      {dropdown}
    </div>
  );
};

export default Autocomplete;
