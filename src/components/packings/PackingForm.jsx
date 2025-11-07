import React from 'react';
import Autocomplete from '../common/Autocomplete';
import usePackingForm from '../../hooks/usePackingForm';
import usePackingOperations from '../../hooks/usePackingOperations';
import usePurchaseOrderAutocomplete from '../../hooks/usePurchaseOrderAutocomplete';

const PackingForm = ({ initialData = null, onSuccess, onCancel }) => {
  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    packingStatuses,
    items,
    statusLoading,
    itemsLoading,
    handleInputChange,
    addPackingBox,
    updatePackingBox,
    addItemToBox,
    updateBoxItem,
    removeBoxItem,
    removePackingBox,
    validateForm,
    resetForm,
    getFormattedData,
  } = usePackingForm(initialData);

  const { isCreating, isUpdating, createPackingData, updatePackingData } =
    usePackingOperations();
  const {
    options: purchaseOrderOptions,
    loading: purchaseOrderLoading,
    fetchOptions: searchPurchaseOrders,
  } = usePurchaseOrderAutocomplete({
    selectedValue: formData.purchaseOrderId,
  });

  const handlePurchaseOrderChange = (eventOrValue) => {
    const value = eventOrValue?.target
      ? eventOrValue.target.value
      : eventOrValue || '';
    handleInputChange('purchaseOrderId', value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedData = getFormattedData();

      if (initialData) {
        await updatePackingData(initialData.id, formattedData);
      } else {
        await createPackingData(formattedData);
      }

      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving packing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  const isLoading =
    statusLoading ||
    purchaseOrderLoading ||
    itemsLoading ||
    isSubmitting ||
    isCreating ||
    isUpdating;

  // Check if packing date should be editable based on status
  const currentStatus = packingStatuses.find(
    (status) => status.id === formData.statusId
  );
  const isDateEditable =
    !currentStatus ||
    currentStatus.status_code === 'PENDING PACKING' ||
    currentStatus.status_code === 'PROCESSING PACKING';

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Tanggal Packing */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Tanggal Packing *
          </label>
          <input
            type='date'
            value={formData.tanggal_packing}
            onChange={(e) =>
              handleInputChange('tanggal_packing', e.target.value)
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.tanggal_packing ? 'border-red-500' : 'border-gray-300'
            } ${!isDateEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            disabled={isLoading || !isDateEditable}
            title={
              !isDateEditable
                ? 'Tanggal packing tidak dapat diubah karena status sudah Complete'
                : ''
            }
          />
          {errors.tanggal_packing && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.tanggal_packing}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Status *
          </label>
          <select
            value={formData.statusId}
            onChange={(e) => handleInputChange('statusId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.statusId ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value=''>Pilih Status</option>
            {Array.isArray(packingStatuses) &&
              packingStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.status_name}
                </option>
              ))}
          </select>
          {errors.statusId && (
            <p className='mt-1 text-sm text-red-600'>{errors.statusId}</p>
          )}
        </div>

        {/* Purchase Order */}
        <div className='md:col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Purchase Order *
          </label>
          <Autocomplete
            label=''
            options={purchaseOrderOptions}
            value={formData.purchaseOrderId || ''}
            onChange={handlePurchaseOrderChange}
            placeholder='Cari Purchase Order'
            displayKey='label'
            valueKey='id'
            name='purchaseOrderId'
            loading={purchaseOrderLoading}
            onSearch={searchPurchaseOrders}
            showId
            disabled={isLoading}
            inputClassName={
              errors.purchaseOrderId
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : ''
            }
          />
          {errors.purchaseOrderId && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.purchaseOrderId}
            </p>
          )}
        </div>
      </div>

      {/* Packing Boxes */}
      <div>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>Packing Boxes *</h3>
          <button
            type='button'
            onClick={addPackingBox}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            disabled={isLoading}
          >
            Tambah Box
          </button>
        </div>

        {errors.packingBoxes && (
          <p className='mb-4 text-sm text-red-600'>{errors.packingBoxes}</p>
        )}

        <div className='space-y-6'>
          {formData.packingBoxes.map((box, boxIndex) => (
            <div
              key={boxIndex}
              className='p-6 border-2 border-gray-300 rounded-lg bg-gray-50'
            >
              <div className='flex justify-between items-center mb-4'>
                <h4 className='font-semibold text-gray-900'>
                  Box {boxIndex + 1}
                </h4>
                <button
                  type='button'
                  onClick={() => removePackingBox(boxIndex)}
                  className='text-red-600 hover:text-red-800'
                  disabled={isLoading}
                >
                  Hapus Box
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                {/* Box Number */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Nomor Box *
                  </label>
                  <input
                    type='text'
                    value={box.no_box}
                    onChange={(e) =>
                      updatePackingBox(boxIndex, 'no_box', e.target.value)
                    }
                    placeholder='BOX-001'
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`packingBoxes.${boxIndex}.no_box`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors[`packingBoxes.${boxIndex}.no_box`] && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errors[`packingBoxes.${boxIndex}.no_box`]}
                    </p>
                  )}
                </div>

                {/* Box Status */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Status Box
                  </label>
                  <select
                    value={box.statusId}
                    onChange={(e) =>
                      updatePackingBox(boxIndex, 'statusId', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    disabled={isLoading}
                  >
                    <option value=''>Pilih Status</option>
                    {Array.isArray(packingStatuses) &&
                      packingStatuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.status_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Box Items */}
              <div className='pl-4 border-l-4 border-blue-300'>
                <div className='flex justify-between items-center mb-3'>
                  <h5 className='font-medium text-gray-800'>Items dalam Box</h5>
                  <button
                    type='button'
                    onClick={() => addItemToBox(boxIndex)}
                    className='px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700'
                    disabled={isLoading}
                  >
                    Tambah Item
                  </button>
                </div>

                {errors[`packingBoxes.${boxIndex}.items`] && (
                  <p className='mb-2 text-sm text-red-600'>
                    {errors[`packingBoxes.${boxIndex}.items`]}
                  </p>
                )}

                <div className='space-y-3'>
                  {box.packingBoxItems.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className='p-3 bg-white rounded border border-gray-200'
                    >
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-sm font-medium text-gray-700'>
                          Item {itemIndex + 1}
                        </span>
                        <button
                          type='button'
                          onClick={() => removeBoxItem(boxIndex, itemIndex)}
                          className='text-xs text-red-600 hover:text-red-800'
                          disabled={isLoading}
                        >
                          Hapus
                        </button>
                      </div>

                      <div className='grid grid-cols-2 gap-3'>
                        {/* Nama Barang */}
                        <div>
                          <label className='block text-xs font-medium text-gray-700 mb-1'>
                            Nama Barang *
                          </label>
                          <input
                            type='text'
                            value={item.nama_barang}
                            onChange={(e) =>
                              updateBoxItem(
                                boxIndex,
                                itemIndex,
                                'nama_barang',
                                e.target.value
                              )
                            }
                            className={`w-full px-2 py-1 text-sm border rounded ${
                              errors[
                                `packingBoxes.${boxIndex}.items.${itemIndex}.nama_barang`
                              ]
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                            disabled={isLoading}
                          />
                        </div>

                        {/* Item */}
                        <div>
                          <label className='block text-xs font-medium text-gray-700 mb-1'>
                            Item *
                          </label>
                          <select
                            value={item.itemId}
                            onChange={(e) =>
                              updateBoxItem(
                                boxIndex,
                                itemIndex,
                                'itemId',
                                e.target.value
                              )
                            }
                            className={`w-full px-2 py-1 text-sm border rounded ${
                              errors[
                                `packingBoxes.${boxIndex}.items.${itemIndex}.itemId`
                              ]
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                            disabled={isLoading}
                          >
                            <option value=''>Pilih Item</option>
                            {Array.isArray(items) &&
                              items.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.nama_barang || inv.product_name || inv.name || inv.plu}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className='block text-xs font-medium text-gray-700 mb-1'>
                            Quantity *
                          </label>
                          <input
                            type='number'
                            min='1'
                            value={item.quantity}
                            onChange={(e) =>
                              updateBoxItem(
                                boxIndex,
                                itemIndex,
                                'quantity',
                                e.target.value
                              )
                            }
                            className={`w-full px-2 py-1 text-sm border rounded ${
                              errors[
                                `packingBoxes.${boxIndex}.items.${itemIndex}.quantity`
                              ]
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                            disabled={isLoading}
                          />
                        </div>

                        {/* Keterangan */}
                        <div>
                          <label className='block text-xs font-medium text-gray-700 mb-1'>
                            Keterangan
                          </label>
                          <input
                            type='text'
                            value={item.keterangan || ''}
                            onChange={(e) =>
                              updateBoxItem(
                                boxIndex,
                                itemIndex,
                                'keterangan',
                                e.target.value
                              )
                            }
                            placeholder='e.g., Full carton 1/1'
                            className='w-full px-2 py-1 text-sm border border-gray-300 rounded'
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200'>
        <button
          type='button'
          onClick={handleCancel}
          className='px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500'
          disabled={isLoading}
        >
          Batal
        </button>
        <button
          type='submit'
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
          disabled={isLoading}
        >
          {isLoading ? 'Menyimpan...' : initialData ? 'Update' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};

export default PackingForm;
