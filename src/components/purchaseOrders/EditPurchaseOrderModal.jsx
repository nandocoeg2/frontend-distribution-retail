import React, { useEffect, useState } from 'react';
import PurchaseOrderForm from './PurchaseOrderForm.jsx';
import authService from '../../services/authService.js';
import axios from 'axios';

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
  const [statuses, setStatuses] = useState([]);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    fetchStatuses();
  }, []);

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
      
      // Fetch customer name if customerId exists
      if (order.customerId) {
        fetchCustomerName(order.customerId);
      }
    }
  }, [order]);

  const fetchStatuses = async () => {
    try {
      const token = authService.getToken();
      const response = await axios.get('http://localhost:5050/api/v1/statuses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setStatuses(response.data);
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
    }
  };

  const fetchCustomerName = async (customerId) => {
    try {
      const token = authService.getToken();
      const response = await axios.get(`http://localhost:5050/api/v1/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.data) {
        setCustomerName(response.data.name || '');
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
    }
  };

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
            statuses={statuses}
            isEditMode={true}
            customerName={customerName}
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
