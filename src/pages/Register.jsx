import React, { useState } from 'react';

import { Link } from 'react-router-dom';

import useRegister from '../hooks/useRegister';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleSubmit,
    clearError,
    isFormValid
  } = useRegister();


  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      case 5:
        return 'Very Strong';
      default:
        return 'Very Weak';
    }
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 0:
        return 'text-red-500';
      case 1:
        return 'text-red-400';
      case 2:
        return 'text-yellow-500';
      case 3:
        return 'text-blue-500';
      case 4:
        return 'text-green-500';
      case 5:
        return 'text-green-600';
      default:
        return 'text-red-500';
    }
  };


  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0'>
        <div className='absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl'></div>
        <div className='absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl'></div>
      </div>

      <div className='relative max-w-lg w-full'>
        {/* Logo/Brand Section */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-2xl shadow-purple-500/25 mb-6'>
            <span className='text-2xl text-white'>✨</span>
          </div>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent mb-2'>
            Join Our Platform
          </h1>
          <p className='text-slate-400 text-lg'>
            Create your account and get started
          </p>
        </div>

        {/* Register Form */}
        <div className='bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20'>
          {errors.general && (
            <div className='mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-2xl backdrop-blur-sm'>
              <div className='flex items-center space-x-2'>
                <HeroIcon name='exclamation-circle' className='w-5 h-5' />
                <span className='font-medium'>{errors.general}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Username */}
            <div>
              <label
                htmlFor='username'
                className='block text-sm font-semibold text-white mb-3'
              >
                Username
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <HeroIcon name='user-circle' className='w-5 h-5 text-slate-400' />
                </div>
                <input
                  type='text'
                  id='username'
                  name='username'
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 ${
                    errors.username ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder='Choose a username'
                />
              </div>
              {errors.username && (
                <p className='mt-2 text-sm text-red-300'>{errors.username}</p>
              )}
            </div>

            {/* First Name & Last Name */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='firstName'
                  className='block text-sm font-semibold text-white mb-3'
                >
                  First Name
                </label>
                <input
                  type='text'
                  id='firstName'
                  name='firstName'
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className={`w-full px-4 py-4 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 ${
                    errors.firstName ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder='First name'
                />
                {errors.firstName && (
                  <p className='mt-2 text-sm text-red-300'>{errors.firstName}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor='lastName'
                  className='block text-sm font-semibold text-white mb-3'
                >
                  Last Name
                </label>
                <input
                  type='text'
                  id='lastName'
                  name='lastName'
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className={`w-full px-4 py-4 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 ${
                    errors.lastName ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder='Last name'
                />
                {errors.lastName && (
                  <p className='mt-2 text-sm text-red-300'>{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-semibold text-white mb-3'
              >
                Email Address
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <HeroIcon name='user-circle' className='w-5 h-5 text-slate-400' />
                </div>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 ${
                    errors.email ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder='Enter your email address'
                />
              </div>
              {errors.email && (
                <p className='mt-2 text-sm text-red-300'>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-semibold text-white mb-3'
              >
                Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <HeroIcon name='lock-closed' className='w-5 h-5 text-slate-400' />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className={`w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 ${
                    errors.password ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder='Create a strong password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors'
                >
                    {showPassword ? (
                      <HeroIcon name='eye-slash' className='w-5 h-5' />
                    ) : (
                      <HeroIcon name='eye' className='w-5 h-5' />
                    )}                </button>
              </div>
              {errors.password && (
                <p className='mt-2 text-sm text-red-300'>{errors.password}</p>
              )}
              {formData.password && (
                <div className='mt-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-xs text-slate-400'>
                      Password strength:
                    </span>
                    <span
                      className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength)}`}
                    >
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className='w-full bg-white/10 rounded-full h-2 mt-1'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength >= 4
                          ? 'bg-green-500'
                          : passwordStrength >= 3
                            ? 'bg-blue-500'
                            : passwordStrength >= 2
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                      }`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-semibold text-white mb-3'
              >
                Confirm Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <HeroIcon name='check' className='w-5 h-5 text-slate-400' />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id='confirmPassword'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  className={`w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 ${
                    errors.confirmPassword ? 'border-red-500/50' : 'border-white/20'
                  }`}
                  placeholder='Confirm your password'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors'
                >
                    {showConfirmPassword ? (
                      <HeroIcon name='eye-slash' className='w-5 h-5' />
                    ) : (
                      <HeroIcon name='eye' className='w-5 h-5' />
                    )}                </button>
              </div>
              {errors.confirmPassword && (
                <p className='mt-2 text-sm text-red-300'>{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className='mt-1 text-xs text-red-400'>
                    Passwords do not match
                  </p>
                )}
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className='mt-1 text-xs text-green-400'>
                    Passwords match ✓
                  </p>
                )}
            </div>


            {/* Submit Button */}
            <div>
              <button
                type='submit'
                disabled={isLoading || !isFormValid()}
                className='group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/25'
              >
                {isLoading ? (
                  <div className='flex items-center space-x-2'>
                    <HeroIcon name='arrow-path' className='animate-spin h-5 w-5 text-white' />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className='flex items-center space-x-2'>
                    <span>Create Account</span>
                    <HeroIcon name='arrow-right' className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
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
              <div className='relative flex justify-center text-sm'>

              </div>
            </div>

            <div className='mt-6'>
              <Link
                to='/login'
                className='inline-flex items-center justify-center w-full py-3 px-4 border border-white/20 rounded-2xl text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200'
              >
                <span className='mr-2'>🚀</span>
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
