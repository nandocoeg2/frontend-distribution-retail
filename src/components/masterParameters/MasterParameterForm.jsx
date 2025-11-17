import React from 'react';

const MasterParameterForm = ({ formData, handleInputChange, handleSubmit, closeModal, isEdit = false }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className='space-y-4'>
        {/* Key Field */}
        <div>
          <label htmlFor='key' className='block text-sm font-medium text-gray-700'>
            Key <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='key'
            name='key'
            value={formData.key}
            onChange={handleInputChange}
            required
            disabled={isEdit}
            className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed font-mono'
            placeholder='UPPER_SNAKE_CASE'
          />
          <p className='mt-1 text-xs text-gray-500'>
            Use UPPER_SNAKE_CASE format (e.g., GOOGLE_API_KEY). Cannot be changed after creation.
          </p>
        </div>

        {/* Value Field */}
        <div>
          <label htmlFor='value' className='block text-sm font-medium text-gray-700'>
            Value <span className='text-red-500'>*</span>
          </label>
          <textarea
            id='value'
            name='value'
            value={formData.value}
            onChange={handleInputChange}
            required
            rows={3}
            className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
            placeholder='Enter parameter value'
          />
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor='description' className='block text-sm font-medium text-gray-700'>
            Description
          </label>
          <textarea
            id='description'
            name='description'
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
            placeholder='Describe the purpose of this parameter'
          />
        </div>
      </div>

      <div className='mt-6 flex justify-end space-x-3'>
        <button
          type='button'
          onClick={closeModal}
          className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          Cancel
        </button>
        <button
          type='submit'
          className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          {isEdit ? 'Update' : 'Create'} Parameter
        </button>
      </div>
    </form>
  );
};

export default MasterParameterForm;
