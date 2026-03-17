import React from 'react';

const CustomerSearch = ({ searchQuery, handleSearchChange, handleSearchSubmit, searchLoading }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    handleSearchSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} className='relative w-full mb-2'>
      <input
        type='text'
        placeholder='Search customers, lalu tekan Enter'
        value={searchQuery}
        onChange={handleSearchChange}
        className='w-full rounded-md border border-gray-300 px-3 py-1.5 pr-9 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500'
      />
      <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400'>
        {searchLoading ? (
          <div className='h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-blue-600 border-t-transparent'></div>
        ) : (
          <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
          </svg>
        )}
      </div>
    </form>
  );
};

export default CustomerSearch;
