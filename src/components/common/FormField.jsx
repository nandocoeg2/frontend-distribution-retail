import React from 'react';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = '',
  helperText = '',
  leading = null,
  trailing = null,
  min,
  max,
  step,
  inputMode,
  autoComplete = 'off'
}) => {
  const fieldId = name || label;
  const hasLeading = Boolean(leading);
  const hasTrailing = Boolean(trailing);

  return (
    <label className="block text-sm">
      {label ? (
        <span className="font-medium text-gray-700">
          {label}
          {required ? <span className="text-red-500">*</span> : null}
        </span>
      ) : null}
      <div className="mt-1 relative rounded-md shadow-sm">
        {hasLeading ? (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leading}
          </div>
        ) : null}
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={`block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            hasLeading ? 'pl-10' : ''
          } ${hasTrailing ? 'pr-10' : ''} disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />
        {hasTrailing ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            {trailing}
          </div>
        ) : null}
      </div>
      {helperText ? (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      ) : null}
    </label>
  );
};

export default FormField;

