import React from 'react';

const App = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header Section */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            Hello Electron + React + Tailwind ⚡
          </h1>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Edit{' '}
            <code className='bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600'>
              App.jsx
            </code>{' '}
            and see Hot Reload in action!
          </p>
        </div>

        {/* Feature Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300'>
            <div className='text-blue-500 mb-4'>
              <svg
                className='w-8 h-8'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Electron
            </h3>
            <p className='text-gray-600'>
              Cross-platform desktop apps with web technologies
            </p>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300'>
            <div className='text-blue-500 mb-4'>
              <svg
                className='w-8 h-8'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>React</h3>
            <p className='text-gray-600'>
              Modern UI library with component-based architecture
            </p>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300'>
            <div className='text-blue-500 mb-4'>
              <svg
                className='w-8 h-8'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4'
                />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Tailwind CSS
            </h3>
            <p className='text-gray-600'>
              Utility-first CSS framework for rapid UI development
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='text-center space-x-4'>
          <button className='bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg'>
            Get Started
          </button>
          <button className='border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors duration-200 bg-white hover:bg-gray-50'>
            Learn More
          </button>
        </div>

        {/* Status Badge */}
        <div className='mt-8 text-center'>
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
            <svg
              className='w-4 h-4 mr-1'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            Tailwind CSS is working perfectly!
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;
