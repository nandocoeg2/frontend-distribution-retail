import React, { useState } from 'react';
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
    handleCompanyFocus,
  } = useLogin();

  return (
    <div className='relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/60'>
      {/* Soft Background Glowing Elements */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute rounded-full -top-24 -left-24 w-96 h-96 bg-blue-200/40 blur-3xl'></div>
        <div className='absolute rounded-full -bottom-24 -right-24 w-96 h-96 bg-indigo-200/30 blur-3xl'></div>
        <div className='absolute w-80 h-80 transform -translate-x-1/2 -translate-y-1/2 rounded-full top-1/2 left-1/2 bg-blue-100/30 blur-2xl'></div>
      </div>

      <div className='relative w-full max-w-md'>
        {/* Brand Section */}
        <div className='mb-8 text-center'>
          <div className='inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shadow-sm'>
            <HeroIcon name='building-office-2' className='w-7 h-7 text-blue-600' />
          </div>
          <h1 className='text-3xl font-extrabold tracking-tight text-slate-900 mb-1'>
            Welcome Back
          </h1>
          <p className='text-sm font-medium text-slate-500'>Sign in to your workspace</p>
        </div>

        {/* Login Form Card */}
        <div className='p-8 sm:p-10 border shadow-xl shadow-slate-200/40 bg-white/90 backdrop-blur-xl rounded-3xl border-slate-200/80'>
          {errors.general && (
            <div className='p-4 mb-6 text-sm text-red-700 border bg-red-50 border-red-200/80 rounded-2xl flex items-center space-x-2 shadow-xs'>
              <HeroIcon name='exclamation-circle' className='w-5 h-5 text-red-500 shrink-0' />
              <span className='font-medium'>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label
                htmlFor='username'
                className='block mb-2 text-sm font-semibold text-slate-700'
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
                  className={`w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.username
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200/90 focus:ring-blue-500/20 focus:border-blue-600 hover:border-slate-300'
                  }`}
                  placeholder='Masukkan username'
                />
              </div>
              {errors.username && (
                <p className='mt-1.5 text-sm text-red-600 font-medium'>{errors.username}</p>
              )}
            </div>

            <div>
              <label
                htmlFor='companyId'
                className='block mb-2 text-sm font-semibold text-slate-700'
              >
                Perusahaan
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10'>
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
                  onFocus={handleCompanyFocus}
                  loading={isCompanyLoading}
                  placeholder='Cari dan pilih perusahaan'
                  label=''
                  displayKey='displayName'
                  valueKey='id'
                  name='companyId'
                  className={`w-full border rounded-2xl bg-slate-50/80 transition-all duration-200 ${
                    errors.companyId
                      ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500'
                      : 'border-slate-200/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600 hover:border-slate-300'
                  }`}
                  inputClassName='pl-11 pr-4 py-3.5 bg-transparent border-none text-slate-900 placeholder-slate-400 focus:ring-0 focus:outline-none'
                  optionsClassName='!bg-white border border-slate-200 text-slate-800 shadow-xl rounded-2xl mt-1 overflow-hidden z-50'
                  optionClassName='px-4 py-3 cursor-pointer transition-all duration-150 hover:!bg-blue-50 hover:!text-blue-700 font-medium text-slate-700'
                  emptyStateClassName='px-4 py-3 text-slate-400 text-sm'
                  searchingClassName='px-4 py-3 text-slate-400 text-sm'
                  dropdownPosition='static'
                />
              </div>
              {errors.companyId && (
                <p className='mt-1.5 text-sm text-red-600 font-medium'>{errors.companyId}</p>
              )}
            </div>

            <div>
              <label
                htmlFor='password'
                className='block mb-2 text-sm font-semibold text-slate-700'
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
                  className={`w-full pl-11 pr-12 py-3.5 bg-slate-50/80 border rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200/90 focus:ring-blue-500/20 focus:border-blue-600 hover:border-slate-300'
                  }`}
                  placeholder='Enter your password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 flex items-center pr-4 transition-colors text-slate-400 hover:text-slate-600'
                >
                  {showPassword ? (
                    <HeroIcon name='eye-slash' className='w-5 h-5' />
                  ) : (
                    <HeroIcon name='eye' className='w-5 h-5' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='mt-1.5 text-sm text-red-600 font-medium'>{errors.password}</p>
              )}
            </div>

            <div>
              <button
                type='submit'
                disabled={isLoading}
                className='group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-600/20 transform hover:-translate-y-0.5 active:translate-y-0'
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
            <div className='relative mb-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-slate-200'></div>
              </div>
              <div className='relative flex justify-center text-xs uppercase tracking-wider text-slate-400 font-medium bg-white px-3'>
                Baru di platform ini?
              </div>
            </div>

            <Link
              to='/register'
              className='inline-flex items-center justify-center w-full px-4 py-3 text-sm font-semibold transition-all duration-200 border border-slate-200 rounded-2xl text-slate-700 bg-slate-50/80 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 shadow-xs'
            >
              Create your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

