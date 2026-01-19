import React, { useState, useEffect } from 'react';

const TextColumnFilter = ({ column, placeholder = "Filter...", className }) => {
    const filterValue = column.getFilterValue();
    const [value, setValue] = useState(filterValue ?? '');

    useEffect(() => {
        setValue(filterValue ?? '');
    }, [filterValue]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            column.setFilterValue(value);
        }
    };

    return (
        <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className || "w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"}
            onClick={(e) => e.stopPropagation()}
        />
    );
};

export default TextColumnFilter;
