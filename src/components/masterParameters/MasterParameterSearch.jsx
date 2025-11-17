import React from 'react';

const MasterParameterSearch = ({ searchQuery, handleSearchChange, searchLoading }) => {
  return (
    <div className='mb-4'>
      <div className='relative'>
        <input
          type='text'
          placeholder='Search by key, value, or description...'
          value={searchQuery}
          onChange={handleSearchChange}
          className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          {searchLoading ? (
            <div className='animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent'></div>
          ) : (
            <svg
              className='h-4 w-4 text-gray-400'
              fill='none'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterParameterSearch;
