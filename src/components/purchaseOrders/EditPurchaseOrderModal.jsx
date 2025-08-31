import React, { useEffect, useState } from 'react';
import PurchaseOrderForm from './PurchaseOrderForm.jsx';

const EditPurchaseOrderModal = ({ isOpen, onClose, onSubmit, order }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    po_number: '',
    total_items: 0,
    tanggal_order: '',
    po_type: 'Regular',
    statusId: '',
    suratJalan: '',
    invoicePengiriman: '',
    suratPO: '',
    suratPenagihan: ''
  });

  useEffect(() => {
    if (order) {
      setFormData({
        customerId: order.customerId || '',
        po_number: order.po_number || '',
        total_items: order.total_items || 0,
        tanggal_order: order.tanggal_order ? new Date(order.tanggal_order).toISOString().split('T')[0] : '',
        po_type: order.po_type || 'Regular',
        statusId: order.statusId || '',
        suratJalan: order.suratJalan || '',
        invoicePengiriman: order.invoicePengiriman || '',
        suratPO: order.suratPO || '',
        suratPenagihan: order.suratPenagihan || ''
      });
    }
  }, [order]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(order.id, formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Edit Purchase Order
        </h3>

        <form onSubmit={handleSubmit}>
          <PurchaseOrderForm 
            formData={formData} 
            handleInputChange={handleInputChange} 
            isEditMode={true}
          />

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Update Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPurchaseOrderModal;
