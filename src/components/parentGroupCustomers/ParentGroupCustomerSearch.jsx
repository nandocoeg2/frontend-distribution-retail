import React from 'react';

const ParentGroupCustomerSearch = ({ searchQuery, handleSearchChange, searchLoading }) => {
    return (
        <div className='mb-2'>
            <div className='relative'>
                <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className='w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Cari berdasarkan kode atau nama parent group...'
                />
                {searchLoading && (
                    <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentGroupCustomerSearch;
