import React from 'react';

const Pagination = ({ pagination, onPageChange, onLimitChange }) => {
  const { page, totalPages, total, limit } = pagination;

  const handlePageClick = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const handleLimitSelect = (e) => {
    onLimitChange(Number(e.target.value));
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
      
      if (page <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (page + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = page - maxPagesBeforeCurrent;
        endPage = page + maxPagesAfterCurrent;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          className={`px-3 py-1 mx-1 rounded-md ${
            i === page
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className='flex justify-between items-center px-4 py-3 border-t border-gray-200'>
      <div className='flex items-center space-x-2'>
        <span className='text-sm text-gray-700'>Rows per page:</span>
        <select
          value={limit}
          onChange={handleLimitSelect}
          className='px-2 py-1 border border-gray-300 rounded-md text-sm'
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className='text-sm text-gray-700'>
          Showing {Math.min((page - 1) * limit + 1, total)} - {Math.min(page * limit, total)} of {total}
        </span>
      </div>

      <div className='flex items-center'>
        <button
          onClick={() => handlePageClick(page - 1)}
          disabled={page === 1}
          className='px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Previous
        </button>
        
        {renderPageNumbers()}

        <button
          onClick={() => handlePageClick(page + 1)}
          disabled={page === totalPages}
          className='px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;

