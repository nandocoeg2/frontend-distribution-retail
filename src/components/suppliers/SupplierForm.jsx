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
            placeholder='cth. PT Sumber Makmur'
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
            placeholder='cth. SUP001'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Supplier Code Letter
          </label>
          <input
            type='text'
            name='supplier_code_letter'
            value={formData.supplier_code_letter}
            onChange={handleInputChange}
            maxLength={5}
            placeholder='cth. ABCDE'
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
            required
            inputMode='tel'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='cth. 08123456789'
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
            placeholder='cth. Jl. Industri No. 5, Surabaya'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Description
          </label>
          <input
            type='text'
            name='description'
            value={formData.description || ''}
            onChange={handleInputChange}
            placeholder='cth. Supplier bahan baku utama'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Email
          </label>
          <input
            type='email'
            name='email'
            value={formData.email || ''}
            onChange={handleInputChange}
            placeholder='cth. supplier@email.com'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Fax
          </label>
          <input
            type='tel'
            name='fax'
            value={formData.fax || ''}
            onChange={handleInputChange}
            placeholder='cth. 031-5551234'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        {/* Company Information Section */}
        <div className='border-t pt-4 mt-4'>
          <h4 className='text-md font-medium text-gray-800 mb-3'>Company Information</h4>
          
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Direktur
              </label>
              <input
                type='text'
                name='direktur'
                value={formData.direktur || ''}
                onChange={handleInputChange}
                placeholder='cth. Andi Wijaya'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                NPWP
              </label>
              <input
                type='text'
                name='npwp'
                value={formData.npwp || ''}
                onChange={handleInputChange}
                placeholder='e.g., 01.234.567.8-901.000'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                ID TKU
              </label>
              <input
                type='text'
                name='id_tku'
                value={formData.id_tku || ''}
                onChange={handleInputChange}
                placeholder='cth. 0000000000000000'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Logo
              </label>
              <input
                type='file'
                accept='image/*'
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleInputChange({
                        target: {
                          name: 'logo',
                          value: reader.result
                        }
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              {formData.logo && (
                <div className='mt-2'>
                  <img 
                    src={formData.logo} 
                    alt='Logo preview' 
                    className='h-20 w-20 object-contain border border-gray-300 rounded'
                  />
                </div>
              )}

            </div>
          </div>
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
                placeholder='cth. BCA'
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
                placeholder='cth. 1234567890'
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
                placeholder='cth. PT Sumber Makmur'
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

