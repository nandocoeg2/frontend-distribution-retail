import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
      <div className='max-w-md w-full text-center'>
        <div className='mb-8'>
          <h1 className='text-9xl font-bold text-blue-600 mb-4'>404</h1>
          <h2 className='text-3xl font-bold text-gray-900 mb-4'>
            Page Not Found
          </h2>
          <p className='text-gray-600 mb-8'>
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className='space-y-4'>
          <Link
            to='/dashboard'
            className='inline-block w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200'
          >
            Go to Dashboard
          </Link>
          <Link
            to='/login'
            className='inline-block w-full py-3 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200'
          >
            Back to Login
          </Link>
        </div>

        <div className='mt-8'>
          <div className='text-gray-400'>
            <svg
              className='w-32 h-32 mx-auto mb-4 opacity-50'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <p className='text-sm'>Error 404 - Page Not Found</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
