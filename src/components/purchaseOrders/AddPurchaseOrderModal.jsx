import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService.js';
import PurchaseOrderForm from './PurchaseOrderForm.jsx';

const AddPurchaseOrderModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    po_number: '',
    total_items: 1,
    tanggal_order: new Date().toISOString().split('T')[0],
    po_type: '',
    statusId: '',
    suratJalan: '',
    invoicePengiriman: '',
    suratPO: '',
    suratPenagihan: ''
  });

  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
    }
  }, [isOpen]);

  const fetchStatuses = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get('http://localhost:5050/api/v1/statuses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setStatuses(response.data);
        
        // Set default status to 'PENDING' if available
        const pendingStatus = response.data.find(
          status => status.status_code === 'PENDING'
        );
        if (pendingStatus) {
          setFormData(prev => ({ ...prev, statusId: pendingStatus.id }));
        }
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
      setError('Failed to load statuses');
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
    e.preventDefault();

    // Simple validation
    if (!formData.customerId || !formData.po_number || !formData.statusId) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare the request payload
      const payload = {
        customerId: formData.customerId,
        po_number: formData.po_number,
        total_items: parseInt(formData.total_items),
        tanggal_order: new Date(formData.tanggal_order).toISOString(),
        po_type: formData.po_type,
        statusId: formData.statusId,
        suratJalan: formData.suratJalan,
        invoicePengiriman: formData.invoicePengiriman,
        suratPO: formData.suratPO,
        suratPenagihan: formData.suratPenagihan
      };

      const response = await axios.post('http://localhost:5050/api/v1/purchase-orders/', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
          'content-type': 'application/json'
        }
      });

      if (response.data) {
        // Call the parent onSubmit handler
        if (onSubmit) {
          await onSubmit(response.data);
        }
        
        // Reset form and close
        resetForm();
        onClose();
      }
    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to create purchase order'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      po_number: '',
      total_items: 1,
      tanggal_order: new Date().toISOString().split('T')[0],
      po_type: '',
      statusId: statuses.find(s => s.status_code === 'PENDING')?.id || '',
      suratJalan: '',
      invoicePengiriman: '',
      suratPO: '',
      suratPenagihan: ''
    });
    setError(null);
  };

  const generatePONumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const poNumber = `PO-${year}-${month}-${day}-${random}`;
    setFormData(prev => ({ ...prev, po_number: poNumber }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Add New Purchase Order
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <PurchaseOrderForm 
            formData={formData} 
            handleInputChange={handleInputChange}
            statuses={statuses}
            onGeneratePONumber={generatePONumber}
          />

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Add Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchaseOrderModal;
