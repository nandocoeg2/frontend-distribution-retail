import React from 'react';
import usePackingForm from '../../hooks/usePackingForm';
import usePackingOperations from '../../hooks/usePackingOperations';

const PackingForm = ({ initialData = null, onSuccess, onCancel }) => {
  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    packingStatuses,
    purchaseOrders,
    inventories,
    statusLoading,
    poLoading,
    inventoryLoading,
    handleInputChange,
    addPackingItem,
    updatePackingItem,
    removePackingItem,
    validateForm,
    resetForm,
    getFormattedData
  } = usePackingForm(initialData);

  const {
    isCreating,
    isUpdating,
    createPackingData,
    updatePackingData
  } = usePackingOperations();

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

  const isLoading = statusLoading || poLoading || inventoryLoading || isSubmitting || isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tanggal Packing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Packing *
          </label>
          <input
            type="date"
            value={formData.tanggal_packing}
            onChange={(e) => handleInputChange('tanggal_packing', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.tanggal_packing ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.tanggal_packing && (
            <p className="mt-1 text-sm text-red-600">{errors.tanggal_packing}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <option value="">Pilih Status</option>
            {Array.isArray(packingStatuses) && packingStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.status_name}
              </option>
            ))}
          </select>
          {errors.statusId && (
            <p className="mt-1 text-sm text-red-600">{errors.statusId}</p>
          )}
        </div>

        {/* Purchase Order */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Order *
          </label>
          <select
            value={formData.purchaseOrderId}
            onChange={(e) => handleInputChange('purchaseOrderId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.purchaseOrderId ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value="">Pilih Purchase Order</option>
            {Array.isArray(purchaseOrders) && purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.po_number} - {po.supplier?.company_name || 'N/A'}
              </option>
            ))}
          </select>
          {errors.purchaseOrderId && (
            <p className="mt-1 text-sm text-red-600">{errors.purchaseOrderId}</p>
          )}
        </div>
      </div>

      {/* Packing Items */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Packing Items *</h3>
          <button
            type="button"
            onClick={addPackingItem}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Tambah Item
          </button>
        </div>

        {errors.packingItems && (
          <p className="mb-4 text-sm text-red-600">{errors.packingItems}</p>
        )}

        <div className="space-y-4">
          {formData.packingItems.map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removePackingItem(index)}
                  className="text-red-600 hover:text-red-800"
                  disabled={isLoading}
                >
                  Hapus
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Nama Barang */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Barang *
                  </label>
                  <input
                    type="text"
                    value={item.nama_barang}
                    onChange={(e) => updatePackingItem(index, 'nama_barang', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`packingItems.${index}.nama_barang`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors[`packingItems.${index}.nama_barang`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`packingItems.${index}.nama_barang`]}</p>
                  )}
                </div>

                {/* Inventory */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inventory *
                  </label>
                  <select
                    value={item.inventoryId}
                    onChange={(e) => updatePackingItem(index, 'inventoryId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`packingItems.${index}.inventoryId`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Pilih Inventory</option>
                    {Array.isArray(inventories) && inventories.map((inventory) => (
                      <option key={inventory.id} value={inventory.id}>
                        {inventory.product_name}
                      </option>
                    ))}
                  </select>
                  {errors[`packingItems.${index}.inventoryId`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`packingItems.${index}.inventoryId`]}</p>
                  )}
                </div>

                {/* Total Qty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.total_qty}
                    onChange={(e) => updatePackingItem(index, 'total_qty', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`packingItems.${index}.total_qty`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors[`packingItems.${index}.total_qty`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`packingItems.${index}.total_qty`]}</p>
                  )}
                </div>

                {/* Jumlah Carton */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah Carton *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.jumlah_carton}
                    onChange={(e) => updatePackingItem(index, 'jumlah_carton', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`packingItems.${index}.jumlah_carton`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors[`packingItems.${index}.jumlah_carton`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`packingItems.${index}.jumlah_carton`]}</p>
                  )}
                </div>

                {/* Isi Per Carton */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Isi Per Carton *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.isi_per_carton}
                    onChange={(e) => updatePackingItem(index, 'isi_per_carton', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`packingItems.${index}.isi_per_carton`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors[`packingItems.${index}.isi_per_carton`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`packingItems.${index}.isi_per_carton`]}</p>
                  )}
                </div>

                {/* No Box */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No Box *
                  </label>
                  <input
                    type="text"
                    value={item.no_box}
                    onChange={(e) => updatePackingItem(index, 'no_box', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`packingItems.${index}.no_box`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors[`packingItems.${index}.no_box`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`packingItems.${index}.no_box`]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={isLoading}
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Menyimpan...' : (initialData ? 'Update' : 'Simpan')}
        </button>
      </div>
    </form>
  );
};

export default PackingForm;
