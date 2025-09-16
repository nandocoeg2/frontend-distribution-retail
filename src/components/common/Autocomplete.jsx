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
  valueKey = 'id'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const selectedOption = options.find(option => option[valueKey] === value);
      if (selectedOption) {
        setInputValue(selectedOption[displayKey]);
      }
    } else {
      setInputValue('');
    }
  }, [value, options, displayKey, valueKey]);

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
    
    if (query) {
      const filtered = options.filter(option =>
        option[displayKey].toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowOptions(true);
    } else {
      setFilteredOptions(options);
      setShowOptions(true);
    }
    
    // Clear the actual value if the input is cleared
    if (query === '') {
      onChange({ target: { name: e.target.name, value: '' } });
    }
  };

  const handleOptionClick = (option) => {
    setInputValue(option[displayKey]);
    setShowOptions(false);
    onChange({ target: { name: wrapperRef.current.querySelector('input').name, value: option[valueKey] } });
  };

  const handleFocus = () => {
    setFilteredOptions(options);
    setShowOptions(true);
  };

  return (
    <div className="relative" ref={wrapperRef}>
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
        name={label.toLowerCase().replace(/\s+/g, '_')} // Generate a name for the input
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredOptions.map((option) => (
            <li
              key={option[valueKey]}
              onClick={() => handleOptionClick(option)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              {option[displayKey]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;

