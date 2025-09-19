import React from 'react';
import Autocomplete from '@/components/common/Autocomplete';

const UserForm = ({ formData, handleInputChange, handleSubmit, closeModal, isSubmitting, roles = [] }) => {
  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Username */}
        <div>
          <label htmlFor='username' className='block text-sm font-medium text-gray-700 mb-1'>
            Username *
          </label>
          <input
            type='text'
            id='username'
            name='username'
            value={formData.username}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter username'
          />
        </div>

        {/* First Name */}
        <div>
          <label htmlFor='firstName' className='block text-sm font-medium text-gray-700 mb-1'>
            First Name *
          </label>
          <input
            type='text'
            id='firstName'
            name='firstName'
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter first name'
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor='lastName' className='block text-sm font-medium text-gray-700 mb-1'>
            Last Name *
          </label>
          <input
            type='text'
            id='lastName'
            name='lastName'
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter last name'
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
            Email *
          </label>
          <input
            type='email'
            id='email'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter email address'
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>
            Password *
          </label>
          <input
            type='password'
            id='password'
            name='password'
            value={formData.password}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter password'
          />
        </div>

        {/* Role ID */}
        <div>
          <Autocomplete
            options={roles}
            value={formData.roleId}
            onChange={handleInputChange}
            placeholder="Select role"
            label="Role"
            required={true}
            displayKey="name"
            valueKey="id"
            name="roleId"
          />
        </div>


        {/* Is Active */}
        <div>
          <label className='flex items-center'>
            <input
              type='checkbox'
              name='isActive'
              checked={formData.isActive}
              onChange={handleInputChange}
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
            <span className='ml-2 text-sm text-gray-700'>Active User</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200'>
        <button
          type='button'
          onClick={closeModal}
          className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          Cancel
        </button>
        <button
          type='submit'
          disabled={isSubmitting}
          className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting ? 'Saving...' : 'Save User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
