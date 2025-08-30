import React from 'react';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Analytics = () => {
  return (
    <>
      {/* Header */}
      <header className='bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60 p-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 mb-1 flex items-center'>
            Analytics Dashboard{' '}
            <HeroIcon name='chart-bar' className='w-8 h-8 text-blue-600 ml-2' />
          </h1>
          <p className='text-gray-600'>
            View detailed analytics and performance metrics
          </p>
        </div>
      </header>

      {/* Content */}
      <main className='flex-1 overflow-y-auto p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Page Views
              </h3>
              <div className='text-3xl font-bold text-blue-600 mb-2'>
                125,430
              </div>
              <p className='text-sm text-green-600'>
                ↗ +15.3% from last month
              </p>
            </div>

            <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Unique Visitors
              </h3>
              <div className='text-3xl font-bold text-purple-600 mb-2'>
                8,240
              </div>
              <p className='text-sm text-green-600'>↗ +8.7% from last month</p>
            </div>

            <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Bounce Rate
              </h3>
              <div className='text-3xl font-bold text-orange-600 mb-2'>
                32.1%
              </div>
              <p className='text-sm text-red-600'>↘ -2.4% from last month</p>
            </div>
          </div>

          <div className='mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-6'>
              Traffic Analytics
            </h3>
            <div className='h-64 flex items-center justify-center bg-gray-50 rounded-xl'>
              <p className='text-gray-500'>
                Chart placeholder - Analytics data would be displayed here
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Analytics;
