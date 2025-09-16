import React from 'react';

const GroupCustomerForm = ({ formData, handleInputChange, handleSubmit, closeModal, isEdit = false }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Group Code *
          </label>
          <input
            type='text'
            name='kode_group'
            value={formData.kode_group}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='e.g., GC001'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Group Name *
          </label>
          <input
            type='text'
            name='nama_group'
            value={formData.nama_group}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='e.g., Group Customer 1'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Address
          </label>
          <textarea
            name='alamat'
            value={formData.alamat}
            onChange={handleInputChange}
            rows="3"
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='e.g., Alamat Group Customer 1'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            NPWP
          </label>
          <input
            type='text'
            name='npwp'
            value={formData.npwp}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='e.g., 1234567890123456'
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
          {isEdit ? 'Save Changes' : 'Add Group Customer'}
        </button>
      </div>
    </form>
  );
};

export default GroupCustomerForm;

