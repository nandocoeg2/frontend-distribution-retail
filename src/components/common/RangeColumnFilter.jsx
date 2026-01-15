import React, { useState, useEffect } from 'react';

const RangeColumnFilter = ({ column, setPage }) => {
    const filterValue = column.getFilterValue() || { min: '', max: '' };
    const [localMin, setLocalMin] = useState(filterValue.min ?? '');
    const [localMax, setLocalMax] = useState(filterValue.max ?? '');

    useEffect(() => { setLocalMin(filterValue.min ?? ''); }, [filterValue.min]);
    useEffect(() => { setLocalMax(filterValue.max ?? ''); }, [filterValue.max]);

    const handleKeyDownMin = (e) => {
        if (e.key === 'Enter') {
            column.setFilterValue({ ...filterValue, min: localMin });
            if (setPage) setPage(1);
        }
    };

    const handleKeyDownMax = (e) => {
        if (e.key === 'Enter') {
            column.setFilterValue({ ...filterValue, max: localMax });
            if (setPage) setPage(1);
        }
    };

    return (
        <div className="flex flex-col gap-0.5">
            <input
                type="number"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                onKeyDown={handleKeyDownMin}
                placeholder="Min"
                className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
            />
            <input
                type="number"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                onKeyDown={handleKeyDownMax}
                placeholder="Max"
                className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};

export default RangeColumnFilter;
