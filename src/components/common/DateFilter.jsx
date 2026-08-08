import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker/dist/react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const DateFilter = ({ value, onChange, placeholder = "Pilih tanggal..." }) => {
    const [dateValue, setDateValue] = useState(value ?? '');

    useEffect(() => {
        setDateValue(value ?? '');
    }, [value]);

    const handleDateChange = (date) => {
        if (!date) {
            setDateValue('');
            onChange('');
            return;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        setDateValue(formattedDate);
        onChange(formattedDate);
    };

    return (
        <div className="flex items-center border border-gray-300 rounded bg-white focus-within:ring-1 focus-within:ring-blue-500">
            <DatePicker
                selected={dateValue ? new Date(dateValue) : null}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText={placeholder}
                className="w-[100px] px-2 py-1 text-xs border-none focus:ring-0 focus:outline-none bg-transparent"
                wrapperClassName="w-full"
                popperClassName="!z-[9999]"
                calendarClassName="!text-xs !p-2 shadow-lg border border-gray-200 [&_.react-datepicker__day--outside-month]:!text-gray-300"
                dayClassName={() => "!text-xs !w-6 !h-6 !leading-6"}
                withPortal={false}
                popperPlacement="bottom-start"
                popperProps={{
                    strategy: 'fixed',
                }}
            />
        </div>
    );
};

export default DateFilter;
