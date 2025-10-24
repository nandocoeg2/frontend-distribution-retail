import React, { useState, useEffect, useRef } from 'react';

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
  const wrapperRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!value) {
      return;
    }

    const selectedOption = options.find(option => option[valueKey] === value);
    if (selectedOption) {
      setInputValue(selectedOption[displayKey]);
    }
  }, [value, options, displayKey, valueKey]);

  useEffect(() => {
    if (!value) {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setInputValue(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If there's a search function, use dynamic search
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
      // Local filtering
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
    
    // Clear the actual value if the input is cleared
    if (query === '') {
      onChange({ target: { name: name || e.target.name, value: '' } });
    }
  };

  const handleOptionClick = (option) => {
    setInputValue(option[displayKey]);
    setShowOptions(false);
    onChange({ target: { name: name || wrapperRef.current.querySelector('input').name, value: option[valueKey] } });
  };

  const handleFocus = () => {
    setFilteredOptions(options);
    setShowOptions(true);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && ' *'}
        </label>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required && !value}
        disabled={disabled}
        name={name || label.toLowerCase().replace(/\s+/g, '_')} // Use provided name or generate one
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${inputClassName}`}
      />
      {showOptions && (
        <ul
          className={`w-full bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto shadow-lg ${
            dropdownPosition === 'absolute'
              ? 'absolute z-10 mt-1'
              : 'relative mt-2'
          } ${optionsClassName}`}
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
                onClick={() => handleOptionClick(option)}
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
      )}
    </div>
  );
};

export default Autocomplete;

