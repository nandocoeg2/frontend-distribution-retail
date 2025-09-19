import React from 'react';

const Pagination = ({ pagination, onPageChange, onLimitChange }) => {
  // Provide default values if pagination is undefined
  const {
    page: currentPage = 1,
    totalPages = 1,
    total: totalItems = 0,
    limit: itemsPerPage = 10
  } = pagination || {};

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
      
      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          className={`px-3 py-1 mx-1 rounded-md ${
            i === currentPage
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
          value={itemsPerPage}
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
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </span>
      </div>

      <div className='flex items-center'>
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className='px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Previous
        </button>
        
        {renderPageNumbers()}

        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;

