import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

const AutocompleteCheckboxLimitTag = ({
  options = [],
  value = [], // Array of selected values
  onChange,
  placeholder = 'Select...',
  label,
  required = false,
  disabled = false,
  displayKey = 'name',
  valueKey = 'id',
  name = null,
  limitTags = 2,
  loading = false,
  className = '',
  inputClassName = '',
  optionsClassName = '',
  tagClassName = '',
  size = 'default', // 'default' | 'small'
  fetchOnClose = false, // If true, only trigger onChange when dropdown closes
  sx = {}, // Style prop for width control
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [internalValues, setInternalValues] = useState([]); // Track selections internally
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null); // Ref for portal dropdown
  const hasOpenedRef = useRef(false); // Track if dropdown was opened
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Ensure value is always an array
  const externalValues = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value) return [value];
    return [];
  }, [value]);

  // Use internal values when fetchOnClose, otherwise use external
  const selectedValues = fetchOnClose ? internalValues : externalValues;

  // Sync internal values with external when dropdown opens or value changes externally
  useEffect(() => {
    if (!showOptions) {
      setInternalValues(externalValues);
    }
  }, [externalValues, showOptions]);

  // Get selected options objects
  const selectedOptions = useMemo(() => {
    return options.filter(opt => selectedValues.includes(opt[valueKey]));
  }, [options, selectedValues, valueKey]);

  // Filter options based on input
  useEffect(() => {
    if (inputValue) {
      const filtered = options.filter(option =>
        option[displayKey]?.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [inputValue, options, displayKey]);

  // Handle click outside - trigger onChange on close if fetchOnClose
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideWrapper = wrapperRef.current && wrapperRef.current.contains(event.target);
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

      if (!isInsideWrapper && !isInsideDropdown) {
        if (showOptions && fetchOnClose && hasOpenedRef.current) {
          // Trigger onChange when closing dropdown
          const valuesChanged = JSON.stringify(internalValues) !== JSON.stringify(externalValues);
          if (valuesChanged && onChange) {
            onChange({
              target: {
                name: name || 'autocomplete',
                value: internalValues,
              },
            });
          }
        }
        setShowOptions(false);
        setInputValue('');
        hasOpenedRef.current = false;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions, fetchOnClose, internalValues, externalValues, onChange, name]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowOptions(true);
  };

  const handleOptionToggle = (option) => {
    const optionValue = option[valueKey];
    let newValues;

    if (selectedValues.includes(optionValue)) {
      newValues = selectedValues.filter(v => v !== optionValue);
    } else {
      newValues = [...selectedValues, optionValue];
    }

    if (fetchOnClose) {
      // Only update internal state, don't trigger onChange yet
      setInternalValues(newValues);
    } else if (onChange) {
      onChange({
        target: {
          name: name || 'autocomplete',
          value: newValues,
        },
      });
    }
  };

  const handleRemoveTag = (e, optionValue) => {
    e.stopPropagation();
    const newValues = selectedValues.filter(v => v !== optionValue);
    if (fetchOnClose) {
      setInternalValues(newValues);
    } else if (onChange) {
      onChange({
        target: {
          name: name || 'autocomplete',
          value: newValues,
        },
      });
    }
  };

  const handleFocus = () => {
    setFilteredOptions(options);
    setShowOptions(true);
    hasOpenedRef.current = true;
    // Calculate dropdown position
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    if (fetchOnClose) {
      setInternalValues([]);
    } else if (onChange) {
      onChange({
        target: {
          name: name || 'autocomplete',
          value: [],
        },
      });
    }
    setInputValue('');
  };

  const isSmall = size === 'small';
  const visibleTags = selectedOptions.slice(0, limitTags);
  const hiddenCount = selectedOptions.length - limitTags;

  return (
    <div className={`relative ${className}`} ref={wrapperRef} style={sx}>
      {label && (
        <label className={`block font-medium text-gray-700 mb-1 ${isSmall ? 'text-xs' : 'text-sm'}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input container with tags */}
      <div
        className={`flex flex-wrap items-center gap-1 border border-gray-300 rounded-md bg-white cursor-text
          ${isSmall ? 'min-h-[28px] px-1 py-0.5' : 'min-h-[38px] px-2 py-1'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${showOptions ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          ${inputClassName}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Selected tags */}
        {visibleTags.map((option) => (
          <span
            key={option[valueKey]}
            className={`inline-flex items-center gap-0.5 bg-blue-100 text-blue-800 rounded
              ${isSmall ? 'px-1.5 py-0 text-xs' : 'px-2 py-0.5 text-sm'}
              ${tagClassName}`}
          >
            <span className="truncate max-w-[80px]">{option[displayKey]}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => handleRemoveTag(e, option[valueKey])}
                className="ml-0.5 hover:text-blue-600 focus:outline-none"
              >
                <svg className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </span>
        ))}

        {/* Hidden count badge */}
        {hiddenCount > 0 && (
          <span className={`text-gray-600 font-medium ${isSmall ? 'text-xs' : 'text-sm'}`}>
            +{hiddenCount}
          </span>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          disabled={disabled}
          className={`flex-1 outline-none bg-transparent
            ${isSmall ? 'text-xs py-0 min-w-[20px]' : 'text-sm py-0.5 min-w-[60px]'}`}
        />

        {/* Clear button */}
        {selectedOptions.length > 0 && !disabled && (
          <button
            type="button"
            onClick={handleClearAll}
            className="p-0.5 text-gray-400 hover:text-gray-600"
          >
            <svg className={`${isSmall ? 'w-3 h-3' : 'w-4 h-4'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Dropdown arrow */}
        <svg
          className={`text-gray-400 ${isSmall ? 'w-3 h-3' : 'w-4 h-4'} ${showOptions ? 'rotate-180' : ''} transition-transform`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown options - rendered via portal to avoid overflow clipping */}
      {showOptions && createPortal(
        <ul
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: isSmall ? 'auto' : dropdownPosition.width,
            minWidth: isSmall ? 100 : 150,
          }}
          className={`z-[9999] bg-white border border-gray-300 rounded-md shadow-lg 
            max-h-60 overflow-y-auto ${optionsClassName}`}
        >
          {loading ? (
            <li className={`flex items-center text-gray-500 ${isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading...
            </li>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option[valueKey]);
              return (
                <li
                  key={option[valueKey]}
                  onClick={() => handleOptionToggle(option)}
                  className={`flex items-center cursor-pointer
                    ${isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}
                    ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                >
                  {/* Checkbox */}
                  <div className={`flex items-center justify-center border rounded mr-2
                    ${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'}
                    ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={isSelected ? 'font-medium' : ''}>{option[displayKey]}</span>
                </li>
              );
            })
          ) : (
            <li className={`text-gray-500 ${isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}>
              No results found
            </li>
          )}
        </ul>,
        document.body
      )}
    </div>
  );
};

export default AutocompleteCheckboxLimitTag;
