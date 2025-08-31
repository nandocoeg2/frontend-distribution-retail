import React from 'react';

const CustomerSearch = ({ searchQuery, handleSearchChange, searchLoading }) => {
  return (
    <div className='mb-4 relative'>
      <input
        type='text'
        placeholder='Search customers...'
        value={searchQuery}
        onChange={handleSearchChange}
        className='w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
      />
      <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
        <svg 
          className='h-5 w-5 text-gray-400' 
          fill='none' 
          strokeLinecap='round' 
          strokeLinejoin='round' 
          strokeWidth='2' 
          viewBox='0 0 24 24' 
          stroke='currentColor'
        >
          <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
        </svg>
      </div>
      {searchLoading && (
        <div className='flex items-center mt-2 text-sm text-gray-600'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2'></div>
          Searching...
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;

