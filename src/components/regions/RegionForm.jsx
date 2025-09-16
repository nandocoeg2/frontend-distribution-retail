import React from 'react';

const RegionForm = ({ formData, handleInputChange, handleSubmit, closeModal, isEdit = false }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Region Code *
          </label>
          <input
            type='text'
            name='kode_region'
            value={formData.kode_region}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='e.g., REG001'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Region Name *
          </label>
          <input
            type='text'
            name='nama_region'
            value={formData.nama_region}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='e.g., Jakarta'
          />
        </div>
      </div>

      <div className='mt-6 flex justify-end space-x-3'>
        <button
          type='button'
          onClick={closeModal}
          className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
        >
          Cancel
        </button>
        <button
          type='submit'
          className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
        >
          {isEdit ? 'Save Changes' : 'Add Region'}
        </button>
      </div>
    </form>
  );
};

export default RegionForm;

