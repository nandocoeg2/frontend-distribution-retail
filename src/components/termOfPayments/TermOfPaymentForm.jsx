const TermOfPaymentForm = ({ formData, handleInputChange, handleSubmit, closeModal, isEdit = false }) => {
  const handleBatasHariKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
    if (
      [8, 9, 13, 27, 46].includes(e.keyCode) ||
      (e.keyCode >= 35 && e.keyCode <= 40) ||
      (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode))
    ) {
      return;
    }
    // Block non-digit keys
    if (e.key < '0' || e.key > '9') {
      e.preventDefault();
    }
  };

  const handleBatasHariChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    handleInputChange({
      ...e,
      target: { ...e.target, name: 'batas_hari', value: digitsOnly }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Code *
          </label>
          <input
            type='text'
            name='kode_top'
            value={formData.kode_top}
            onChange={handleInputChange}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='cth. TOP30'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Days Limit *
          </label>
          <input
            type='text'
            inputMode='numeric'
            pattern='[0-9]*'
            name='batas_hari'
            value={formData.batas_hari}
            onChange={handleBatasHariChange}
            onKeyDown={handleBatasHariKeyDown}
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='cth. 30'
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
          {isEdit ? 'Save Changes' : 'Add Term of Payment'}
        </button>
      </div>
    </form>
  );
};

export default TermOfPaymentForm;
