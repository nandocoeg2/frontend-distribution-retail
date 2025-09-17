import React from 'react';

const SupplierForm = ({ formData, handleInputChange, handleSubmit, closeModal, isEdit = false }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Name *
          </label>
          <input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Code *
          </label>
          <input
            type='text'
            name='code'
            value={formData.code}
            onChange={handleInputChange}
            required
            placeholder='e.g., 2PZ1.J.0400.1.F'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Phone Number
          </label>
          <input
            type='tel'
            name='phoneNumber'
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Address
          </label>
          <input
            type='text'
            name='address'
            value={formData.address}
            onChange={handleInputChange}
            placeholder='e.g., JAKARTA BARAT'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        {/* Bank Information Section */}
        <div className='border-t pt-4 mt-4'>
          <h4 className='text-md font-medium text-gray-800 mb-3'>Bank Information</h4>
          
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Bank Name
              </label>
              <input
                type='text'
                name='bank.name'
                value={formData.bank?.name || ''}
                onChange={handleInputChange}
                placeholder='e.g., BCA'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Account Number
              </label>
              <input
                type='text'
                name='bank.account'
                value={formData.bank?.account || ''}
                onChange={handleInputChange}
                placeholder='e.g., 123456789'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Account Holder
              </label>
              <input
                type='text'
                name='bank.holder'
                value={formData.bank?.holder || ''}
                onChange={handleInputChange}
                placeholder='e.g., EFG PT'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
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
          {isEdit ? 'Save Changes' : 'Add Supplier'}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;

