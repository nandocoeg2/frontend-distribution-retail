import React from 'react';
import { FaceSmileIcon, HomeIcon, KeyIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const NotFound = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0'>
        <div className='absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow'></div>
        <div className='absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl'></div>
      </div>

      <div className='relative max-w-2xl w-full text-center'>
        {/* 404 Illustration */}
        <div className='mb-8'>
          <div className='relative inline-block'>
            <h1 className='text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4 animate-glow'>
              404
            </h1>
            <div className='absolute inset-0 text-9xl md:text-[12rem] font-bold text-blue-500/10 blur-sm'>
              404
            </div>
          </div>
        </div>

        <div className='bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 mb-8'>
          <div className='mb-6'>
            <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl shadow-2xl shadow-red-500/25 mb-6 animate-float'>
              <HeroIcon name='exclamation' className='w-10 h-10 text-white' />
            </div>
          </div>

          <h2 className='text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent mb-4'>
            Oops! Page Not Found
          </h2>

          <p className='text-slate-300 text-lg mb-8 leading-relaxed'>
            The page you're looking for seems to have wandered off into the
            digital void. Don't worry, it happens to the best of us!
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
            <div className='p-4 bg-white/5 rounded-2xl border border-white/10'>
              <div className='flex items-center space-x-3 mb-2'>
                <div className='w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                  <HomeIcon className='h-5 w-5 text-blue-400' aria-hidden='true' />
                </div>
                <h3 className='text-white font-semibold'>Go Home</h3>
              </div>
              <p className='text-slate-400 text-sm'>
                Return to your dashboard and continue your work
              </p>
            </div>

            <div className='p-4 bg-white/5 rounded-2xl border border-white/10'>
              <div className='flex items-center space-x-3 mb-2'>
                <div className='w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center'>
                  <KeyIcon className='h-5 w-5 text-green-400' aria-hidden='true' />
                </div>
                <h3 className='text-white font-semibold'>Sign In</h3>
              </div>
              <p className='text-slate-400 text-sm'>
                Access your account and manage your workspace
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <Link
              to='/dashboard'
              className='group relative w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25'
            >
              <div className='flex items-center space-x-2'>
                <HeroIcon name='home' className='w-5 h-5' />
                <span>Go to Dashboard</span>
                <HeroIcon name='arrow-right' className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
              </div>
            </Link>

            <Link
              to='/login'
              className='inline-flex items-center justify-center w-full py-4 px-6 border border-white/20 rounded-2xl text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200'
            >
              <div className='flex items-center space-x-2'>
                <HeroIcon name='login' className='w-5 h-5' />
                <span>Back to Sign In</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Fun fact section */}
        <div className='text-slate-400 text-sm'>
          <p className='mb-2 flex items-center gap-2'>
            <LightBulbIcon className='h-5 w-5 text-yellow-300' aria-hidden='true' />
            <strong>Did you know?</strong>
          </p>
          <p className='flex items-center gap-2'>
            <span>
              The HTTP 404 error was named after room 404 at CERN where the web
              was invented. Well, not really, but it sounds cool!
            </span>
            <FaceSmileIcon className='h-5 w-5 text-indigo-200' aria-hidden='true' />
          </p>
        </div>
      </div>

      {/* Floating elements */}
      <div className='absolute top-20 right-20 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75'></div>
      <div className='absolute bottom-40 left-20 w-3 h-3 bg-purple-400 rounded-full animate-bounce opacity-50'></div>
      <div className='absolute top-1/3 right-1/3 w-1 h-1 bg-indigo-400 rounded-full animate-pulse'></div>
    </div>
  );
};

export default NotFound;
