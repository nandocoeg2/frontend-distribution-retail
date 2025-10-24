import React, { useState } from 'react';
import { BoltIcon } from '@heroicons/react/24/outline';

import { Link } from 'react-router-dom';

import useLogin from '../hooks/useLogin';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import Autocomplete from '../components/common/Autocomplete.jsx';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    formData,
    errors,
    isLoading,
    companyOptions,
    isCompanyLoading,
    handleInputChange,
    handleSubmit,
    handleCompanySearch,
  } = useLogin();

  return (
    <div className='relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800'>
      {/* Background Elements */}
      <div className='absolute inset-0'>
        <div className='absolute rounded-full top-20 left-20 w-72 h-72 bg-blue-500/10 blur-3xl'></div>
        <div className='absolute rounded-full bottom-20 right-20 w-96 h-96 bg-purple-500/10 blur-3xl'></div>
        <div className='absolute w-64 h-64 transform -translate-x-1/2 -translate-y-1/2 rounded-full top-1/2 left-1/2 bg-indigo-500/5 blur-2xl'></div>
      </div>

      <div className='relative w-full max-w-md'>
        {/* Logo/Brand Section */}
        <div className='mb-8 text-center'>
          <div className='inline-flex items-center justify-center w-16 h-16 mb-6 shadow-2xl bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-blue-500/25'>
            <BoltIcon className='w-8 h-8 text-white' aria-hidden='true' />
          </div>
          <h1 className='mb-2 text-4xl font-bold text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text'>
            Welcome Back
          </h1>
          <p className='text-lg text-slate-400'>Sign in to your workspace</p>
        </div>

        {/* Login Form */}
        <div className='p-8 border shadow-2xl bg-white/10 backdrop-blur-xl rounded-3xl border-white/20'>
          {errors.general && (
            <div className='p-4 mb-6 text-red-200 border bg-red-500/20 border-red-500/30 rounded-2xl backdrop-blur-sm'>
              <div className='flex items-center space-x-2'>
                <HeroIcon name='exclamation-circle' className='w-5 h-5' />
                <span className='font-medium'>{errors.general}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label
                htmlFor='username'
                className='block mb-3 text-sm font-semibold text-white'
              >
                Username
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none'>
                  <HeroIcon
                    name='user-circle'
                    className='w-5 h-5 text-slate-400'
                  />
                </div>
                <input
                  type='text'
                  id='username'
                  name='username'
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange('username', e.target.value)
                  }
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
                    errors.username ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder='Masukkan username'
                />
              </div>
              {errors.username && (
                <p className='mt-2 text-sm text-red-300'>{errors.username}</p>
              )}
            </div>

            <div>
              <label
                htmlFor='companyId'
                className='block mb-3 text-sm font-semibold text-white'
              >
                Perusahaan
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none'>
                  <HeroIcon
                    name='building-office-2'
                    className='w-5 h-5 text-slate-400'
                  />
                </div>
                <Autocomplete
                  options={companyOptions}
                  value={formData.companyId}
                  onChange={(event) =>
                    handleInputChange('companyId', event.target.value)
                  }
                  onSearch={handleCompanySearch}
                  loading={isCompanyLoading}
                  placeholder='Cari dan pilih perusahaan'
                  label=''
                  displayKey='displayName'
                  valueKey='id'
                  name='companyId'
                  className={`w-full border rounded-2xl bg-white/10 backdrop-blur-sm transition-all duration-200 ${
                    errors.companyId
                      ? 'border-red-500/50 focus-within:ring-2 focus-within:ring-red-500/40'
                      : 'border-white/20 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50'
                  }`}
                  inputClassName='pl-12 pr-4 py-4 bg-transparent border-none text-white placeholder-slate-400 focus:ring-0 focus:outline-none'
                  optionsClassName='bg-slate-900/95 border-white/20 text-white backdrop-blur-xl'
                  optionClassName='px-4 py-3 cursor-pointer hover:bg-slate-700/60'
                  emptyStateClassName='px-4 py-3 text-slate-300'
                  searchingClassName='px-4 py-3 text-slate-300'
                  dropdownPosition='static'
                />
              </div>
              {errors.companyId && (
                <p className='mt-2 text-sm text-red-300'>{errors.companyId}</p>
              )}
            </div>

            <div>
              <label
                htmlFor='password'
                className='block mb-3 text-sm font-semibold text-white'
              >
                Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none'>
                  <HeroIcon
                    name='lock-closed'
                    className='w-5 h-5 text-slate-400'
                  />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  required
                  className={`w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
                    errors.password ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder='Enter your password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 flex items-center pr-4 transition-colors text-slate-400 hover:text-white'
                >
                  {showPassword ? (
                    <HeroIcon name='eye-slash' className='w-5 h-5' />
                  ) : (
                    <HeroIcon name='eye' className='w-5 h-5' />
                  )}{' '}
                </button>
              </div>
              {errors.password && (
                <p className='mt-2 text-sm text-red-300'>{errors.password}</p>
              )}
            </div>

            <div>
              <button
                type='submit'
                disabled={isLoading}
                className='group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25'
              >
                {isLoading ? (
                  <div className='flex items-center space-x-2'>
                    <HeroIcon
                      name='arrow-path'
                      className='w-5 h-5 text-white animate-spin'
                    />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className='flex items-center space-x-2'>
                    <span>Sign In to Dashboard</span>
                    <HeroIcon
                      name='arrow-right'
                      className='w-4 h-4 transition-transform group-hover:translate-x-1'
                    />
                  </div>
                )}
              </button>
            </div>
          </form>

          <div className='mt-8 text-center'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-white/20'></div>
              </div>
              <div className='relative flex justify-center text-sm'></div>
            </div>

            <div className='mt-6'>
              <Link
                to='/register'
                className='inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 border border-white/20 rounded-2xl text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              >
                Create your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
